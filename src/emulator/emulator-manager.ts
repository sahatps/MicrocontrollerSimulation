import { AVRRunner } from "./avr-runner";
import { CompileResult, compileToHex } from "./compiler";
import { HackCable } from "../main";
import { MicroPythonRunner, SimulatedHttpResponse } from "./micropython-runner";

export class EmulatorManager {

    private readonly hackcable: HackCable;
    constructor(hackcable: HackCable) {
        this.hackcable = hackcable;
    }

    private runner: AVRRunner | undefined;
    private loadingRunner: AVRRunner | undefined;
    private micropythonRunner: MicroPythonRunner | undefined;
    private boardType: 'arduino' | 'esp32' = 'arduino';

    // Context for C++ to Python conversion
    private currentConversionContext: {
        constants: Map<string, number>;
        outputPins: Map<number, string>;
        inputPins: Map<number, string>;
        analogPins: Map<number, string>;
        pinNameToNum: Map<string, number>;
        constantNames: Map<string, number>;
        modbusSensors: Set<string>;
        sht31Sensors: Set<string>;
        bh1750Sensors: Set<string>;
        helperFunctionNames: Set<string>;
    } | null = null;


    static async compileCode(code: string): Promise<CompileResult> {
        return compileToHex(code);
    }

    setBoardType(type: 'arduino' | 'esp32') {
        this.boardType = type;
        console.log('[EmulatorManager] Board type set to:', type);
    }

    async httpGet(path: string): Promise<SimulatedHttpResponse> {
        if (this.boardType !== 'esp32') {
            return {
                id: -1,
                path,
                status: 400,
                contentType: 'text/plain',
                body: 'Simulated HTTP is only available for ESP32 mode',
            };
        }
        if (!this.micropythonRunner) {
            return {
                id: -1,
                path,
                status: 503,
                contentType: 'text/plain',
                body: 'MicroPython runtime is not running',
            };
        }
        return this.micropythonRunner.httpGet(path);
    }

    async compileAndLoadCode(code: string): Promise<CompileResult> {
        if (this.boardType === 'esp32') {
            // For ESP32, we don't compile - we run MicroPython directly
            console.log('[EmulatorManager] Loading MicroPython code for ESP32');
            return { hex: '', stdout: '', stderr: '' };
        } else {
            const data = await compileToHex(code);
            console.log(data)
            this.loadCode(data.hex);
            return data;
        }
    }

    loadCode(hexCode: string) {
        this.loadingRunner = new AVRRunner(hexCode.replace(/\n\n/g, "\n"));
    }

    async run(code?: string) {
        console.log('[EmulatorManager] Starting execution...');
        console.log('[EmulatorManager] Board type:', this.boardType);
        this.hackcable.deactivateAllActuators();

        if (this.boardType === 'esp32') {
            try {
                // Run MicroPython for ESP32
                if (!this.micropythonRunner) {
                    this.micropythonRunner = new MicroPythonRunner();
                    this.bindESP32RuntimeCallbacks();
                    await this.micropythonRunner.initialize();
                }
                this.bindESP32RuntimeCallbacks();

                if (code) {
                    console.log('[EmulatorManager] Running MicroPython code...');
                    this.setupESP32Hardware();

                    // Convert Arduino-style code to MicroPython if needed
                    const pythonCode = this.convertToPython(code);
                    console.log('[EmulatorManager] Converted code:', pythonCode);
                    // Helpful debug: print with line numbers so SyntaxError line N is immediately actionable
                    const pythonLines = pythonCode.split('\n');
                    try {
                        const numbered = pythonCode
                            .split('\n')
                            .map((l, i) => `${String(i + 1).padStart(4, ' ')}|${l}`)
                            .join('\n');
                        console.log('[EmulatorManager] Converted code (numbered):\n' + numbered);
                    } catch { }

                    try {
                        await this.micropythonRunner.runCode(pythonCode);
                    } catch (error) {
                        const raw = error instanceof Error ? error.message : String(error);
                        const m = raw.match(/File "<stdin>", line (\d+)/) || raw.match(/\bline (\d+)\b/);
                        if (m) {
                            const lineNo = parseInt(m[1], 10);
                            const lineText = pythonLines[lineNo - 1] ?? '';
                            const ctx0 = pythonLines[lineNo - 2] ?? '';
                            const ctx1 = pythonLines[lineNo - 1] ?? '';
                            const ctx2 = pythonLines[lineNo] ?? '';
                            const context = [
                                `${String(lineNo - 1).padStart(4, ' ')}|${ctx0}`,
                                `${String(lineNo).padStart(4, ' ')}|${ctx1}`,
                                `${String(lineNo + 1).padStart(4, ' ')}|${ctx2}`,
                            ].join('\n');
                            this.hackcable.serialDataReceived(
                                `[MicroPython SyntaxError] line ${lineNo}: ${lineText}\n` +
                                `[MicroPython SyntaxError] context:\n${context}\n`
                            );
                        } else {
                            this.hackcable.serialDataReceived(`[MicroPython Error] ${raw}\n`);
                        }
                        throw error;
                    }
                    console.log('[EmulatorManager] MicroPython execution started');
                }
            } catch (error) {
                console.error('[EmulatorManager] MicroPython error:', error);
                const message = error instanceof Error ? error.message : String(error);
                this.hackcable.serialDataReceived(`[MicroPython Error] ${message}\n`);
            }
        } else {
            // Run AVR for Arduino
            this.stop();
            this.runner = this.loadingRunner;
            console.log('[EmulatorManager] Runner loaded:', this.runner ? 'YES' : 'NO');
            this.setupHardware();
            // Callback called every 500 000 cpu cycles
            this.runner?.execute(() => { });
            console.log('[EmulatorManager] Execution started');
        }
    }

    private findMatchingBrace(source: string, openBraceIndex: number): number {
        let depth = 0;
        let inSingle = false;
        let inDouble = false;

        for (let i = openBraceIndex; i < source.length; i++) {
            const ch = source[i];
            const prev = i > 0 ? source[i - 1] : '';

            if (ch === "'" && !inDouble && prev !== '\\') {
                inSingle = !inSingle;
                continue;
            }
            if (ch === '"' && !inSingle && prev !== '\\') {
                inDouble = !inDouble;
                continue;
            }
            if (inSingle || inDouble) continue;

            if (ch === '{') depth++;
            if (ch === '}') {
                depth--;
                if (depth === 0) return i;
            }
        }
        return -1;
    }

    private rewriteSetupWebServerLambdas(setupBody: string): {
        setupBody: string;
        routeHandlers: Array<{ name: string; body: string }>;
    } {
        const routeHandlers: Array<{ name: string; body: string }> = [];
        const routes: Array<{
            start: number;
            end: number;
            serverVar: string;
            pathExpr: string;
            body: string;
            handlerName: string;
        }> = [];

        const routeStart = /([A-Za-z_]\w*)\s*\.\s*on\s*\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*,\s*\[\]\s*\(\s*\)\s*\{/g;
        let m: RegExpExecArray | null;

        while ((m = routeStart.exec(setupBody)) !== null) {
            const serverVar = m[1];
            const pathExpr = m[2];
            const openBraceIndex = routeStart.lastIndex - 1;
            const closeBraceIndex = this.findMatchingBrace(setupBody, openBraceIndex);
            if (closeBraceIndex < 0) continue;

            let end = closeBraceIndex + 1;
            while (end < setupBody.length && /\s/.test(setupBody[end])) end++;
            if (setupBody[end] === ')') end++;
            while (end < setupBody.length && /\s/.test(setupBody[end])) end++;
            if (setupBody[end] === ';') end++;

            const body = setupBody.slice(openBraceIndex + 1, closeBraceIndex);
            const handlerName = `_hc_route_${serverVar}_${routes.length}`;
            routes.push({
                start: m.index,
                end,
                serverVar,
                pathExpr,
                body,
                handlerName,
            });
            routeStart.lastIndex = end;
        }

        if (routes.length === 0) {
            return { setupBody, routeHandlers };
        }

        let rewritten = '';
        let cursor = 0;
        for (const route of routes) {
            rewritten += setupBody.slice(cursor, route.start);
            rewritten += `${route.serverVar}.on(${route.pathExpr}, ${route.handlerName});`;
            cursor = route.end;
            routeHandlers.push({ name: route.handlerName, body: route.body });
        }
        rewritten += setupBody.slice(cursor);

        return { setupBody: rewritten, routeHandlers };
    }

    private emitConvertedFunction(name: string, body: string): string {
        let out = `def ${name}():\n`;
        const lines = this.expandCompactBodyLines(body);
        let braceDepth = 0;
        let hasFnContent = false;

        for (const line of lines) {
            const closeBraces = (line.match(/\}/g) || []).length;
            const openBraces = (line.match(/\{/g) || []).length;

            braceDepth -= closeBraces;
            if (braceDepth < 0) braceDepth = 0;

            const converted = this.convertLine(line);
            if (converted.trim()) {
                const indent = '    '.repeat(braceDepth + 1);
                out += indent + converted + '\n';
                hasFnContent = true;
            }

            braceDepth += openBraces;
        }

        if (!hasFnContent) out += '    pass\n';
        out += '\n';
        return out;
    }

    private convertToPython(code: string): string {
        // Line-by-line C++ to MicroPython converter with brace tracking for nested blocks

        // Check if it's already Python code
        if (code.includes('from machine import') || code.includes('import machine')) {
            return code;
        }

        // Normalize some multi-line Arduino constructs into single-line statements so the line-based converter
        // can handle them reliably (notably Serial.printf which is often wrapped across lines).
        // Example (Greenhouse):
        //   Serial.printf("Temp: ...\n",
        //     a, b, c);
        // becomes:
        //   Serial.printf("Temp: ...\n", a, b, c);
        code = code.replace(/Serial\s*\.\s*printf\s*\([\s\S]*?\)\s*;/g, (m) => {
            return m.replace(/\s*\r?\n\s*/g, ' ');
        });

        // Detect HandySense/MCP23008 usage for I2C relay emulation
        const usesMCP23008 = code.includes('MCP23008') || code.includes('HandySense.h');

        // Try to extract setup and loop sections
        const setupMatch = code.match(/void\s+setup\s*\(\s*\)\s*\{([\s\S]*?)\n\}/);
        const loopMatch = code.match(/void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)\n\}/);

        if (!setupMatch && !loopMatch) {
            // Not Arduino code, return as-is
            return code;
        }

        // Extract all constant definitions: const int NAME = value; or #define NAME value
        const constants = new Map<string, number>();

        // Match #define statements
        const defineMatches = code.matchAll(/#define\s+([A-Z_][A-Z0-9_]*)\s+(\d+)/g);
        for (const match of defineMatches) {
            constants.set(match[1], parseInt(match[2]));
        }

        // Match const int/float declarations
        const constMatches = code.matchAll(/const\s+(?:int|float|double)\s+([A-Z_][A-Z0-9_]*)\s*=\s*([\d.]+)/g);
        for (const match of constMatches) {
            constants.set(match[1], parseFloat(match[2]));
        }

        // Check if code uses analogRead (need ADC import)
        const usesAnalog = code.includes('analogRead');

        // --- Detect Bfarm sensor variable types ---
        // ModbusMaster varName (RS485)
        const modbusSensors = new Set<string>();
        for (const m of code.matchAll(/ModbusMaster\s+(\w+)\s*;/g)) modbusSensors.add(m[1]);

        // SHT31 / Adafruit_SHT31 varName (I2C temp+humidity)
        const sht31Sensors = new Set<string>();
        for (const m of code.matchAll(/(?:Adafruit_)?SHT31\s+(\w+)\s*[;(]/g)) sht31Sensors.add(m[1]);

        // BH1750 varName (I2C light)
        const bh1750Sensors = new Set<string>();
        for (const m of code.matchAll(/BH1750\s+(\w+)\s*[;(]/g)) bh1750Sensors.add(m[1]);

        // Detect user-defined helper functions (not setup/loop) so we can emit them in Python
        // This is critical for examples where loop() mostly calls helper functions (e.g. greenhouse controller).
        const helperFunctionNames = new Set<string>();
        const helperFunctions: Array<{ name: string; body: string }> = [];
        for (const m of code.matchAll(/^(?:void|float|int|double|uint8_t|uint16_t|bool|String)\s+(\w+)\s*\([^)]*\)\s*\{/gm)) {
            const name = m[1];
            if (name === 'setup' || name === 'loop') continue;
            helperFunctionNames.add(name);
        }

        // Extract helper function bodies for void functions only (best-effort, brace-balanced).
        // Keeps scope limited: we only support `void fn(){...}` conversion for now.
        for (const m of code.matchAll(/^void\s+(\w+)\s*\(\s*\)\s*\{/gm)) {
            const name = m[1];
            if (name === 'setup' || name === 'loop') continue;

            const startIdx = (m.index ?? 0) + m[0].length;
            let i = startIdx;
            let depth = 1;
            while (i < code.length && depth > 0) {
                const ch = code[i];
                if (ch === '{') depth++;
                else if (ch === '}') depth--;
                i++;
            }
            // i is positioned just after the matching closing brace (or EOF)
            const body = code.substring(startIdx, Math.max(startIdx, i - 1));
            helperFunctions.push({ name, body });
        }

        const usesRS485 = modbusSensors.size > 0 || code.includes('Serial2');
        const usesI2CSensors = sht31Sensors.size > 0 || bh1750Sensors.size > 0;

        // If sketch uses Cron, try to capture the scheduled function name so we can emulate it in MicroPython.
        // We can't run Arduino Cron in this simulator, so we approximate by calling the scheduled function in a loop.
        let cronScheduledFn: string | null = null;
        const cronFnMatch = code.match(/\bCron\s*\.\s*create\s*\(\s*"[^"]*"\s*,\s*(\w+)\s*,/);
        if (cronFnMatch) cronScheduledFn = cronFnMatch[1];

        // Extract Serial2 TX/RX pins from #define (default to HandySense Pro pins 16/17)
        let serial2Rx = 16, serial2Tx = 17;
        const rxDef = code.match(/#define\s+RXD\s+(\d+)/); if (rxDef) serial2Rx = parseInt(rxDef[1]);
        const txDef = code.match(/#define\s+TXD\s+(\d+)/); if (txDef) serial2Tx = parseInt(txDef[1]);

        // Extract ModbusMaster slaveIds from .begin(slaveId, ...) calls
        const modbusSlaveIds = new Map<string, number>();
        for (const varName of modbusSensors) {
            const m = code.match(new RegExp(varName + '\\.begin\\s*\\(\\s*(\\d+)'));
            modbusSlaveIds.set(varName, m ? parseInt(m[1]) : 1);
        }
        const relayPins = this.extractRelayPins(code);

        // Build import list
        const importParts = ['Pin'];
        if (usesAnalog) importParts.push('ADC');
        if (usesRS485) importParts.push('UART');
        if (usesI2CSensors) importParts.push('I2C');

        let pythonCode = `from machine import ${importParts.join(', ')}\nimport time\nimport json\nimport js\n\n`;
        pythonCode += [
            '_hc_notices = {}',
            'def _hc_notice_once(name):',
            '    if name in _hc_notices:',
            '        return',
            '    _hc_notices[name] = 1',
            '    Serial.println("[MicroPython Notice] Unsupported API no-op: " + str(name))',
            '',
            'def String(value="", digits=None):',
            '    try:',
            '        if digits is not None:',
            '            return ("{0:." + str(int(digits)) + "f}").format(float(value))',
            '    except Exception:',
            '        pass',
            '    return str(value)',
            '',
            'def constrain(val, low, high):',
            '    return max(low, min(high, val))',
            '',
            'def millis():',
            '    try:',
            '        return int(js.Date.now())',
            '    except Exception:',
            '        return int(time.time() * 1000)',
            '',
            'WL_CONNECTED = 3',
            '',
            'class _WiFiShim:',
            '    def __init__(self):',
            '        self._connected = False',
            '        self._ssid = ""',
            '        self._sta_ip = "192.168.4.2"',
            '        self._ap_enabled = False',
            '        self._ap_ssid = ""',
            '        self._ap_ip = "192.168.4.1"',
            '    def begin(self, *args):',
            '        if len(args) > 0:',
            '            self._ssid = str(args[0])',
            '        self._connected = True',
            '        return WL_CONNECTED',
            '    def status(self):',
            '        return WL_CONNECTED if self._connected else 0',
            '    def localIP(self):',
            '        return self._sta_ip if self._connected else "0.0.0.0"',
            '    def softAP(self, *args):',
            '        if len(args) > 0:',
            '            self._ap_ssid = str(args[0])',
            '        self._ap_enabled = True',
            '        return True',
            '    def softAPIP(self):',
            '        return self._ap_ip if self._ap_enabled else "0.0.0.0"',
            '',
            'class _WebServerShim:',
            '    def __init__(self, port=80):',
            '        self._port = int(port) if port is not None else 80',
            '        self._routes = {}',
            '        self._pending = None',
            '        self._sent = False',
            '    def begin(self, *args):',
            '        return True',
            '    def on(self, path, handler):',
            '        self._routes[str(path)] = handler',
            '    def arg(self, name):',
            '        if self._pending is None:',
            '            return ""',
            '        query = self._pending.get("query", {})',
            '        return str(query.get(str(name), ""))',
            '    def send(self, status=200, content_type="text/plain", payload=""):',
            '        self._sent = True',
            '        status_code = int(status)',
            '        body = str(payload)',
            '        content = str(content_type)',
            '        req_id = -1',
            '        if self._pending is not None:',
            '            req_id = int(self._pending.get("id", -1))',
            '        try:',
            '            js._micropython_http_respond(req_id, status_code, content, body)',
            '        except Exception:',
            '            pass',
            '    def handleClient(self, *args):',
            '        raw = ""',
            '        try:',
            '            raw = js._micropython_http_poll()',
            '        except Exception:',
            '            raw = ""',
            '        if not raw:',
            '            return',
            '        try:',
            '            req = json.loads(str(raw))',
            '        except Exception:',
            '            return',
            '        self._pending = req',
            '        self._sent = False',
            '        path = str(req.get("path", ""))',
            '        handler = self._routes.get(path)',
            '        if handler is None:',
            '            self.send(404, "text/plain", "Not Found")',
            '        else:',
            '            try:',
            '                handler()',
            '            except Exception as err:',
            '                self.send(500, "text/plain", "Handler Error: " + str(err))',
            '        if not self._sent:',
            '            self.send(204, "text/plain", "")',
            '        self._pending = None',
            '',
            'class WebServer(_WebServerShim):',
            '    pass',
            '',
            'class Preferences:',
            '    def __init__(self):',
            '        self._ns = "default"',
            '        self._read_only = False',
            '        self._store = {}',
            '    def _storage_key(self):',
            '        return "__hackcable_pref__" + str(self._ns)',
            '    def _load(self):',
            '        self._store = {}',
            '        raw = None',
            '        try:',
            '            raw = js.localStorage.getItem(self._storage_key())',
            '        except Exception:',
            '            raw = None',
            '        if not raw:',
            '            return',
            '        try:',
            '            data = json.loads(str(raw))',
            '            if isinstance(data, dict):',
            '                self._store = data',
            '        except Exception:',
            '            self._store = {}',
            '    def _save(self):',
            '        if self._read_only:',
            '            return False',
            '        try:',
            '            js.localStorage.setItem(self._storage_key(), json.dumps(self._store))',
            '            return True',
            '        except Exception:',
            '            return False',
            '    def begin(self, *args):',
            '        if len(args) > 0 and args[0] is not None:',
            '            self._ns = str(args[0])',
            '        if len(args) > 1:',
            '            self._read_only = bool(args[1])',
            '        self._load()',
            '        return True',
            '    def end(self):',
            '        return True',
            '    def clear(self):',
            '        if self._read_only:',
            '            return False',
            '        self._store = {}',
            '        return self._save()',
            '    def get(self, key, default=None):',
            '        key_str = str(key)',
            '        if key_str in self._store:',
            '            return self._store[key_str]',
            '        return default',
            '    def put(self, key, value):',
            '        if self._read_only:',
            '            return False',
            '        self._store[str(key)] = value',
            '        self._save()',
            '        return True',
            '    def getFloat(self, key, default=0.0):',
            '        try:',
            '            return float(self.get(key, default))',
            '        except Exception:',
            '            return float(default)',
            '    def getInt(self, key, default=0):',
            '        try:',
            '            return int(self.get(key, default))',
            '        except Exception:',
            '            return int(default)',
            '    def getString(self, key, default=""):',
            '        try:',
            '            return str(self.get(key, default))',
            '        except Exception:',
            '            return str(default)',
            '    def putFloat(self, key, value):',
            '        try:',
            '            return self.put(key, float(value))',
            '        except Exception:',
            '            return False',
            '    def putInt(self, key, value):',
            '        try:',
            '            return self.put(key, int(value))',
            '        except Exception:',
            '            return False',
            '    def putString(self, key, value):',
            '        try:',
            '            return self.put(key, str(value))',
            '        except Exception:',
            '            return False',
            '    def isKey(self, key):',
            '        return str(key) in self._store',
            '    def keys(self):',
            '        return list(self._store.keys())',
            '',
            'class _NoopClient:',
            '    def __init__(self, name):',
            '        self._name = name',
            '    def _notice(self, suffix=""):',
            '        _hc_notice_once(self._name + suffix)',
            '    def begin(self, *args):',
            '        self._notice(".begin")',
            '    def setServer(self, *args):',
            '        self._notice(".setServer")',
            '    def connect(self, *args):',
            '        self._notice(".connect")',
            '        return True',
            '    def loop(self, *args):',
            '        self._notice(".loop")',
            '    def handleClient(self, *args):',
            '        self._notice(".handleClient")',
            '    def connected(self):',
            '        return False',
            '    def available(self):',
            '        return 0',
            '    def readStringUntil(self, *args):',
            '        return ""',
            '    def println(self, text=""):',
            '        Serial.println(text)',
            '    def print(self, text=""):',
            '        Serial.print(text)',
            '',
            'class _SerialBTShim(_NoopClient):',
            '    def __init__(self):',
            '        super().__init__("SerialBT")',
            '    def begin(self, *args):',
            '        return True',
            '    def available(self):',
            '        return 0',
            '    def readStringUntil(self, *args):',
            '        return ""',
            '    def connected(self):',
            '        return False',
            '',
            'class BFarmTime:',
            '    def sync(self):',
            '        return True',
            '    def getHour(self):',
            '        return 12',
            '    def getMinute(self):',
            '        return 0',
            '',
            'class _NetpieClientShim(_NoopClient):',
            '    def __init__(self):',
            '        super().__init__("Netpieclient")',
            '        self._connected = True',
            '    def setServer(self, *args):',
            '        return True',
            '    def connect(self, *args):',
            '        self._connected = True',
            '        return True',
            '    def loop(self, *args):',
            '        return True',
            '    def connected(self):',
            '        return self._connected',
            '',
            'class BFarmEventType:',
            '    EVERY = 0',
            '    ONCE = 1',
            '    TASK = 2',
            '',
            'class BFarmEvent:',
            '    def attach(self, *args):',
            '        _hc_notice_once("BFarmEvent.attach")',
            '    def detach(self, *args):',
            '        _hc_notice_once("BFarmEvent.detach")',
            '',
            'WiFi = _WiFiShim()',
            'Netpieclient = _NetpieClientShim()',
            'SerialBT = _SerialBTShim()',
            'server = WebServer(80)',
            'Netpiemqtt_server = "broker.netpie.io"',
            'Netpiemqtt_port = 1883',
            'bfarmtime = BFarmTime()',
            'bfarmevt = BFarmEvent()',
            '',
            'def setup_HandySense():',
            '    return True',
            'def loop_HandySense(*args): _hc_notice_once("loop_HandySense")',
            'def setPin_Relay(*args):',
            '    global const_relay_pin',
            '    if len(args) >= 4:',
            '        const_relay_pin = [int(args[0]), int(args[1]), int(args[2]), int(args[3])]',
            'def setPin_SW(*args):',
            '    return True',
            'def setPin_ErrorSensor(*args):',
            '    return True',
            'def setupMQTT():',
            '    return True',
            'def pub_topic(topic, value=None): _hc_notice_once("pub_topic")',
            '_hc_pref_default_keys = [',
            '    "calTemp", "calPH4", "calPH7", "calPH10", "calEC0", "calEC1413",',
            '    "PHthresh_min", "PHthresh_max", "ECthresh_min", "ECthresh_max",',
            '    "PHdura_value", "ECdura_value"',
            ']',
            'def _hc_pref_is_scalar(value):',
            '    return isinstance(value, (int, float, str, bool))',
            'def _hc_pref_candidate_name(name):',
            '    lower = str(name).lower()',
            '    if lower.startswith("_"):',
            '        return False',
            '    if "pin" in lower:',
            '        return False',
            '    return ("cal" in lower) or ("thresh" in lower) or ("dura" in lower)',
            'def _hc_pref_keys_to_save():',
            '    keys = []',
            '    seen = {}',
            '    g = globals()',
            '    for name in _hc_pref_default_keys:',
            '        if name in g and _hc_pref_is_scalar(g[name]):',
            '            keys.append(name)',
            '            seen[name] = 1',
            '    for name in list(g.keys()):',
            '        if name in seen:',
            '            continue',
            '        value = g[name]',
            '        if _hc_pref_is_scalar(value) and _hc_pref_candidate_name(name):',
            '            keys.append(str(name))',
            '            seen[str(name)] = 1',
            '    return keys',
            'def load_preferences():',
            '    prefs = globals().get("preferences", None)',
            '    if prefs is None:',
            '        return False',
            '    loaded = 0',
            '    try:',
            '        for name in prefs.keys():',
            '            key = str(name)',
            '            globals()[key] = prefs.get(key, globals().get(key, None))',
            '            loaded += 1',
            '    except Exception:',
            '        return False',
            '    return loaded > 0',
            'def set_preferences():',
            '    prefs = globals().get("preferences", None)',
            '    if prefs is None:',
            '        return False',
            '    saved = 0',
            '    for key in _hc_pref_keys_to_save():',
            '        try:',
            '            if prefs.put(key, globals().get(key)):',
            '                saved += 1',
            '        except Exception:',
            '            pass',
            '    return saved > 0',
            'def clear_preferences():',
            '    prefs = globals().get("preferences", None)',
            '    if prefs is None:',
            '        return False',
            '    try:',
            '        return prefs.clear()',
            '    except Exception:',
            '        return False',
            'def print_config():',
            '    prefs = globals().get("preferences", None)',
            '    if prefs is None:',
            '        Serial.println("[Preferences] unavailable")',
            '        return',
            '    keys = []',
            '    try:',
            '        keys = prefs.keys()',
            '    except Exception:',
            '        keys = []',
            '    if len(keys) == 0:',
            '        Serial.println("[Preferences] empty")',
            '        return',
            '    for key in keys:',
            '        Serial.println(str(key) + "=" + str(prefs.get(key, "")))',
            'def control_pH(value): _hc_notice_once("control_pH")',
            'def control_EC(value): _hc_notice_once("control_EC")',
            'def PHcompute(adc): return (float(adc) / 4095.0) * 14.0',
            'def Tempcompute(adc): return 20.0 + (float(adc) / 4095.0) * 15.0',
            'def ECcompute(adc_ec, adc_temp): return int((float(adc_ec) / 4095.0) * 2000)',
            'def parsePercent(line):',
            '    try:',
            '        return constrain(int(line), 0, 100)',
            '    except Exception:',
            '        return 0',
            '',
            `const_relay_pin = [${relayPins.join(', ')}]`,
            '',
        ].join('\n');

        // Add Python constants for thresholds and other values
        constants.forEach((value, name) => {
            // Skip pin definitions - they'll be used directly
            if (!name.endsWith('_PIN')) {
                pythonCode += `${name} = ${value}\n`;
            }
        });
        if (constants.size > 0) {
            pythonCode += '\n';
        }

        // Extract OUTPUT pinMode calls (for LEDs, actuators, relays)
        // Match both named constants and numeric values
        const outputPinMatches = code.matchAll(/pinMode\s*\(\s*([A-Z_][A-Z0-9_]*|\d+)\s*,\s*OUTPUT\s*\)/g);
        const outputPins: Array<{ name: string, num: number }> = [];
        for (const match of outputPinMatches) {
            const pinRef = match[1];
            if (/^\d+$/.test(pinRef)) {
                outputPins.push({ name: `pin${pinRef}`, num: parseInt(pinRef) });
            } else {
                const pinNum = constants.get(pinRef);
                if (pinNum !== undefined) {
                    // Convert PIN_NAME to pythonic name: MIST_PUMP_PIN -> mist_pump
                    const pyName = pinRef.replace(/_PIN$/, '').toLowerCase();
                    outputPins.push({ name: pyName, num: pinNum });
                }
            }
        }

        // Extract INPUT_PULLUP pinMode calls (for buttons)
        const inputPinMatches = code.matchAll(/pinMode\s*\(\s*([A-Z_][A-Z0-9_]*|\d+)\s*,\s*INPUT_PULLUP\s*\)/g);
        const inputPins: Array<{ name: string, num: number }> = [];
        for (const match of inputPinMatches) {
            const pinRef = match[1];
            if (/^\d+$/.test(pinRef)) {
                inputPins.push({ name: `pin${pinRef}`, num: parseInt(pinRef) });
            } else {
                const pinNum = constants.get(pinRef);
                if (pinNum !== undefined) {
                    const pyName = pinRef.replace(/_PIN$/, '').toLowerCase();
                    inputPins.push({ name: pyName, num: pinNum });
                }
            }
        }

        // Extract analogRead pins
        const analogPinMatches = code.matchAll(/analogRead\s*\(\s*([A-Z_][A-Z0-9_]*|\d+)\s*\)/g);
        const analogPins: Array<{ name: string, num: number }> = [];
        const seenAnalogPins = new Set<string>();
        for (const match of analogPinMatches) {
            const pinRef = match[1];
            if (seenAnalogPins.has(pinRef)) continue;
            seenAnalogPins.add(pinRef);

            if (/^\d+$/.test(pinRef)) {
                analogPins.push({ name: `adc${pinRef}`, num: parseInt(pinRef) });
            } else {
                const pinNum = constants.get(pinRef);
                if (pinNum !== undefined) {
                    const pyName = 'adc_' + pinRef.replace(/_PIN$/, '').toLowerCase();
                    analogPins.push({ name: pyName, num: pinNum });
                }
            }
        }

        // Create Pin objects for outputs
        outputPins.forEach(pin => {
            pythonCode += `${pin.name} = Pin(${pin.num}, Pin.OUT)\n`;
        });

        // Create Pin objects for inputs
        inputPins.forEach(pin => {
            pythonCode += `${pin.name} = Pin(${pin.num}, Pin.IN, Pin.PULL_UP)\n`;
        });

        // Create ADC objects for analog inputs
        analogPins.forEach(pin => {
            pythonCode += `${pin.name} = ADC(Pin(${pin.num}))\n`;
            pythonCode += `${pin.name}.atten(ADC.ATTN_11DB)  # Full range 0-3.3V\n`;
        });

        if (outputPins.length > 0 || inputPins.length > 0 || analogPins.length > 0) {
            pythonCode += '\n';
        }

        // Inject MCP23008 mock for HandySense/I2C relay control
        if (usesMCP23008) {
            pythonCode += [
                '# MCP23008 mock - maps I2C expander to ESP32 relay GPIO',
                'class MCP23008:',
                '    _RELAY_PINS = [25, 4, 12, 13]  # GP0=IO25(R1), GP1=IO4(R2), GP2=IO12(R3), GP3=IO13(R4)',
                '    def __init__(self, addr):',
                '        self._pins = [Pin(p, Pin.OUT) for p in self._RELAY_PINS]',
                '    def begin(self): pass',
                '    def pinMode8(self, mode): pass',
                '    def write(self, pin, val):',
                '        if pin < len(self._pins): self._pins[pin].value(val)',
                'MCP = MCP23008(0x24)',
                '',
            ].join('\n');
        }

        // Emit RS485 UART + sensor objects
        if (usesRS485) {
            pythonCode += `uart2 = UART(2, baudrate=9600, tx=Pin(${serial2Tx}), rx=Pin(${serial2Rx}))\n`;
            modbusSensors.forEach(varName => {
                pythonCode += `${varName} = RS485Sensor(uart2, ${modbusSlaveIds.get(varName) ?? 1})\n`;
            });
            pythonCode += '\n';
        }

        // Emit I2C + sensor objects
        if (usesI2CSensors) {
            pythonCode += `_i2c = I2C(scl=Pin(22), sda=Pin(21))\n`;
            sht31Sensors.forEach(varName => { pythonCode += `${varName} = SHT31(_i2c)\n`; });
            bh1750Sensors.forEach(varName => { pythonCode += `${varName} = BH1750(_i2c)\n`; });
            pythonCode += '\n';
        }

        // Store conversion context BEFORE emitting helper functions so convertLine() can:
        // - strip sensor .read() calls (e.g. SHT31 mock doesn't implement read())
        // - translate Serial.printf(...) inside helpers
        // - apply pin-name mappings consistently
        this.currentConversionContext = {
            constants,
            outputPins: new Map(outputPins.map(p => [p.num, p.name])),
            inputPins: new Map(inputPins.map(p => [p.num, p.name])),
            analogPins: new Map(analogPins.map(p => [p.num, p.name])),
            pinNameToNum: new Map([...outputPins, ...inputPins, ...analogPins].map(p => [p.name, p.num])),
            constantNames: new Map([...constants.entries()].filter(([k]) => k.endsWith('_PIN')).map(([k, v]) => [k, v])),
            modbusSensors,
            sht31Sensors,
            bh1750Sensors,
            helperFunctionNames,
        };

        let setupBody = setupMatch ? setupMatch[1] : '';
        let routeHandlers: Array<{ name: string; body: string }> = [];
        if (setupMatch) {
            const rewritten = this.rewriteSetupWebServerLambdas(setupBody);
            setupBody = rewritten.setupBody;
            routeHandlers = rewritten.routeHandlers;
        }

        // Emit helper functions (best-effort). Must come before setup/loop conversion.
        if (helperFunctions.length > 0) {
            for (const fn of helperFunctions) {
                pythonCode += this.emitConvertedFunction(fn.name, fn.body);
            }
        }

        if (routeHandlers.length > 0) {
            for (const route of routeHandlers) {
                pythonCode += this.emitConvertedFunction(route.name, route.body);
            }
        }

        // Convert setup body (serial messages, sensor initialisation calls, etc.)
        if (setupMatch) {
            const setupLines = this.expandCompactBodyLines(setupBody);
            let braceDepth = 0;
            let lambdaDepth = 0;

            for (const line of setupLines) {
                const trimmed = line.trim();
                const opens = (line.match(/\{/g) || []).length;
                const closes = (line.match(/\}/g) || []).length;

                // While inside a lambda/callback body, track depth and skip entirely
                if (lambdaDepth > 0) {
                    lambdaDepth += opens - closes;
                    if (lambdaDepth < 0) lambdaDepth = 0;
                    continue;
                }

                // Detect start of unsupported lambda callback and skip body silently.
                if (trimmed.includes('[](){') || trimmed.includes('[]() {')) {
                    lambdaDepth = Math.max(1, opens - closes);
                    continue;
                }

                // Brace-depth tracking for regular if/while/for blocks
                braceDepth -= closes;
                if (braceDepth < 0) braceDepth = 0;

                const converted = this.convertLine(line);
                if (converted.trim()) {
                    const indent = '    '.repeat(braceDepth);
                    pythonCode += indent + converted + '\n';
                }

                braceDepth += opens;
            }
            pythonCode += '\n';
        }

        // Convert loop content line-by-line with brace tracking
        if (loopMatch) {
            pythonCode += 'while True:\n';
            const loopContent = loopMatch[1];
            const lines = this.expandCompactBodyLines(loopContent);

            let braceDepth = 0;
            let hasContent = false;

            for (const line of lines) {
                // Count braces BEFORE processing to handle closing brace indentation
                const closeBraces = (line.match(/\}/g) || []).length;
                const openBraces = (line.match(/\{/g) || []).length;

                // Decrease depth for closing braces first
                braceDepth -= closeBraces;
                if (braceDepth < 0) braceDepth = 0;

                // Convert the line
                const converted = this.convertLine(line);

                // Add line with proper indentation (skip empty lines)
                if (converted.trim()) {
                    const indent = '    '.repeat(braceDepth + 1);
                    pythonCode += indent + converted + '\n';
                    hasContent = true;
                }

                // Increase depth for opening braces after
                braceDepth += openBraces;
            }

            // If no content, add pass statement
            if (!hasContent) {
                // Cron-driven sketches (e.g. Greenhouse) often end up empty after we strip WiFi/WebServer/Cron calls.
                // Emulate the periodic behavior by calling the cron target function (if found).
                if (cronScheduledFn && helperFunctionNames.has(cronScheduledFn)) {
                    pythonCode += `    ${cronScheduledFn}()\n`;
                    pythonCode += '    time.sleep_ms(1000)\n';
                } else {
                    pythonCode += '    Serial.println("[MicroPython Warning] Loop has no executable statements after conversion.")\n';
                    pythonCode += '    time.sleep_ms(1000)\n';
                }
            }
        }

        return pythonCode;
    }

    private extractRelayPins(code: string): number[] {
        const m = code.match(/\bsetPin_Relay\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
        if (!m) return [25, 4, 12, 13];
        return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), parseInt(m[4])];
    }

    private parseBalancedParentheses(source: string, openParenIndex: number): { inner: string; closeIndex: number } | null {
        if (openParenIndex < 0 || openParenIndex >= source.length || source[openParenIndex] !== '(') return null;
        let depth = 0;
        let inSingle = false;
        let inDouble = false;

        for (let i = openParenIndex; i < source.length; i++) {
            const ch = source[i];
            const prev = i > 0 ? source[i - 1] : '';
            if (ch === "'" && !inDouble && prev !== '\\') {
                inSingle = !inSingle;
            } else if (ch === '"' && !inSingle && prev !== '\\') {
                inDouble = !inDouble;
            }
            if (inSingle || inDouble) continue;
            if (ch === '(') depth++;
            if (ch === ')') {
                depth--;
                if (depth === 0) {
                    return { inner: source.slice(openParenIndex + 1, i), closeIndex: i };
                }
            }
        }
        return null;
    }

    private normalizeBooleanOperators(expr: string): string {
        let out = '';
        let inSingle = false;
        let inDouble = false;
        for (let i = 0; i < expr.length; i++) {
            const ch = expr[i];
            const next = i + 1 < expr.length ? expr[i + 1] : '';
            const prev = i > 0 ? expr[i - 1] : '';

            if (ch === "'" && !inDouble && prev !== '\\') {
                inSingle = !inSingle;
                out += ch;
                continue;
            }
            if (ch === '"' && !inSingle && prev !== '\\') {
                inDouble = !inDouble;
                out += ch;
                continue;
            }
            if (!inSingle && !inDouble) {
                if (ch === '&' && next === '&') {
                    out += ' and ';
                    i++;
                    continue;
                }
                if (ch === '|' && next === '|') {
                    out += ' or ';
                    i++;
                    continue;
                }
                if (ch === '!' && next !== '=') {
                    out += ' not ';
                    continue;
                }
            }
            out += ch;
        }
        return out;
    }

    private rewriteSerialCall(line: string, method: 'print' | 'println'): string {
        const token = `Serial.${method}(`;
        let out = line;
        let idx = out.indexOf(token);
        while (idx >= 0) {
            const openIdx = idx + token.length - 1;
            const parsed = this.parseBalancedParentheses(out, openIdx);
            if (!parsed) break;
            const arg = parsed.inner.trim();
            const replacement = arg.length > 0 ? `Serial.${method}(${arg})` : `Serial.${method}()`;
            out = out.slice(0, idx) + replacement + out.slice(parsed.closeIndex + 1);
            idx = out.indexOf(token, idx + replacement.length);
        }
        return out;
    }

    private convertControlFlowStatement(line: string): string | null {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const convertHead = (keyword: 'if' | 'elif' | 'while', openIdx: number): string | null => {
            const parsed = this.parseBalancedParentheses(trimmed, openIdx);
            if (!parsed) return null;
            const condition = this.normalizeBooleanOperators(parsed.inner.trim());
            let tail = trimmed.slice(parsed.closeIndex + 1).trim();
            tail = tail.replace(/^\{/, '').replace(/\}\s*$/, '').trim();
            if (tail.endsWith(';')) tail = tail.slice(0, -1).trim();
            if (!tail) return `${keyword} ${condition}:`;
            const convertedTail = this.convertLine(tail);
            return convertedTail ? `${keyword} ${condition}: ${convertedTail}` : `${keyword} ${condition}:`;
        };

        const elseIfMatch = trimmed.match(/^\}?\s*else\s+if\s*\(/);
        if (elseIfMatch) {
            const openIdx = trimmed.indexOf('(', elseIfMatch.index ?? 0);
            if (openIdx >= 0) return convertHead('elif', openIdx);
        }

        const ifMatch = trimmed.match(/^if\s*\(/);
        if (ifMatch) {
            const openIdx = trimmed.indexOf('(', ifMatch.index ?? 0);
            if (openIdx >= 0) return convertHead('if', openIdx);
        }

        const whileMatch = trimmed.match(/^while\s*\(/);
        if (whileMatch) {
            const openIdx = trimmed.indexOf('(', whileMatch.index ?? 0);
            if (openIdx >= 0) return convertHead('while', openIdx);
        }

        if (/^\}?\s*else\b/.test(trimmed)) {
            let tail = trimmed.replace(/^\}?\s*else\b/, '').trim();
            tail = tail.replace(/^\{/, '').replace(/\}\s*$/, '').trim();
            if (tail.endsWith(';')) tail = tail.slice(0, -1).trim();
            if (!tail) return 'else:';
            const convertedTail = this.convertLine(tail);
            return convertedTail ? `else: ${convertedTail}` : 'else:';
        }

        return null;
    }

    private convertInlineForLoop(line: string): string | null {
        const trimmed = line.trim();
        const m = trimmed.match(/^for\s*\(\s*(?:int|long|unsigned\s+int|unsigned)?\s*([A-Za-z_]\w*)\s*=\s*([^;]+?)\s*;\s*\1\s*<\s*([^;]+?)\s*;\s*\1\s*\+\+\s*\)\s*\{\s*(.*?)\s*\}\s*;?$/);
        if (!m) return null;
        const varName = m[1].trim();
        const startExpr = m[2].trim();
        const endExpr = m[3].trim();
        const body = m[4].trim();
        if (!body) return `for ${varName} in range(${startExpr}, ${endExpr}): pass`;

        const bodyParts = body
            .split(';')
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => this.convertLine(s))
            .filter(Boolean);
        const inlineBody = bodyParts.join('; ');
        return `for ${varName} in range(${startExpr}, ${endExpr}): ${inlineBody || 'pass'}`;
    }

    private splitCompactLine(rawLine: string): string[] {
        const parts: string[] = [];
        let current = '';
        let parenDepth = 0;
        let inSingle = false;
        let inDouble = false;

        for (let i = 0; i < rawLine.length; i++) {
            const ch = rawLine[i];
            const prev = i > 0 ? rawLine[i - 1] : '';

            if (ch === "'" && !inDouble && prev !== '\\') {
                inSingle = !inSingle;
                current += ch;
                continue;
            }
            if (ch === '"' && !inSingle && prev !== '\\') {
                inDouble = !inDouble;
                current += ch;
                continue;
            }

            if (!inSingle && !inDouble) {
                if (ch === '(') parenDepth++;
                else if (ch === ')' && parenDepth > 0) parenDepth--;

                if (parenDepth === 0 && (ch === ';' || ch === '{' || ch === '}')) {
                    current += ch;
                    if (current.trim().length > 0) parts.push(current.trim());
                    current = '';
                    continue;
                }
            }

            current += ch;
        }

        if (current.trim().length > 0) parts.push(current.trim());
        return parts;
    }

    private expandCompactBodyLines(body: string): string[] {
        const out: string[] = [];
        const rawLines = body.split('\n');
        for (const raw of rawLines) {
            const split = this.splitCompactLine(raw);
            if (split.length === 0) {
                if (raw.trim().length === 0) out.push(raw);
                continue;
            }
            out.push(...split);
        }
        return out;
    }

    private convertLine(line: string): string {
        let result = line;
        const ctx = this.currentConversionContext;

        result = result.replace(/\/\/.*$/g, '');
        result = result.replace(/\/\*.*?\*\//g, '');
        if (!result.trim()) return '';

        const printfMatch = result.match(/Serial\s*\.\s*printf\s*\(\s*"([^"]*)"\s*(?:,\s*(.*?))?\s*\)\s*;?\s*$/);
        if (printfMatch) {
            let fmt = printfMatch[1];
            let args = (printfMatch[2] ?? '').trim();
            fmt = fmt.replace(/\\n\s*$/g, '');
            if (args) {
                args = args.replace(/(\w+)\.getTemperature\s*\(\s*\)/g, '$1.temperature()');
                args = args.replace(/(\w+)\.getHumidity\s*\(\s*\)/g, '$1.humidity()');
                args = args.replace(
                    /(\b[^\s,()?:]+\b)\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"/g,
                    (_m, cond, a, b) => `"${a}" if ${cond} else "${b}"`
                );
                args = args.replace(
                    /(\b[^\s,()?:]+\b)\s*\?\s*([0-9]+)\s*:\s*([0-9]+)/g,
                    (_m, cond, a, b) => `${a} if ${cond} else ${b}`
                );
                args = args.replace(/\btrue\b/g, 'True');
                args = args.replace(/\bfalse\b/g, 'False');
                args = this.normalizeBooleanOperators(args);
                args = args.replace(
                    /\b(\d+(?:\.\d+)?)(?:[uU](?:ll|LL|l|L)?|(?:ll|LL|l|L)[uU]?|[fFlL])\b/g,
                    '$1'
                );
            }
            return args ? `Serial.println("${fmt}" % (${args}))` : `Serial.println("${fmt}")`;
        }

        const trimmed = result.trim();
        if (trimmed.startsWith('+')) return '';
        if (trimmed.startsWith('#include')) return '';
        if (/^\s*\}\s*,?\s*\)?\s*;?\s*$/.test(trimmed)) return '';
        if (trimmed.includes('[](){') || trimmed.includes('[]() {')) return '';

        if (/^\s*(uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|float|double|bool|boolean|int|long|unsigned)\s+\w+\s*;/.test(result)) {
            return '';
        }
        if (/^\s*(void|float|double|int|uint8_t|uint16_t|bool|String|long|unsigned)\s+\w+\s*\([^;]*\)\s*;\s*$/.test(result)) {
            return '';
        }
        if (/^\s*(ModbusMaster|(?:Adafruit_)?SHT31|BH1750)\s+\w+\s*;/.test(result)) {
            return '';
        }

        result = result.replace(/^\s*(WebServer|Preferences|BFarmTime|BFarmEvent|BluetoothSerial)\s+(\w+)\s*\(([^)]*)\)\s*;\s*$/g, '$2 = $1($3)');
        result = result.replace(/^\s*(WebServer|Preferences|BFarmTime|BFarmEvent|BluetoothSerial)\s+(\w+)\s*;\s*$/g, '$2 = $1()');

        if (/\bpinMode\s*\(\s*[^,]+\s*,\s*(?:OUTPUT|INPUT|INPUT_PULLUP|0|1|2)\s*\)/.test(result)) return '';

        if (ctx) {
            for (const varName of ctx.modbusSensors) {
                if (new RegExp(`\\b${varName}\\.begin\\s*\\(`).test(result)) return '';
            }
            for (const varName of ctx.sht31Sensors) {
                if (new RegExp(`\\b${varName}\\.begin\\s*\\(`).test(result)) return '';
                if (new RegExp(`\\b${varName}\\.read\\s*\\(`).test(result)) return '';
            }
            for (const varName of ctx.bh1750Sensors) {
                if (new RegExp(`\\b${varName}\\.begin\\s*\\(`).test(result)) return '';
            }
        }

        result = result.replace(/(\w+)\s*=\s*(\w+)\.readHoldingRegisters\s*\([^)]*\)/g, '_result = 0');
        result = result.replace(/(\w+)\.readHoldingRegisters\s*\([^)]*\)/g, '_result = 0');
        result = result.replace(/(\w+)\.getResponseBuffer\s*\(\s*(\d+)\s*\)/g, '$1.read_register($2)');
        result = result.replace(/(\w+)\.getTemperature\s*\(\s*\)/g, '$1.temperature()');
        result = result.replace(/(\w+)\.getHumidity\s*\(\s*\)/g, '$1.humidity()');
        result = result.replace(/(\w+)\.(?:readLightLevel|measureHighRes2?|measureLowRes)\s*\(\s*\)/g, '$1.luminance()');
        result = result.replace(/(\w+)\.toInt\s*\(\s*\)/g, 'int($1)');
        result = result.replace(/\b([A-Za-z_]\w*)\.length\s*\(\s*\)/g, 'len($1)');

        result = result.replace(/\b(?:const\s+)?(int|float|double|bool|boolean|char|String|long|unsigned|uint8_t|uint16_t)\s+(\w+)\s*=/g, '$2 =');
        result = result.replace(/\bconst\s+char\s*\*\s*(\w+)\s*=/g, '$1 =');

        result = result.replace(/analogRead\s*\(\s*([A-Z_][A-Z0-9_]*)\s*\)/g, (_match, pinName) => {
            if (ctx && ctx.constantNames.has(pinName)) {
                const pyName = 'adc_' + pinName.replace(/_PIN$/, '').toLowerCase();
                return `${pyName}.read()`;
            }
            return `adc_${pinName.toLowerCase()}.read()`;
        });
        result = result.replace(/analogRead\s*\(\s*(\d+)\s*\)/g, 'adc$1.read()');

        result = result.replace(/\bWire\.begin\s*\([^)]*\)/g, '');
        result = result.replace(/\bWire\.setClock\s*\([^)]*\)/g, '');
        result = result.replace(/\bSerial2\s*\.\s*begin\s*\([^)]*\)/g, '_hc_notice_once("Serial2.begin")');
        if (/\bMCP\.(begin|pinMode8)\s*\(/.test(result)) return '';
        if (/\bconfigTime\s*\(/.test(result)) return '_hc_notice_once("configTime")';
        if (/\bCron\s*\.\s*(create|delay|enable)\s*\(/.test(result)) return '';
        if (/\bstrip\s*\.\s*(begin|show|setPixelColor|setBrightness|clear)\s*\(/.test(result)) return '';

        result = result.replace(/\bMCP\.digitalWrite\s*\(\s*(\d+)\s*,\s*(HIGH|LOW|1|0)\s*\)/g,
            (_match, pin, state) => `MCP.write(${pin}, ${state === 'HIGH' || state === '1' ? 1 : 0})`);
        result = result.replace(/digitalWrite\s*\(\s*([A-Z_][A-Z0-9_]*)\s*,\s*(HIGH|LOW|1|0)\s*\)/g,
            (_match, pinName, state) => `${pinName.replace(/_PIN$/, '').toLowerCase()}.value(${state === 'HIGH' || state === '1' ? '1' : '0'})`);
        result = result.replace(/digitalWrite\s*\(\s*LED_PIN_(\d+)\s*,\s*(HIGH|LOW|1|0)\s*\)/g,
            (_match, pin, state) => `led${pin}.value(${state === 'HIGH' || state === '1' ? '1' : '0'})`);
        result = result.replace(/digitalWrite\s*\(\s*(\d+)\s*,\s*(HIGH|LOW|1|0)\s*\)/g,
            (_match, pin, state) => `pin${pin}.value(${state === 'HIGH' || state === '1' ? '1' : '0'})`);

        result = result.replace(/digitalRead\s*\(\s*([A-Z_][A-Z0-9_]*)\s*\)/g, (_match, pinName) => `${pinName.replace(/_PIN$/, '').toLowerCase()}.value()`);
        result = result.replace(/digitalRead\s*\(\s*BUTTON_PIN_(\d+)\s*\)/g, 'button$1.value()');
        result = result.replace(/digitalRead\s*\(\s*(\d+)\s*\)/g, 'pin$1.value()');

        result = this.rewriteSerialCall(result, 'println');
        result = this.rewriteSerialCall(result, 'print');
        result = result.replace(/delay\s*\(\s*(\d+)\s*\)/g, 'time.sleep_ms($1)');

        result = result.replace(
            /\b(\w+)\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"\b/g,
            (_m, cond, a, b) => `"${a}" if ${cond} else "${b}"`
        );
        result = result.replace(
            /\b(\w+)\s*\?\s*([0-9]+)\s*:\s*([0-9]+)\b/g,
            (_m, cond, a, b) => `${a} if ${cond} else ${b}`
        );
        result = result.replace(/\btrue\b/g, 'True');
        result = result.replace(/\bfalse\b/g, 'False');
        result = result.replace(/\bLOW\b/g, '0');
        result = result.replace(/\bHIGH\b/g, '1');

        const controlFlow = this.convertControlFlowStatement(result);
        if (controlFlow !== null) result = controlFlow;

        const inlineFor = this.convertInlineForLoop(result);
        if (inlineFor) result = inlineFor;

        result = this.normalizeBooleanOperators(result);
        result = result.replace(
            /\b(\d+(?:\.\d+)?)(?:[uU](?:ll|LL|l|L)?|(?:ll|LL|l|L)[uU]?|[fFlL])\b/g,
            '$1'
        );
        result = result.replace(/;/g, '');
        result = result.replace(/^\s*[\{\}]\s*$/g, '');
        result = result.replace(/[\{\}]/g, '');

        // Drop orphaned closing-paren / comma-continuation fragments that arise from
        // multi-line C++ lambda/callback constructs (e.g. `});` splits into '}' + `);`)
        const _fr = result.trim();
        if (/^\)\s*;?\s*$/.test(_fr) || _fr.startsWith(',')) return '';

        return result.trim();
    }

    private setupESP32Hardware() {
        if (!this.micropythonRunner) return;

        console.log('[EmulatorManager] Setting up ESP32 hardware listeners...');
        this.bindESP32RuntimeCallbacks();

        const supportedPins = this.hackcable.getSupportedBoardPins();
        this.micropythonRunner.setSupportedPins(supportedPins);
        const warnedMismatchPins = new Set<number>();

        // Follow the runtime's supported GPIO map to keep UI updates in sync
        // with whatever pins the MicroPython layer can drive (e.g. IO32/IO33).
        const pinsToListen = new Set<number>([
            ...Array.from(this.micropythonRunner.pins.keys()),
            ...supportedPins,
        ]);
        pinsToListen.forEach(pin => {
            this.micropythonRunner!.setPinListener(pin, (value: boolean) => {
                console.log(`[EmulatorManager] ESP32 Pin ${pin} changed to: ${value}`);
                this.hackcable.esp32PinUpdate(pin, value);

                const actuatorPins = this.hackcable.getConnectedActuatorControlPins();
                if (actuatorPins.length > 0 && !actuatorPins.includes(pin) && !warnedMismatchPins.has(pin)) {
                    warnedMismatchPins.add(pin);
                    const msg = `[Wiring Warning] GPIO${pin} changed, but no actuator control pin is wired to GPIO${pin}.`;
                    console.warn(`[EmulatorManager] ${msg}`);
                    this.hackcable.serialDataReceived(msg + '\n');
                }
            });
        });

        console.log('[EmulatorManager] ESP32 hardware listeners configured');
    }

    private bindESP32RuntimeCallbacks() {
        if (!this.micropythonRunner) return;

        // Bind per-run to avoid stale handlers if UI wiring changes during runtime lifecycle.
        this.micropythonRunner.onSerialData = (data: string) => {
            this.hackcable.serialDataReceived(data);
        };

        this.micropythonRunner.onSensorActivate = (busType: string, pin1: number, pin2: number) => {
            this.hackcable.activateSensorComponent(busType, pin1, pin2);
        };
    }


    setPaused(pause: boolean) {
        if (this.boardType === 'esp32') {
            if (this.micropythonRunner) this.micropythonRunner.pause = pause;
        } else {
            if (this.runner) this.runner.pause = pause;
        }
    }

    isPosed() {
        if (this.boardType === 'esp32') {
            if (this.micropythonRunner) return this.micropythonRunner.pause;
            return true;
        } else {
            if (this.runner) return this.runner.pause;
            return true;
        }
    }

    stop() {
        if (this.runner) this.runner.stop();
        if (this.micropythonRunner) this.micropythonRunner.stop();
        this.hackcable.deactivateAllSensors();
        this.hackcable.deactivateAllActuators();
    }


    private setupHardware() {
        if (!this.runner) throw new Error("Runner mustn't be null!")
        console.log('[EmulatorManager] Setting up hardware listeners...');
        this.runner.portB.addListener(() => {
            if (this.runner) this.hackcable.portBUpdate(this.runner.portB)
        });
        this.runner.portC.addListener(() => {
            if (this.runner) this.hackcable.portCUpdate(this.runner.portC)
        });
        this.runner.portD.addListener(() => {
            if (this.runner) this.hackcable.portDUpdate(this.runner.portD)
        });
        // Wire Arduino serial (USART) output to HackCable callback
        this.runner.usart.onByteTransmit = (value: number) => {
            this.hackcable.serialDataReceived(String.fromCharCode(value));
        };
        console.log('[EmulatorManager] Hardware listeners configured');
    }
}
