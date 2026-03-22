import "./css/main.styl"
import {CompileResult, EmulatorManager, HackCable} from "../src/main";
import {wokwiComponentById, wokwiComponentByClass, ComponentType} from "../src/panels/component";
import {ComponentFigure} from "../src/editor/component-figure";
import * as draw2d from "draw2d";
import {DisconnectableConnectionPolicy} from "../src/editor/connections-policies";

console.log("Running HackCable web interface")

const mountingDiv = document.getElementById('hackCable');
if(!mountingDiv) throw new DOMException("Mounting div not found")

const lang = localStorage.getItem('hackCable-webExample-language');
let hackCable = new HackCable(mountingDiv, lang ? lang : 'en_us');

// Emscripten WASM state
let activeWasmModule: any = null;
let activeWasmScript: HTMLScriptElement | null = null;
let lastEmscriptenResult: { js: string; wasm?: string } | null = null;
let emscriptenAvailable = false;

// Godbolt API (public Emscripten compiler — no backend needed)
const GODBOLT_API = 'https://godbolt.org';
let godboltCompilerId: string | null = null;

async function findGodboltEmscriptenCompiler(): Promise<string | null> {
    try {
        const res = await fetch(`${GODBOLT_API}/api/compilers/c++`, {
            headers: { Accept: 'application/json' }
        });
        if (!res.ok) return null;
        const compilers: any[] = await res.json();
        const em = compilers
            .filter(c => /emscripten/i.test(c.id) || /emscripten/i.test(c.name ?? ''))
            .sort((a, b) => b.id.localeCompare(a.id));
        return em[0]?.id ?? null;
    } catch {
        return null;
    }
}

async function compileWithGodbolt(code: string): Promise<string> {
    if (!godboltCompilerId) {
        godboltCompilerId = await findGodboltEmscriptenCompiler();
        if (!godboltCompilerId) throw new Error('No Emscripten compiler found on Godbolt');
    }
    const res = await fetch(`${GODBOLT_API}/api/compiler/${godboltCompilerId}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            source: code,
            options: {
                userArguments: '-O1 -sSINGLE_FILE=1 -sMODULARIZE=1 -sEXPORT_NAME=HackCableModule --no-entry -sALLOW_MEMORY_GROWTH=1',
                filters: { binary: false, execute: false, trim: false, libraryCode: true }
            },
            lang: 'c++'
        })
    });
    if (!res.ok) throw new Error(`Godbolt API error: HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== 0) {
        const stderr = (data.stderr ?? []).map((l: any) => l.text).join('\n');
        throw new Error(stderr.trim() || 'Compilation failed');
    }
    const js = (data.asm ?? []).map((l: any) => l.text).join('\n');
    if (!js.trim()) throw new Error('Godbolt returned empty output');
    return js;
}

async function checkEmscriptenStatus(retries = 3, delayMs = 1000) {
    for (let attempt = 0; attempt < retries; attempt++) {
        const id = await findGodboltEmscriptenCompiler();
        if (id) {
            godboltCompilerId = id;
            emscriptenAvailable = true;
            updateEmscriptenOption();
            return;
        }
        if (attempt < retries - 1) await new Promise(r => setTimeout(r, delayMs));
    }
    emscriptenAvailable = false;
    updateEmscriptenOption();
}

function updateEmscriptenOption() {
    if (!compilerModeSelect) return;
    const opt = compilerModeSelect.querySelector('option[value="emscripten"]') as HTMLOptionElement;
    if (!opt) return;
    if (emscriptenAvailable) {
        opt.textContent = 'Emscripten C++ (via Godbolt)';
        opt.disabled = false;
    } else {
        opt.textContent = 'Emscripten C++ (unavailable)';
        opt.disabled = true;
        if (compilerModeSelect.value === 'emscripten') {
            compilerModeSelect.value = 'micropython';
        }
    }
}

// Auto-setup: Create Arduino board with LED on pin 13
function autoSetupBasicCircuit(forceSetup = false) {
    // Check if there's already saved data, if so, don't auto-setup (unless forced)
    const savedData = localStorage.getItem('savedEditor');
    if (savedData && !forceSetup) {
        // Check if saved data actually has components
        try {
            const parsedData = JSON.parse(savedData);
            if (!parsedData.components || parsedData.components.length === 0) {
                console.log("Saved circuit is empty, running auto-setup");
            } else {
                console.log("Saved circuit found, skipping auto-setup");
                return;
            }
        } catch (e) {
            console.log("Error parsing saved data, running auto-setup");
        }
    }

    console.log("Auto-setting up Arduino Uno with LED on pin 13...");

    // Create Arduino Uno (component id: 0)
    const arduinoFigure = new ComponentFigure(wokwiComponentById[0]);
    hackCable.editor.canvas.add(arduinoFigure.setX(200).setY(100));

    // Create LED (component id: 1)
    const ledFigure = new ComponentFigure(wokwiComponentById[1]);
    hackCable.editor.canvas.add(ledFigure.setX(500).setY(200));

    // Wait for components to be fully rendered before wiring
    setTimeout(() => {
        try {
            // Connect LED anode to Arduino pin 13
            const pin13Port = arduinoFigure.getPortByName("13");
            const ledAnodePort = ledFigure.getPortByName("A");

            if (pin13Port && ledAnodePort) {
                let connection1 = new draw2d.Connection();
                connection1.setRouter(new draw2d.layout.connection.VertexRouter());
                connection1.setSource(pin13Port);
                connection1.setTarget(ledAnodePort);
                hackCable.editor.canvas.add(connection1);
                console.log("Connected pin 13 to LED anode");
            }

            // Connect LED cathode to Arduino GND
            const gndPort = arduinoFigure.getPortByName("GND.3");
            const ledCathodePort = ledFigure.getPortByName("C");

            if (gndPort && ledCathodePort) {
                let connection2 = new draw2d.Connection();
                connection2.setRouter(new draw2d.layout.connection.VertexRouter());
                connection2.setSource(ledCathodePort);
                connection2.setTarget(gndPort);
                hackCable.editor.canvas.add(connection2);
                console.log("Connected LED cathode to GND");
            }

            console.log("Auto-setup complete!");
        } catch (error) {
            console.error("Error during auto-wiring:", error);
        }
    }, 500);
}

// Call auto-setup after a short delay to ensure everything is loaded
setTimeout(() => {
    // Check which board should be loaded
    const selectedBoard = localStorage.getItem('hackCable-selectedBoard') || 'handysense-pro';
    const savedCircuit = localStorage.getItem('savedEditor');

    // Auto-restore saved circuit if it has figures, otherwise run default setup
    let hasRestoredData = false;
    if (savedCircuit) {
        try {
            const parsedData = JSON.parse(savedCircuit);
            if (parsedData.figures && parsedData.figures.length > 0) {
                hackCable.editor.loadEditorSaveData(parsedData);
                hasRestoredData = true;
            }
        } catch (e) {
            console.log("Error parsing saved circuit data:", e);
        }
    }

    if (!hasRestoredData) {
        if (selectedBoard === 'esp32') {
            setupESP32Circuit();
        } else if (selectedBoard === 'custom-esp32') {
            setupCustomESP32Circuit();
        } else if (selectedBoard === 'handysense-pro') {
            setupPhFullControlCircuit();
        } else {
            autoSetupBasicCircuit();
        }
    }

    // Setup automatic code generation when circuit changes
    hackCable.editor.canvas.setOnCircuitChangeCallback((generatedCode: string) => {
        if (codeInput instanceof HTMLTextAreaElement) {
            // Only update if user hasn't written custom code
            const currentCode = codeInput.value.trim();
            if (!currentCode || currentCode.includes('// Auto-generated code based on circuit design')) {
                codeInput.value = generatedCode;
                console.log('Code automatically generated from circuit');
            }
        }
    });

    // Set default example selection and load its code
    const examplesSelect = document.getElementById('code-examples') as HTMLSelectElement;
    if (examplesSelect) {
        examplesSelect.value = 'phFullControl';
    }
    setTimeout(() => {
        if (codeInput instanceof HTMLTextAreaElement && !codeInput.value.trim()) {
            codeInput.value = codeExamples['phFullControl'];
            localStorage.setItem('hackCable-webExample-inputCode', codeInput.value);
        }
    }, 1000);
}, 100);

const compileButton = document.getElementById('compile');
const executeButton = document.getElementById('execute');
const stopButton = document.getElementById('stop');
const pauseButton = document.getElementById('pause');
const codeInput = document.getElementById('code-editor');
const hexInput = document.getElementById('code-compiled');
const statusMessage = document.getElementById('status-message');

const compilerModeSelect = document.getElementById('compiler-mode') as HTMLSelectElement;
const boardSelectEl = document.getElementById('board-select') as HTMLSelectElement;

function updateCompilerVisibility() {
    const board = boardSelectEl?.value;
    const isESP32 = board === 'esp32' || board === 'custom-esp32' || board === 'handysense-pro';
    if (compilerModeSelect) {
        compilerModeSelect.style.display = isESP32 ? 'inline-block' : 'none';
    }
}
boardSelectEl?.addEventListener('change', updateCompilerVisibility);
updateCompilerVisibility();
checkEmscriptenStatus();

if(compileButton && executeButton && stopButton && pauseButton && codeInput instanceof HTMLTextAreaElement && hexInput instanceof HTMLTextAreaElement){

    const code = localStorage.getItem('hackCable-webExample-inputCode');
    if(code) codeInput.value = code;
    const hex = localStorage.getItem('hackCable-webExample-inputHex');
    if(hex) hexInput.value = hex;

    compileButton.addEventListener("click", () => compile());
    executeButton.addEventListener("click", () => { clearSerial(); execute(); switchTab('io'); setTimeout(startIOMonitor, 200); });
    stopButton.addEventListener("click", () => { hackCable.emulatorManager.stop(); stopIOMonitor(); cleanupWasmInstance(); });
    pauseButton.addEventListener("click", () => {
        hackCable.emulatorManager.setPaused(!hackCable.emulatorManager.isPosed())
    });

    function compile(){
        if(!(codeInput instanceof HTMLTextAreaElement && hexInput instanceof HTMLTextAreaElement)) return;

        const boardType = hackCable.editor.canvas.getBoardType();
        if (boardType) hackCable.emulatorManager.setBoardType(boardType);

        const mode = compilerModeSelect?.value ?? 'micropython';

        showStatus('ui.status.compiling', 'info');
        localStorage.setItem('hackCable-webExample-inputCode', codeInput.value);

        if (boardType === 'esp32' && mode === 'emscripten') {
            // --- GODBOLT EMSCRIPTEN PATH ---
            hexInput.value = '// Compiling C++ via Godbolt (Emscripten)...';
            compileWithGodbolt(codeInput.value)
                .then(jsGlue => {
                    lastEmscriptenResult = { js: jsGlue };
                    hexInput.value = '// Emscripten (via Godbolt) compilation OK. Click Execute.';
                    showStatus('ui.status.compileComplete', 'success');
                })
                .catch((err: Error) => {
                    hexInput.value = '// Compilation error:\n' + err.message;
                    showStatus('ui.status.compileFailed', 'error');
                });

        } else if (boardType === 'esp32') {
            // --- MICROPYTHON LEGACY PATH ---
            hackCable.emulatorManager.compileAndLoadCode(codeInput.value).then(() => {});
            hexInput.value = '// ESP32 uses MicroPython - no hex compilation needed';
            showStatus('ui.status.compileComplete', 'success');

        } else {
            // --- ARDUINO AVR PATH ---
            EmulatorManager.compileCode(codeInput.value).then((data: CompileResult) => {
                if(data){
                    hexInput.value = data.hex;
                    localStorage.setItem('hackCable-webExample-inputHex', data.hex);
                    showStatus('ui.status.compileComplete', 'success');
                } else {
                    showStatus('ui.status.compileFailed', 'error');
                }
            }).catch(() => showStatus('ui.status.compileFailed', 'error'));
        }
    }

    function execute(){
        hackCable.emulatorManager.stop();

        const boardType = hackCable.editor.canvas.getBoardType();
        if (boardType) hackCable.emulatorManager.setBoardType(boardType);

        const mode = compilerModeSelect?.value ?? 'micropython';

        if(!(hexInput instanceof HTMLTextAreaElement && codeInput instanceof HTMLTextAreaElement)) return;
        showStatus('ui.status.executing', 'info');

        if (boardType === 'esp32' && mode === 'emscripten') {
            // --- EMSCRIPTEN PATH ---
            if (!lastEmscriptenResult) {
                appendSerial('Error: No compiled WASM. Click Compile first.\n');
                showStatus('ui.status.compileFailed', 'error');
                return;
            }
            clearSerial();
            loadEmscriptenWasm(lastEmscriptenResult.js, lastEmscriptenResult.wasm)
                .then(() => {
                    showStatus('ui.status.executing', 'info');
                    autoActivateSensorsFromCode(codeInput.value);
                })
                .catch(err => {
                    appendSerial('WASM load error: ' + err.message + '\n');
                    showStatus('ui.status.compileFailed', 'error');
                });

        } else if (boardType === 'esp32') {
            // --- MICROPYTHON ---
            hackCable.emulatorManager.run(codeInput.value);

        } else {
            // --- ARDUINO AVR ---
            localStorage.setItem('hackCable-webExample-inputHex', hexInput.value);
            hackCable.emulatorManager.loadCode(hexInput.value);
            hackCable.emulatorManager.run();
        }
    }
}

// Tab switching
function switchTab(tabName: 'code' | 'io') {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.classList.contains(`${tabName}-panel`));
    });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.tab as 'code' | 'io';
        switchTab(tab);
        if (tab === 'io') buildIOList();
    });
});

// I/O panel
let ioMonitorInterval: ReturnType<typeof setInterval> | null = null;
const ioItems = new Map<string, any>();

function getConnectedBoardPin(figure: any): string {
    try {
        const el = figure.componentElement;
        const pinInfo: any[] = el?.pinInfo || [];
        // Build set of non-power pin names (signal pins only)
        const signalPins = new Set(
            pinInfo
                .filter(p => !p.signals?.some((s: any) => s.type === 'power'))
                .map(p => p.name)
        );

        const ports = figure.getPorts().data;
        for (const port of ports) {
            const portId: string = port.getLocator()?.portId || '';
            // Skip power pins if pin info is available
            if (signalPins.size > 0 && !signalPins.has(portId)) continue;

            const conns = port.getConnections().data;
            for (const conn of conns) {
                const otherPort = conn.sourcePort === port ? conn.targetPort : conn.sourcePort;
                const otherInfo = wokwiComponentByClass[otherPort?.getParent()?.componentElement?.constructor?.name];
                if (otherInfo?.type === ComponentType.CARD) {
                    return otherPort.getLocator().portId || '';
                }
            }
        }
    } catch (e) {}
    return '';
}

function readElementState(element: any): { state: string; isOn: boolean } {
    try {
        if (element.ch1 !== undefined) {
            const on = [element.ch1, element.ch2, element.ch3, element.ch4].filter(Boolean).length;
            return { state: `${on}/4 ON`, isOn: on > 0 };
        }
        if (element.isOn !== undefined) {
            return { state: element.isOn ? 'ON' : 'OFF', isOn: !!element.isOn };
        }
        if (typeof element.value === 'boolean') {
            return { state: element.value ? 'ON' : 'OFF', isOn: element.value };
        }
        if (typeof element.value === 'number') {
            return { state: element.value > 0 ? 'ON' : 'OFF', isOn: element.value > 0 };
        }
    } catch (e) {}
    return { state: '—', isOn: false };
}

function buildIOList() {
    const outputsList = document.getElementById('io-outputs-list');
    const inputsList = document.getElementById('io-inputs-list');
    if (!outputsList || !inputsList) return;

    outputsList.innerHTML = '';
    inputsList.innerHTML = '';
    ioItems.clear();

    // Use class names (language-independent) to identify actuator outputs
    const OUTPUT_CLASSES = new Set(['MistingPumpElement', 'WaterPumpElement', 'FanElement', 'RelayElement']);
    const BFARM_OUTPUT_CLASSES = new Set(['FourChannelRelayElement']);
    const figures = hackCable.editor.canvas.getAllFigures();
    let outCount = 0;
    let inCount = 0;

    figures.forEach((figure: any, idx: number) => {
        const el = figure.componentElement;
        if (!el) return;
        const info = wokwiComponentByClass[el.constructor.name];
        if (!info || info.type === ComponentType.CARD || info.type === ComponentType.OTHER) return;

        const isOutput = info.type === ComponentType.LED
            || info.type === ComponentType.MOTOR
            || info.type === ComponentType.TRANSMITTER
            || (info.type === ComponentType.CUSTOM && OUTPUT_CLASSES.has(el.constructor.name))
            || (info.type === ComponentType.BFARM && BFARM_OUTPUT_CLASSES.has(el.constructor.name));
        const isInput = info.type === ComponentType.BUTTON
            || info.type === ComponentType.SENSOR
            || (info.type === ComponentType.CUSTOM && !OUTPUT_CLASSES.has(el.constructor.name))
            || (info.type === ComponentType.BFARM && !BFARM_OUTPUT_CLASSES.has(el.constructor.name));

        if (!isOutput && !isInput) return;

        const pin = getConnectedBoardPin(figure);
        const { state, isOn } = readElementState(el);
        const itemId = `io-${idx}`;

        const item = document.createElement('div');
        item.className = 'io-item';
        item.id = itemId;

        const nameEl = document.createElement('span');
        nameEl.className = 'io-item-name';
        nameEl.textContent = info.name;

        const pinEl = document.createElement('span');
        pinEl.className = 'io-item-pin';
        pinEl.textContent = pin ? `Pin ${pin}` : '';

        const stateEl = document.createElement('span');
        stateEl.className = `io-item-state ${isOn ? 'state-on' : 'state-off'}`;
        stateEl.textContent = isOutput ? state : '—';

        item.appendChild(nameEl);
        item.appendChild(pinEl);
        item.appendChild(stateEl);

        ioItems.set(itemId, { el, isOutput });
        (isOutput ? outputsList : inputsList).appendChild(item);
        isOutput ? outCount++ : inCount++;
    });

    if (outCount === 0) outputsList.innerHTML = '<div class="io-empty">No output components</div>';
    if (inCount === 0) inputsList.innerHTML = '<div class="io-empty">No input components</div>';
}

function updateIOStates() {
    ioItems.forEach(({ el }, id) => {
        const stateEl = document.querySelector(`#${id} .io-item-state`);
        if (!stateEl) return;
        const { state, isOn } = readElementState(el);
        stateEl.textContent = state;
        stateEl.className = `io-item-state ${isOn ? 'state-on' : 'state-off'}`;
    });
}

function startIOMonitor() {
    buildIOList();
    if (ioMonitorInterval) clearInterval(ioMonitorInterval);
    ioMonitorInterval = setInterval(updateIOStates, 250);
}

function stopIOMonitor() {
    if (ioMonitorInterval) { clearInterval(ioMonitorInterval); ioMonitorInterval = null; }
}

function autoActivateSensorsFromCode(code: string) {
    // RS485 sensors use Serial2 (UART) on RXD/TXD pins (default 16/17 on HandySense Pro)
    if (/ModbusMaster|Serial2/.test(code)) {
        const rxDef = code.match(/#define\s+RXD\s+(\d+)/);
        const txDef = code.match(/#define\s+TXD\s+(\d+)/);
        const rx = rxDef ? parseInt(rxDef[1]) : 16;
        const tx = txDef ? parseInt(txDef[1]) : 17;
        hackCable.activateSensorComponent('uart', tx, rx);
    }
    // I2C sensors (SHT31, BH1750) on default ESP32 I2C pins (SDA=21, SCL=22)
    if (/SHT31|BH1750/.test(code)) {
        hackCable.activateSensorComponent('i2c', 21, 22);
    }
}

// Serial Monitor
function appendSerial(data: string) {
    const output = document.getElementById('serial-output');
    if (!output) return;
    output.textContent += data;
    output.scrollTop = output.scrollHeight;
}

function clearSerial() {
    const output = document.getElementById('serial-output');
    if (output) output.textContent = '';
}

hackCable.serialDataCallback = (data: string) => appendSerial(data);
document.getElementById('serial-clear')?.addEventListener('click', clearSerial);

// Emscripten WASM ↔ canvas bridge callbacks
(window as any).hackcable_update_pin = (pin: number, value: boolean) => {
    hackCable.esp32PinUpdate(pin, value);
};
(window as any).hackcable_pin_mode = (_pin: number, _mode: number) => {};
(window as any).hackcable_read_pin = (_pin: number): boolean => false;
(window as any).hackcable_analog_read = (_pin: number): number => 0;
(window as any).hackcable_serial_begin = (_baud: number) => {};
(window as any).hackcable_serial_data = (text: string) => { appendSerial(text); };
// Sensor data bridges (called from Emscripten WASM sensor mocks)
(window as any).hackcable_modbus_read = (_slaveId: number, _regAddr: number): number => 0;
(window as any).hackcable_sht31_temp = (): number => 25.0;
(window as any).hackcable_sht31_humidity = (): number => 60.0;
(window as any).hackcable_bh1750_lux = (): number => 500.0;

// Emscripten WASM cleanup
async function cleanupWasmInstance() {
    if (activeWasmModule) {
        try {
            if (typeof activeWasmModule.ccall === 'function') {
                activeWasmModule.ccall('emscripten_cancel_main_loop', null, [], []);
            }
        } catch (e) { /* WASM may already be terminated */ }
        activeWasmModule = null;
    }
    if (activeWasmScript) {
        activeWasmScript.remove();
        activeWasmScript = null;
    }
    delete (window as any).HackCableModule;
}

// Emscripten WASM loader
// wasmBase64 is optional: omit when using SINGLE_FILE mode (WASM is embedded in jsGlue)
async function loadEmscriptenWasm(jsGlue: string, wasmBase64?: string) {
    await cleanupWasmInstance();

    // Load JS glue via Blob URL (same-origin, no CORS issues)
    const blobUrl = URL.createObjectURL(new Blob([jsGlue], { type: 'application/javascript' }));
    await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = blobUrl;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Emscripten JS glue'));
        document.head.appendChild(script);
        activeWasmScript = script;
    });
    URL.revokeObjectURL(blobUrl);

    // Instantiate WASM module via the factory function
    const factory = (window as any).HackCableModule;
    if (!factory) throw new Error('HackCableModule factory not found after script load');

    const factoryOptions: any = {
        print: (t: string) => appendSerial(t + '\n'),
        printErr: (t: string) => console.warn('[Emscripten]', t),
        locateFile: (p: string) => p
    };
    if (wasmBase64) {
        // Decode base64 → ArrayBuffer (backend / non-SINGLE_FILE mode)
        factoryOptions.wasmBinary = Uint8Array.from(atob(wasmBase64), c => c.charCodeAt(0)).buffer;
    }

    activeWasmModule = await factory(factoryOptions);
}

// Initialize sidebar toggle functionality
function initializeSidebarToggle() {
    const sideBar = document.querySelector('.sideBar') as HTMLElement;
    const toggleBtn = document.querySelector('.toggle-sidebar') as HTMLButtonElement;

    if (!sideBar || !toggleBtn) {
        console.warn('[HackCable] Unable to find sidebar or toggle button');
        return;
    }

    // Load saved state from localStorage (default is shown, not hidden)
    const isSideBarHidden = localStorage.getItem('hackCable-sidebar-hidden') === 'true';
    if (isSideBarHidden) {
        sideBar.classList.add('hidden');
        toggleBtn.classList.add('sidebar-hidden');
    } else {
        // Ensure sidebar is shown by default
        sideBar.classList.remove('hidden');
        toggleBtn.classList.remove('sidebar-hidden');
    }

    // Handle toggle button click
    toggleBtn.addEventListener('click', () => {
        sideBar.classList.toggle('hidden');
        toggleBtn.classList.toggle('sidebar-hidden');

        // Save state to localStorage
        const isNowHidden = sideBar.classList.contains('hidden');
        localStorage.setItem('hackCable-sidebar-hidden', isNowHidden.toString());
    });
}

// Call after DOM is ready
initializeSidebarToggle();

// Initialize control bar toggle functionality
function initializeControlBarToggle() {
    const controlBar = document.querySelector('.controlBar') as HTMLElement;
    const toggleBtn = document.querySelector('.toggle-controlbar') as HTMLButtonElement;

    if (!controlBar || !toggleBtn) return;

    const isHidden = localStorage.getItem('hackCable-controlbar-hidden') === 'true';
    if (isHidden) {
        controlBar.classList.add('hidden');
        document.body.classList.add('controlbar-hidden');
    } else {
        toggleBtn.classList.add('panel-open');
    }

    toggleBtn.addEventListener('click', () => {
        controlBar.classList.toggle('hidden');
        const isNowHidden = controlBar.classList.contains('hidden');
        toggleBtn.classList.toggle('panel-open', !isNowHidden);
        document.body.classList.toggle('controlbar-hidden', isNowHidden);
        localStorage.setItem('hackCable-controlbar-hidden', isNowHidden.toString());
    });
}

initializeControlBarToggle();

const save = document.getElementById('save');
const restore = document.getElementById('restore');
const clearAll = document.getElementById('clear-all');

if(save && restore && clearAll){
    save.addEventListener("click", () => {
        const data = hackCable.editor.getEditorSaveData();
        console.log('Saving data:', data)
        localStorage.setItem('savedEditor', JSON.stringify(data));
    });
    restore.addEventListener("click", () => {
        const data = JSON.parse(<string>localStorage.getItem('savedEditor'));
        console.log('Loading data:', data)
        hackCable.editor.loadEditorSaveData(data)
    });
    clearAll.addEventListener("click", () => {
        if(confirm('Êtes-vous sûr de vouloir effacer tous les composants et câblages ?')) {
            console.log('Clearing all components and wiring...');
            hackCable.editor.canvas.clear();
            localStorage.removeItem('savedEditor');
            console.log('Canvas cleared!');
            // Re-run auto-setup with force flag to bypass saved data check
            setTimeout(() => autoSetupBasicCircuit(true), 100);
        }
    });
}

// Function to update UI translations
function updateUITranslations() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        if (key) {
            const translated = (window as any).i18next.t(key);
            element.textContent = translated;
        }
    });
}

// Function to show status messages
function showStatus(messageKey: string, type: 'info' | 'success' | 'error') {
    if (statusMessage) {
        const translated = (window as any).i18next.t(messageKey);
        statusMessage.textContent = translated;
        statusMessage.className = `status-message status-${type}`;

        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.textContent = '';
                statusMessage.className = 'status-message';
            }, 3000);
        }
    }
}

// Apply translations on page load
setTimeout(() => updateUITranslations(), 200);

// Code examples
const codeExamples: {[key: string]: string} = {
    blink: `// LED Blink - Basic Example
// Pin 13 has an LED connected on most Arduino boards

void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);   // Turn LED on
  delay(1000);              // Wait 1 second
  digitalWrite(13, LOW);    // Turn LED off
  delay(1000);              // Wait 1 second
}`,
    button: `// Button Input Example
// Button on pin 2, LED on pin 13

void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
}

void loop() {
  int buttonState = digitalRead(2);

  if (buttonState == LOW) {
    digitalWrite(13, HIGH);  // Turn LED on when button pressed
  } else {
    digitalWrite(13, LOW);   // Turn LED off when button released
  }
}`,
    fade: `// LED Fade Example
// LED on pin 9 (must be PWM pin)

int brightness = 0;
int fadeAmount = 5;

void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  analogWrite(9, brightness);

  brightness = brightness + fadeAmount;

  if (brightness <= 0 || brightness >= 255) {
    fadeAmount = -fadeAmount;
  }

  delay(30);
}`,

    // ============================================
    // Handysense Pro Smart Farm Examples
    // ============================================

    // Example 1: pH Misting Control (1 sensor + 1 actuator)
    phMistingControl: `// pH-based Misting Control - Handysense Pro
// pH Sensor on IO36 (analog), Misting Pump on IO25 (relay R1)

const int PH_SENSOR_PIN = 36;    // Analog input for pH sensor
const int MIST_PUMP_PIN = 25;    // Relay output for misting pump

float phValue = 0.0;
const float PH_THRESHOLD_LOW = 6.0;   // Start misting below this pH
const float PH_THRESHOLD_HIGH = 7.5;  // Stop misting above this pH

void setup() {
  Serial.begin(115200);
  pinMode(MIST_PUMP_PIN, OUTPUT);
  digitalWrite(MIST_PUMP_PIN, LOW);  // Pump off initially
  Serial.println("pH Misting Control System Started");
}

void loop() {
  // Read pH sensor (analog value 0-4095 maps to pH 0-14)
  int rawValue = analogRead(PH_SENSOR_PIN);
  phValue = (rawValue / 4095.0) * 14.0;

  Serial.print("pH Value: ");
  Serial.println(phValue);

  // Control misting pump based on pH
  if (phValue < PH_THRESHOLD_LOW) {
    digitalWrite(MIST_PUMP_PIN, HIGH);  // Turn on misting
    Serial.println("Misting Pump: ON (Low pH detected)");
  } else if (phValue > PH_THRESHOLD_HIGH) {
    digitalWrite(MIST_PUMP_PIN, LOW);   // Turn off misting
    Serial.println("Misting Pump: OFF");
  }

  delay(2000);  // Read every 2 seconds
}`,

    // Example 2: Humidity Fan Control (1 sensor + 1 actuator)
    humidityFanControl: `// Humidity-based Fan Control - Handysense Pro
// Humidity Sensor on IO39 (analog), Cooling Fan on IO4 (relay R2)

const int HUMIDITY_SENSOR_PIN = 39;  // Analog input for humidity sensor
const int FAN_PIN = 4;               // Relay output for cooling fan

float humidity = 0.0;
const float HUMIDITY_HIGH = 80.0;    // Turn on fan above this humidity
const float HUMIDITY_LOW = 60.0;     // Turn off fan below this humidity

void setup() {
  Serial.begin(115200);
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);  // Fan off initially
  Serial.println("Humidity Fan Control System Started");
}

void loop() {
  // Read humidity sensor (analog value 0-4095 maps to 0-100% RH)
  int rawValue = analogRead(HUMIDITY_SENSOR_PIN);
  humidity = (rawValue / 4095.0) * 100.0;

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

  // Control fan based on humidity (hysteresis control)
  if (humidity > HUMIDITY_HIGH) {
    digitalWrite(FAN_PIN, HIGH);  // Turn on fan
    Serial.println("Cooling Fan: ON (High humidity)");
  } else if (humidity < HUMIDITY_LOW) {
    digitalWrite(FAN_PIN, LOW);   // Turn off fan
    Serial.println("Cooling Fan: OFF");
  }

  delay(2000);  // Read every 2 seconds
}`,

    // Example 3: pH Full Control (1 sensor + 2 actuators)
    phFullControl: `// pH-based Full Control System - Handysense Pro
// pH Sensor on IO36, Misting Pump on IO25 (R1), Fan on IO4 (R2)

const int PH_SENSOR_PIN = 36;    // Analog input for pH sensor
const int MIST_PUMP_PIN = 25;    // Relay output for misting pump
const int FAN_PIN = 4;           // Relay output for cooling fan

float phValue = 0.0;
const float PH_LOW = 5.5;        // Very acidic - activate mist + fan
const float PH_MID_LOW = 6.5;    // Slightly acidic - activate mist only
const float PH_OPTIMAL = 7.0;    // Optimal - all off
const float PH_HIGH = 8.0;       // Alkaline - activate fan only

void setup() {
  Serial.begin(115200);
  pinMode(MIST_PUMP_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(MIST_PUMP_PIN, LOW);
  digitalWrite(FAN_PIN, LOW);
  Serial.println("pH Full Control System Started");
}

void loop() {
  // Read pH sensor
  int rawValue = analogRead(PH_SENSOR_PIN);
  phValue = (rawValue / 4095.0) * 14.0;

  Serial.print("pH Value: ");
  Serial.println(phValue);

  // Multi-level control based on pH
  if (phValue < PH_LOW) {
    // Very acidic - maximum response
    digitalWrite(MIST_PUMP_PIN, HIGH);
    digitalWrite(FAN_PIN, HIGH);
    Serial.println("ALERT: Very acidic! Mist+Fan ON");
  } else if (phValue < PH_MID_LOW) {
    // Slightly acidic - mist only
    digitalWrite(MIST_PUMP_PIN, HIGH);
    digitalWrite(FAN_PIN, LOW);
    Serial.println("Acidic: Mist ON, Fan OFF");
  } else if (phValue > PH_HIGH) {
    // Alkaline - fan only for ventilation
    digitalWrite(MIST_PUMP_PIN, LOW);
    digitalWrite(FAN_PIN, HIGH);
    Serial.println("Alkaline: Mist OFF, Fan ON");
  } else {
    // Optimal range
    digitalWrite(MIST_PUMP_PIN, LOW);
    digitalWrite(FAN_PIN, LOW);
    Serial.println("Optimal pH: All OFF");
  }

  delay(2000);
}`,

    // Example 4: Humidity Climate Control (1 sensor + 2 actuators)
    humidityClimateControl: `// Humidity Climate Control - Handysense Pro
// Humidity Sensor on IO39, Misting Pump on IO25 (R1), Fan on IO4 (R2)

const int HUMIDITY_SENSOR_PIN = 39;  // Analog input
const int MIST_PUMP_PIN = 25;        // Relay for misting
const int FAN_PIN = 4;               // Relay for fan

float humidity = 0.0;
const float HUMIDITY_VERY_HIGH = 85.0;  // Too humid - fan only
const float HUMIDITY_HIGH = 75.0;       // High - fan only
const float HUMIDITY_OPTIMAL_LOW = 50.0;// Optimal range start
const float HUMIDITY_LOW = 40.0;        // Too dry - mist only
const float HUMIDITY_VERY_LOW = 30.0;   // Very dry - mist + fan

void setup() {
  Serial.begin(115200);
  pinMode(MIST_PUMP_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(MIST_PUMP_PIN, LOW);
  digitalWrite(FAN_PIN, LOW);
  Serial.println("Humidity Climate Control Started");
}

void loop() {
  // Read humidity sensor
  int rawValue = analogRead(HUMIDITY_SENSOR_PIN);
  humidity = (rawValue / 4095.0) * 100.0;

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

  // Climate control logic
  if (humidity > HUMIDITY_VERY_HIGH) {
    // Too humid - ventilate only
    digitalWrite(MIST_PUMP_PIN, LOW);
    digitalWrite(FAN_PIN, HIGH);
    Serial.println("Very High Humidity: Fan ON only");
  } else if (humidity > HUMIDITY_HIGH) {
    // High - gentle ventilation
    digitalWrite(MIST_PUMP_PIN, LOW);
    digitalWrite(FAN_PIN, HIGH);
    Serial.println("High Humidity: Fan ON");
  } else if (humidity < HUMIDITY_VERY_LOW) {
    // Very dry - mist + circulate
    digitalWrite(MIST_PUMP_PIN, HIGH);
    digitalWrite(FAN_PIN, HIGH);
    Serial.println("Very Dry: Mist+Fan ON");
  } else if (humidity < HUMIDITY_LOW) {
    // Dry - add moisture
    digitalWrite(MIST_PUMP_PIN, HIGH);
    digitalWrite(FAN_PIN, LOW);
    Serial.println("Low Humidity: Mist ON");
  } else {
    // Optimal range
    digitalWrite(MIST_PUMP_PIN, LOW);
    digitalWrite(FAN_PIN, LOW);
    Serial.println("Optimal Humidity: All OFF");
  }

  delay(2000);
}`,

    // Example 5: Dual Sensor Misting (2 sensors + 1 actuator)
    dualSensorMisting: `// Dual Sensor Misting System - Handysense Pro
// pH Sensor on IO36, Humidity Sensor on IO39, Misting Pump on IO25 (R1)

const int PH_SENSOR_PIN = 36;        // Analog input for pH
const int HUMIDITY_SENSOR_PIN = 39;  // Analog input for humidity
const int MIST_PUMP_PIN = 25;        // Relay output for misting

float phValue = 0.0;
float humidity = 0.0;

const float PH_THRESHOLD = 6.5;        // Mist if pH below this
const float HUMIDITY_THRESHOLD = 50.0; // Mist if humidity below this

void setup() {
  Serial.begin(115200);
  pinMode(MIST_PUMP_PIN, OUTPUT);
  digitalWrite(MIST_PUMP_PIN, LOW);
  Serial.println("Dual Sensor Misting System Started");
}

void loop() {
  // Read both sensors
  int phRaw = analogRead(PH_SENSOR_PIN);
  int humRaw = analogRead(HUMIDITY_SENSOR_PIN);

  phValue = (phRaw / 4095.0) * 14.0;
  humidity = (humRaw / 4095.0) * 100.0;

  Serial.print("pH: ");
  Serial.print(phValue);
  Serial.print(" | Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

  // Misting decision based on EITHER condition
  bool needsMisting = false;

  if (phValue < PH_THRESHOLD) {
    needsMisting = true;
    Serial.println("-> Low pH detected");
  }
  if (humidity < HUMIDITY_THRESHOLD) {
    needsMisting = true;
    Serial.println("-> Low Humidity detected");
  }

  if (needsMisting) {
    digitalWrite(MIST_PUMP_PIN, HIGH);
    Serial.println("Misting Pump: ON");
  } else {
    digitalWrite(MIST_PUMP_PIN, LOW);
    Serial.println("Misting Pump: OFF (Conditions optimal)");
  }

  delay(2000);
}`,

    // Example 6: Dual Sensor Fan Control (2 sensors + 1 actuator)
    dualSensorFan: `// Dual Sensor Fan Control - Handysense Pro
// pH Sensor on IO36, Humidity Sensor on IO39, Cooling Fan on IO4 (R2)

const int PH_SENSOR_PIN = 36;        // Analog input for pH
const int HUMIDITY_SENSOR_PIN = 39;  // Analog input for humidity
const int FAN_PIN = 4;               // Relay output for fan

float phValue = 0.0;
float humidity = 0.0;

const float PH_ALKALINE = 8.5;        // Ventilate if pH above this
const float HUMIDITY_HIGH = 75.0;     // Ventilate if humidity above this

void setup() {
  Serial.begin(115200);
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);
  Serial.println("Dual Sensor Fan Control Started");
}

void loop() {
  // Read both sensors
  int phRaw = analogRead(PH_SENSOR_PIN);
  int humRaw = analogRead(HUMIDITY_SENSOR_PIN);

  phValue = (phRaw / 4095.0) * 14.0;
  humidity = (humRaw / 4095.0) * 100.0;

  Serial.print("pH: ");
  Serial.print(phValue);
  Serial.print(" | Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

  // Fan decision based on EITHER condition
  bool needsVentilation = false;

  if (phValue > PH_ALKALINE) {
    needsVentilation = true;
    Serial.println("-> High pH detected");
  }
  if (humidity > HUMIDITY_HIGH) {
    needsVentilation = true;
    Serial.println("-> High Humidity detected");
  }

  if (needsVentilation) {
    digitalWrite(FAN_PIN, HIGH);
    Serial.println("Cooling Fan: ON");
  } else {
    digitalWrite(FAN_PIN, LOW);
    Serial.println("Cooling Fan: OFF (Conditions optimal)");
  }

  delay(2000);
}`,

    // Example 7: Relay Sequential Blink (4 relays)
    // Example 8: MCP23008 Smart Farm Control (2 sensors + 4 MCP23008 outputs)
    mcpSmartControl: `#include <HandySense.h>
#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include "time.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "MCP23008.h"

MCP23008 MCP (0x24);
void setup() {
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Wire.setClock(10000);
  MCP.begin();
  MCP.pinMode8(0x00);

}

void loop() {
  MCP.digitalWrite(0, HIGH);
  delay(500);

  MCP.digitalWrite(0, LOW);
  delay(500);
}`,

    relaySequentialBlink: `// Relay Sequential Blink - Handysense Pro
// Adapted from HandySense MCP23008 example for direct GPIO control
// 4 Relay modules on IO25 (R1), IO4 (R2), IO12 (R3), IO13 (R4)

const int RELAY1_PIN = 25;   // Relay R1 - IO25
const int RELAY2_PIN = 4;    // Relay R2 - IO4
const int RELAY3_PIN = 12;   // Relay R3 - IO12
const int RELAY4_PIN = 13;   // Relay R4 - IO13

void setup() {
  Serial.begin(115200);
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(RELAY3_PIN, OUTPUT);
  pinMode(RELAY4_PIN, OUTPUT);
  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
  digitalWrite(RELAY3_PIN, LOW);
  digitalWrite(RELAY4_PIN, LOW);
  Serial.println("Relay Sequential Blink Started");
}

void loop() {
  digitalWrite(RELAY1_PIN, HIGH);
  Serial.println("Relay 1: ON");
  delay(500);
  digitalWrite(RELAY1_PIN, LOW);
  Serial.println("Relay 1: OFF");
  delay(500);

  digitalWrite(RELAY2_PIN, HIGH);
  Serial.println("Relay 2: ON");
  delay(500);
  digitalWrite(RELAY2_PIN, LOW);
  Serial.println("Relay 2: OFF");
  delay(500);

  digitalWrite(RELAY3_PIN, HIGH);
  Serial.println("Relay 3: ON");
  delay(500);
  digitalWrite(RELAY3_PIN, LOW);
  Serial.println("Relay 3: OFF");
  delay(500);

  digitalWrite(RELAY4_PIN, HIGH);
  Serial.println("Relay 4: ON");
  delay(500);
  digitalWrite(RELAY4_PIN, LOW);
  Serial.println("Relay 4: OFF");
  delay(500);
}`
,

    // ============================================
    // BFarm - Field Sensor Examples
    // ============================================

    // BFarm 1: RS485 pH Sensor (component ID 35)
    bfarm_rs485_ph: `// BFarm - RS485 pH Sensor (pH-4502C) - Handysense Pro
// Connect: VCC→3V3_R3, GND→GND_R3, A+→TX2 (pin 17), B-→RX2 (pin 16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

#define RXD 16
#define TXD 17

ModbusMaster PHrs485;
float PH;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  PHrs485.begin(1, Serial2);
  Serial.println("RS485 pH Sensor Ready");
}

void loop() {
  uint8_t result_PH;
  result_PH = PHrs485.readHoldingRegisters(0, 2);
  PH = PHrs485.getResponseBuffer(1) / 10.00f;
  Serial.print("pH: ");
  Serial.println(PH);
  delay(1000);
}`,

    // BFarm 2: RS485 Light Sensor (component ID 36)
    bfarm_rs485_light: `// BFarm - RS485 Light Sensor (DT-Par485) - Handysense Pro
// Connect: VCC→3V3_R3, GND→GND_R3, A+→TX2 (pin 17), B-→RX2 (pin 16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

#define RXD 16
#define TXD 17

ModbusMaster rs485_pair;
float lightValue;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  rs485_pair.begin(1, Serial2);
  Serial.println("RS485 Light Sensor Ready");
}

void loop() {
  uint8_t result_pair;
  result_pair = rs485_pair.readHoldingRegisters(0, 2);
  lightValue = rs485_pair.getResponseBuffer(0);
  Serial.print("Light (lux): ");
  Serial.println(lightValue);
  delay(1000);
}`,

    // BFarm 3: RS485 Rain Sensor (component ID 37)
    bfarm_rs485_rain: `// BFarm - RS485 Rain Sensor - Handysense Pro
// Connect: VCC→3V3_R3, GND→GND_R3, A+→TX2 (pin 17), B-→RX2 (pin 16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

#define RXD 16
#define TXD 17

ModbusMaster rs485_rain;
float rain;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  rs485_rain.begin(1, Serial2);
  Serial.println("RS485 Rain Sensor Ready");
}

void loop() {
  uint8_t result_rain;
  result_rain = rs485_rain.readHoldingRegisters(0, 2);
  rain = rs485_rain.getResponseBuffer(0) / 10.0f;
  Serial.print("Rain (mm): ");
  Serial.println(rain);
  delay(1000);
}`,

    // BFarm 4: RS485 Wind Speed Sensor (component ID 38)
    bfarm_rs485_wind: `// BFarm - RS485 Wind Speed Sensor - Handysense Pro
// Connect: VCC→3V3_R3, GND→GND_R3, A+→TX2 (pin 17), B-→RX2 (pin 16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

#define RXD 16
#define TXD 17

ModbusMaster rs485_winds;
float windSpeed;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  rs485_winds.begin(1, Serial2);
  Serial.println("RS485 Wind Speed Sensor Ready");
}

void loop() {
  uint8_t result_winds;
  result_winds = rs485_winds.readHoldingRegisters(0, 2);
  windSpeed = rs485_winds.getResponseBuffer(0) / 10.0f;
  Serial.print("Wind Speed (m/s): ");
  Serial.println(windSpeed);
  delay(1000);
}`,

    // BFarm 5: RS485 PAR Sensor (component ID 39)
    bfarm_rs485_par: `// BFarm - RS485 PAR Sensor - Handysense Pro
// Connect: VCC→3V3_R3, GND→GND_R3, A+→TX2 (pin 17), B-→RX2 (pin 16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

#define RXD 16
#define TXD 17

ModbusMaster rs485_LightPar;
float LightPar;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  rs485_LightPar.begin(1, Serial2);
  Serial.println("RS485 PAR Sensor Ready");
}

void loop() {
  uint8_t result_LightPar;
  result_LightPar = rs485_LightPar.readHoldingRegisters(0, 2);
  LightPar = rs485_LightPar.getResponseBuffer(0);
  Serial.print("PAR (umol/m2/s): ");
  Serial.println(LightPar);
  delay(1000);
}`,

    // BFarm 6: Weather Sensor HTCo2PLx (component ID 40)
    bfarm_rs485_weather: `// BFarm - Weather Sensor HTCo2PLx (RS485) - Handysense Pro
// Connect: VCC→3V3_R3, GND→GND_R3, A+→TX2 (pin 17), B-→RX2 (pin 16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

#define RXD 16
#define TXD 17

ModbusMaster rs485_Weather_HTCo2PLx;
float weatherHumidity, weatherTemp, weatherCO2, weatherPressure;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  rs485_Weather_HTCo2PLx.begin(1, Serial2);
  Serial.println("Weather Sensor HTCo2PLx Ready");
}

void loop() {
  uint8_t result_rs485_Weather_HTCo2PLx;
  result_rs485_Weather_HTCo2PLx = rs485_Weather_HTCo2PLx.readHoldingRegisters(500, 10);
  weatherHumidity = rs485_Weather_HTCo2PLx.getResponseBuffer(0) / 10.00f;
  weatherTemp     = rs485_Weather_HTCo2PLx.getResponseBuffer(1) / 10.00f;
  weatherCO2      = rs485_Weather_HTCo2PLx.getResponseBuffer(3) / 1.00f;
  weatherPressure = rs485_Weather_HTCo2PLx.getResponseBuffer(5) / 1.00f;
  Serial.print("Humidity: ");    Serial.print(weatherHumidity);    Serial.println(" %");
  Serial.print("Temperature: "); Serial.print(weatherTemp);        Serial.println(" C");
  Serial.print("CO2: ");         Serial.print(weatherCO2);         Serial.println(" ppm");
  Serial.print("Pressure: ");    Serial.print(weatherPressure);    Serial.println(" hPa");
  delay(2000);
}`,

    // BFarm 7: SHT31 Sensor (component ID 41)
    bfarm_sht31: `// BFarm - SHT31 Temperature & Humidity Sensor (I2C) - Handysense Pro
// Connect: VCC→3V3_R1, GND→GND_R1, SDA→SDA_1, SCL→SCL_1

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <SHT31.h>

SHT31 sht31;
float sht31Temp, sht31Humidity;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  sht31.begin(0x44);
  Serial.println("SHT31 Sensor Ready");
}

void loop() {
  sht31.read();
  sht31Temp     = sht31.getTemperature();
  sht31Humidity = sht31.getHumidity();
  Serial.print("Temperature: "); Serial.print(sht31Temp);     Serial.println(" C");
  Serial.print("Humidity: ");    Serial.print(sht31Humidity); Serial.println(" %");
  delay(1000);
}`,

    // BFarm 8: BH1750 Light Sensor (component ID 42)
    bfarm_bh1750: `// BFarm - BH1750 Ambient Light Sensor (I2C) - Handysense Pro
// Connect: VCC→3V3_R1, GND→GND_R1, SDA→SDA_1, SCL→SCL_1

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <BH1750.h>

BH1750 lightMeter;
float lux;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  lightMeter.begin();
  Serial.println("BH1750 Light Sensor Ready");
}

void loop() {
  lux = lightMeter.readLightLevel();
  Serial.print("Light: "); Serial.print(lux); Serial.println(" lx");
  delay(1000);
}`,

    // BFarm 9: 4-20mA Current Loop (component ID 43)
    bfarm_current420ma: `// BFarm - 4-20mA Current Loop (MCP3424 I2C ADC) - Handysense Pro
// Connect: VCC→3V3_R2, GND→GND_R2, SDA→SDA_2, SCL→SCL_2

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>

// HandySense built-in MCP3424 functions:
// Read4_20mA_MPC3424(ch)  - reads 4-20mA on channel 1-4
// Read4_20mA_MPC3424_map(ch, inMin, inMax, outMin, outMax) - scaled read
float currentMA;
float scaledValue;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial.println("4-20mA Current Loop Ready");
}

void loop() {
  currentMA   = Read4_20mA_MPC3424(1);
  scaledValue = Read4_20mA_MPC3424_map(1, 4.0, 20.0, 0.0, 100.0);
  Serial.print("Current (mA): ");   Serial.println(currentMA);
  Serial.print("Mapped (0-100): "); Serial.println(scaledValue);
  delay(1000);
}`,

    // BFarm 10: Soil Moisture Sensor (component ID 44)
    bfarm_soil_moisture: `// BFarm - Soil Moisture Sensor (Analog) - Handysense Pro
// Connect: VCC→3V3_2, GND→GND_2, AO→IO36

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>

const int SOIL_PIN = 36;
int soilRaw;
float soilPercent;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial.println("Soil Moisture Sensor Ready");
}

void loop() {
  soilRaw     = analogRead(SOIL_PIN);
  soilPercent = map(soilRaw, 4095, 0, 0, 100);
  Serial.print("Soil Raw: ");      Serial.println(soilRaw);
  Serial.print("Soil Moisture: "); Serial.print(soilPercent); Serial.println(" %");
  delay(1000);
}`,

    // BFarm 11: Four Channel Relay (component ID 45)
    bfarm_relay: `// BFarm - 4-Channel Relay Module - Handysense Pro
// Connect: VCC→VIN_1, GND→GND_5
//          IN1→IO25, IN2→IO4, IN3→IO12, IN4→IO13

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>

const int RELAY1 = 25;
const int RELAY2 = 4;
const int RELAY3 = 12;
const int RELAY4 = 13;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  pinMode(RELAY1, OUTPUT); pinMode(RELAY2, OUTPUT);
  pinMode(RELAY3, OUTPUT); pinMode(RELAY4, OUTPUT);
  digitalWrite(RELAY1, LOW); digitalWrite(RELAY2, LOW);
  digitalWrite(RELAY3, LOW); digitalWrite(RELAY4, LOW);
  Serial.println("4-Channel Relay Ready");
}

void loop() {
  digitalWrite(RELAY1, HIGH); Serial.println("Relay 1 ON");  delay(500);
  digitalWrite(RELAY1, LOW);  Serial.println("Relay 1 OFF"); delay(500);
  digitalWrite(RELAY2, HIGH); Serial.println("Relay 2 ON");  delay(500);
  digitalWrite(RELAY2, LOW);  Serial.println("Relay 2 OFF"); delay(500);
  digitalWrite(RELAY3, HIGH); Serial.println("Relay 3 ON");  delay(500);
  digitalWrite(RELAY3, LOW);  Serial.println("Relay 3 OFF"); delay(500);
  digitalWrite(RELAY4, HIGH); Serial.println("Relay 4 ON");  delay(500);
  digitalWrite(RELAY4, LOW);  Serial.println("Relay 4 OFF"); delay(500);
}`,

    // BFarm 12: Fertilizer pH Sensor (component ID 46)
    bfarm_fertilizer_ph: `// BFarm - Fertilizer pH Sensor (RS485) - Handysense Pro
// Connect: VCC→3V3_R3, GND→GND_R3, A+→TX2 (pin 17), B-→RX2 (pin 16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

#define RXD 16
#define TXD 17

ModbusMaster FertPH;
float fertPH, fertTemp;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  FertPH.begin(1, Serial2);
  Serial.println("Fertilizer pH Sensor Ready");
}

void loop() {
  uint8_t result_FertPH;
  result_FertPH = FertPH.readHoldingRegisters(0, 2);
  fertPH   = FertPH.getResponseBuffer(1) / 10.00f;
  fertTemp = FertPH.getResponseBuffer(0) / 10.00f;
  Serial.print("Fertilizer pH: ");  Serial.println(fertPH);
  Serial.print("Solution Temp: "); Serial.print(fertTemp); Serial.println(" C");
  delay(1000);
}`,

    // BFarm 13: EC Sensor (component ID 47)
    bfarm_ec: `// BFarm - EC (Electrical Conductivity) Sensor (RS485) - Handysense Pro
// Connect: VCC→3V3_R3, GND→GND_R3, A+→TX2 (pin 17), B-→RX2 (pin 16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

#define RXD 16
#define TXD 17

ModbusMaster EcSensor;
float ecValue, ecTemp;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  EcSensor.begin(2, Serial2);
  Serial.println("EC Sensor Ready");
}

void loop() {
  uint8_t result_EC;
  result_EC = EcSensor.readHoldingRegisters(0, 2);
  ecValue = EcSensor.getResponseBuffer(0) / 10.00f;
  ecTemp  = EcSensor.getResponseBuffer(1) / 10.00f;
  Serial.print("EC: ");   Serial.print(ecValue); Serial.println(" mS/cm");
  Serial.print("Temp: "); Serial.print(ecTemp);  Serial.println(" C");
  delay(1000);
}`,

    // BFarm 14: Fertilizer Temp Sensor (component ID 48)
    bfarm_fertilizer_temp: `// BFarm - Fertilizer Temperature Sensor (RS485) - Handysense Pro
// Connect: VCC→3V3_R3, GND→GND_R3, A+→TX2 (pin 17), B-→RX2 (pin 16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

#define RXD 16
#define TXD 17

ModbusMaster FertTemp;
float fertSolTemp;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  FertTemp.begin(3, Serial2);
  Serial.println("Fertilizer Temp Sensor Ready");
}

void loop() {
  uint8_t result_FertTemp;
  result_FertTemp = FertTemp.readHoldingRegisters(0, 2);
  fertSolTemp = FertTemp.getResponseBuffer(0) / 10.00f;
  Serial.print("Fertilizer Solution Temp: ");
  Serial.print(fertSolTemp); Serial.println(" C");
  delay(1000);
}`,

    // BFarm 15: Four Channel Button (component ID 49)
    bfarm_button: `// BFarm - 4-Channel Button Module - Handysense Pro
// Connect: VCC→3V3_4, GND→GND_4
//          B1→IO32, B2→IO33, B3→IO15, B4→IO39

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>

const int BTN1 = 32;
const int BTN2 = 33;
const int BTN3 = 15;
const int BTN4 = 39;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  pinMode(BTN1, INPUT_PULLUP);
  pinMode(BTN2, INPUT_PULLUP);
  pinMode(BTN3, INPUT_PULLUP);
  pinMode(BTN4, INPUT_PULLUP);
  Serial.println("4-Channel Button Ready");
}

void loop() {
  if (digitalRead(BTN1) == LOW) {
    Serial.println("Button 1 pressed");
    delay(200);
  }
  if (digitalRead(BTN2) == LOW) {
    Serial.println("Button 2 pressed");
    delay(200);
  }
  if (digitalRead(BTN3) == LOW) {
    Serial.println("Button 3 pressed");
    delay(200);
  }
  if (digitalRead(BTN4) == LOW) {
    Serial.println("Button 4 pressed");
    delay(200);
  }
}`
};

const codeExamplesSelect = document.getElementById('code-examples') as HTMLSelectElement;

if (codeExamplesSelect && codeInput instanceof HTMLTextAreaElement) {
    codeExamplesSelect.addEventListener('change', () => {
        const selectedExample = codeExamplesSelect.value;
        if (selectedExample && codeExamples[selectedExample]) {
            codeInput.value = codeExamples[selectedExample];
            localStorage.setItem('hackCable-webExample-inputCode', codeInput.value);
            console.log(`Loaded example: ${selectedExample}`);

            // Setup circuit for Handysense Pro Smart Farm examples
            switch(selectedExample) {
                case 'phMistingControl':
                    setupPhMistingCircuit();
                    break;
                case 'humidityFanControl':
                    setupHumidityFanCircuit();
                    break;
                case 'phFullControl':
                    setupPhFullControlCircuit();
                    break;
                case 'humidityClimateControl':
                    setupHumidityClimateControlCircuit();
                    break;
                case 'dualSensorMisting':
                    setupDualSensorMistingCircuit();
                    break;
                case 'dualSensorFan':
                    setupDualSensorFanCircuit();
                    break;
                case 'relaySequentialBlink':
                    setupRelayBlinkCircuit();
                    break;
                case 'mcpSmartControl':
                    setupMcpSmartControlCircuit();
                    break;
                // BFarm Field Sensor Examples
                case 'bfarm_rs485_ph':
                    setupBfarmRs485PhCircuit();
                    break;
                case 'bfarm_rs485_light':
                    setupBfarmRs485LightCircuit();
                    break;
                case 'bfarm_rs485_rain':
                    setupBfarmRs485RainCircuit();
                    break;
                case 'bfarm_rs485_wind':
                    setupBfarmRs485WindCircuit();
                    break;
                case 'bfarm_rs485_par':
                    setupBfarmRs485ParCircuit();
                    break;
                case 'bfarm_rs485_weather':
                    setupBfarmRs485WeatherCircuit();
                    break;
                case 'bfarm_sht31':
                    setupBfarmSht31Circuit();
                    break;
                case 'bfarm_bh1750':
                    setupBfarmBh1750Circuit();
                    break;
                case 'bfarm_current420ma':
                    setupBfarmCurrent420maCircuit();
                    break;
                case 'bfarm_soil_moisture':
                    setupBfarmSoilMoistureCircuit();
                    break;
                case 'bfarm_relay':
                    setupBfarmRelayCircuit();
                    break;
                case 'bfarm_fertilizer_ph':
                    setupBfarmFertilizerPhCircuit();
                    break;
                case 'bfarm_ec':
                    setupBfarmEcCircuit();
                    break;
                case 'bfarm_fertilizer_temp':
                    setupBfarmFertilizerTempCircuit();
                    break;
                case 'bfarm_button':
                    setupBfarmButtonCircuit();
                    break;
            }
        }
    });
}

// language

const languageEn = document.getElementById('language-en');
const languageTh = document.getElementById('language-th');

languageEn?.addEventListener("click", () => {
    localStorage.setItem('hackCable-webExample-language', 'en_us');
    location.reload()
});
languageTh?.addEventListener("click", () => {
    console.log("Change lang to Thai")
    localStorage.setItem('hackCable-webExample-language', 'th_th');
    location.reload()
});

// Board selection
const boardSelect = document.getElementById('board-select') as HTMLSelectElement;

if (boardSelect) {
    // Load saved board selection
    const savedBoard = localStorage.getItem('hackCable-selectedBoard');
    if (savedBoard) {
        boardSelect.value = savedBoard;
    } else {
        // Set default to Handysense pro
        boardSelect.value = 'handysense-pro';
        localStorage.setItem('hackCable-selectedBoard', 'handysense-pro');
    }

    boardSelect.addEventListener('change', () => {
        const selectedBoard = boardSelect.value;
        console.log(`Board changed to: ${selectedBoard}`);

        // Save selection to localStorage
        localStorage.setItem('hackCable-selectedBoard', selectedBoard);

        // Clear existing circuit
        if (confirm('Switching boards will clear your current circuit. Continue?')) {
            hackCable.editor.canvas.clear();
            localStorage.removeItem('savedEditor');

            // Setup new board
            setTimeout(() => {
                if (selectedBoard === 'esp32') {
                    setupESP32Circuit();
                } else if (selectedBoard === 'custom-esp32') {
                    setupCustomESP32Circuit();
                } else if (selectedBoard === 'handysense-pro') {
                    setupHandysenseProCircuit();
                } else {
                    autoSetupBasicCircuit(true);
                }
            }, 100);
        } else {
            // Revert dropdown to previous value
            const currentBoard = localStorage.getItem('hackCable-selectedBoard') || 'handysense-pro';
            boardSelect.value = currentBoard;
        }
    });
}

// Auto-setup: Create ESP32 board with LED on pin 2
function setupESP32Circuit() {
    console.log("Setting up ESP32 with LED on pin D2...");

    // Create ESP32 (component id: 26)
    const esp32Figure = new ComponentFigure(wokwiComponentById[26]);
    hackCable.editor.canvas.add(esp32Figure.setX(200).setY(100));

    // Create LED (component id: 1)
    const ledFigure = new ComponentFigure(wokwiComponentById[1]);
    hackCable.editor.canvas.add(ledFigure.setX(500).setY(200));

    // Wait for components to be fully rendered before wiring
    setTimeout(() => {
        try {
            // Connect LED anode to ESP32 pin D2 (GPIO2)
            const pin2Port = esp32Figure.getPortByName("D2");
            const ledAnodePort = ledFigure.getPortByName("A");

            if (pin2Port && ledAnodePort) {
                let connection1 = new draw2d.Connection();
                connection1.setRouter(new draw2d.layout.connection.VertexRouter());
                connection1.setSource(pin2Port);
                connection1.setTarget(ledAnodePort);
                hackCable.editor.canvas.add(connection1);
                console.log("Connected D2 (GPIO2) to LED anode");
            } else {
                console.error("Could not find ports:", {
                    pin2Port: pin2Port ? "found" : "NOT FOUND",
                    ledAnodePort: ledAnodePort ? "found" : "NOT FOUND"
                });
            }

            // Connect LED cathode to ESP32 GND
            const gndPort = esp32Figure.getPortByName("GND.1");
            const ledCathodePort = ledFigure.getPortByName("C");

            if (gndPort && ledCathodePort) {
                let connection2 = new draw2d.Connection();
                connection2.setRouter(new draw2d.layout.connection.VertexRouter());
                connection2.setSource(ledCathodePort);
                connection2.setTarget(gndPort);
                hackCable.editor.canvas.add(connection2);
                console.log("Connected LED cathode to GND");
            } else {
                console.error("Could not find ports:", {
                    gndPort: gndPort ? "found" : "NOT FOUND",
                    ledCathodePort: ledCathodePort ? "found" : "NOT FOUND"
                });
            }

            console.log("ESP32 auto-setup complete!");
        } catch (error) {
            console.error("Error during ESP32 auto-wiring:", error);
        }
    }, 500);
}

// Auto-setup: Create Custom ESP32 board with LED on pin D2
function setupCustomESP32Circuit() {
    console.log("Setting up Custom ESP32 with LED on pin D2...");

    // Create Custom ESP32 (component id: 27)
    const customESP32Figure = new ComponentFigure(wokwiComponentById[27]);
    hackCable.editor.canvas.add(customESP32Figure.setX(200).setY(100));

    // Create LED (component id: 1)
    const ledFigure = new ComponentFigure(wokwiComponentById[1]);
    hackCable.editor.canvas.add(ledFigure.setX(500).setY(200));

    // Wait for components to be fully rendered before wiring
    setTimeout(() => {
        try {
            // Connect LED anode to Custom ESP32 pin D2
            const pin2Port = customESP32Figure.getPortByName("D2");
            const ledAnodePort = ledFigure.getPortByName("A");

            if (pin2Port && ledAnodePort) {
                let connection1 = new draw2d.Connection();
                connection1.setRouter(new draw2d.layout.connection.VertexRouter());
                connection1.setSource(pin2Port);
                connection1.setTarget(ledAnodePort);
                hackCable.editor.canvas.add(connection1);
                console.log("Connected D2 to LED anode");
            } else {
                console.error("Could not find ports:", {
                    pin2Port: pin2Port ? "found" : "NOT FOUND",
                    ledAnodePort: ledAnodePort ? "found" : "NOT FOUND"
                });
            }

            // Connect LED cathode to Custom ESP32 GND
            const gndPort = customESP32Figure.getPortByName("GND.1");
            const ledCathodePort = ledFigure.getPortByName("C");

            if (gndPort && ledCathodePort) {
                let connection2 = new draw2d.Connection();
                connection2.setRouter(new draw2d.layout.connection.VertexRouter());
                connection2.setSource(ledCathodePort);
                connection2.setTarget(gndPort);
                hackCable.editor.canvas.add(connection2);
                console.log("Connected LED cathode to GND");
            } else {
                console.error("Could not find ports:", {
                    gndPort: gndPort ? "found" : "NOT FOUND",
                    ledCathodePort: ledCathodePort ? "found" : "NOT FOUND"
                });
            }

            console.log("Custom ESP32 auto-setup complete!");
        } catch (error) {
            console.error("Error during Custom ESP32 auto-wiring:", error);
        }
    }, 500);
}

// Auto-setup: Create Handysense pro board with LED on pin D2
function setupHandysenseProCircuit() {
    console.log("Setting up Handysense pro with LED on pin D2...");

    // Create Handysense pro (component id: 28)
    const handysenseProFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(handysenseProFigure.setX(200).setY(100));

    // Create LED (component id: 1)
    const ledFigure = new ComponentFigure(wokwiComponentById[1]);
    hackCable.editor.canvas.add(ledFigure.setX(500).setY(200));

    // Wait for components to be fully rendered before wiring
    setTimeout(() => {
        try {
            // Connect LED anode to Handysense pro pin D2
            const pin2Port = handysenseProFigure.getPortByName("D2");
            const ledAnodePort = ledFigure.getPortByName("A");

            if (pin2Port && ledAnodePort) {
                let connection1 = new draw2d.Connection();
                connection1.setRouter(new draw2d.layout.connection.VertexRouter());
                connection1.setSource(pin2Port);
                connection1.setTarget(ledAnodePort);
                hackCable.editor.canvas.add(connection1);
                console.log("Connected D2 to LED anode");
            } else {
                console.error("Could not find ports:", {
                    pin2Port: pin2Port ? "found" : "NOT FOUND",
                    ledAnodePort: ledAnodePort ? "found" : "NOT FOUND"
                });
            }

            // Connect LED cathode to Handysense pro GND
            const gndPort = handysenseProFigure.getPortByName("GND.1");
            const ledCathodePort = ledFigure.getPortByName("C");

            if (gndPort && ledCathodePort) {
                let connection2 = new draw2d.Connection();
                connection2.setRouter(new draw2d.layout.connection.VertexRouter());
                connection2.setSource(ledCathodePort);
                connection2.setTarget(gndPort);
                hackCable.editor.canvas.add(connection2);
                console.log("Connected LED cathode to GND");
            } else {
                console.error("Could not find ports:", {
                    gndPort: gndPort ? "found" : "NOT FOUND",
                    ledCathodePort: ledCathodePort ? "found" : "NOT FOUND"
                });
            }

            console.log("Handysense pro auto-setup complete!");
        } catch (error) {
            console.error("Error during Handysense pro auto-wiring:", error);
        }
    }, 500);
}

// ============================================
// Helper function for connecting ports
// ============================================
function connectPorts(
    sourceFigure: ComponentFigure,
    sourcePortName: string,
    targetFigure: ComponentFigure,
    targetPortName: string
) {
    const sourcePort = sourceFigure.getPortByName(sourcePortName);
    const targetPort = targetFigure.getPortByName(targetPortName);

    if (sourcePort && targetPort) {
        let connection = new draw2d.Connection();
        connection.setRouter(new draw2d.layout.connection.ManhattanConnectionRouter());
        connection.setSource(sourcePort);
        connection.setTarget(targetPort);
        connection.installEditPolicy(new DisconnectableConnectionPolicy());
        hackCable.editor.canvas.add(connection);
        console.log(`Connected ${sourcePortName} to ${targetPortName}`);
    } else {
        console.error(`Could not find ports: ${sourcePortName} or ${targetPortName}`);
    }
}

// ============================================
// Handysense Pro Smart Farm Circuit Setup Functions
// ============================================

// Example 1: pH Misting Control Circuit Setup (1 sensor + 1 actuator)
function setupPhMistingCircuit() {
    console.log("Setting up pH Misting Control circuit...");
    hackCable.editor.canvas.clear();

    // Create Handysense Pro board (component id: 28)
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(200).setY(50));

    // Create pH Sensor (component id: 29)
    const phSensorFigure = new ComponentFigure(wokwiComponentById[29]);
    hackCable.editor.canvas.add(phSensorFigure.setX(50).setY(120));

    // Create Misting Pump (component id: 31)
    const mistPumpFigure = new ComponentFigure(wokwiComponentById[31]);
    hackCable.editor.canvas.add(mistPumpFigure.setX(500).setY(120));

    setTimeout(() => {
        try {
            // Connect pH Sensor
            connectPorts(phSensorFigure, "VCC", boardFigure, "3V3_2");
            connectPorts(phSensorFigure, "GND", boardFigure, "GND_2");
            connectPorts(phSensorFigure, "AO", boardFigure, "IO36");

            // Connect Misting Pump
            connectPorts(mistPumpFigure, "VCC", boardFigure, "VIN_1");
            connectPorts(mistPumpFigure, "GND", boardFigure, "GND_5");
            connectPorts(mistPumpFigure, "SIG", boardFigure, "IO25");

            console.log("pH Misting Control circuit setup complete!");
        } catch (error) {
            console.error("Error during wiring:", error);
        }
    }, 500);
}

// Example 2: Humidity Fan Control Circuit Setup (1 sensor + 1 actuator)
function setupHumidityFanCircuit() {
    console.log("Setting up Humidity Fan Control circuit...");
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(200).setY(50));

    const humiditySensorFigure = new ComponentFigure(wokwiComponentById[30]);
    hackCable.editor.canvas.add(humiditySensorFigure.setX(50).setY(120));

    const fanFigure = new ComponentFigure(wokwiComponentById[33]);
    hackCable.editor.canvas.add(fanFigure.setX(500).setY(120));

    setTimeout(() => {
        try {
            // Connect Humidity Sensor
            connectPorts(humiditySensorFigure, "VCC", boardFigure, "3V3_3");
            connectPorts(humiditySensorFigure, "GND", boardFigure, "GND_3");
            connectPorts(humiditySensorFigure, "OUT", boardFigure, "IO39");

            // Connect Fan
            connectPorts(fanFigure, "VCC", boardFigure, "VIN_2");
            connectPorts(fanFigure, "GND", boardFigure, "GND_6");
            connectPorts(fanFigure, "SIG", boardFigure, "IO4");

            console.log("Humidity Fan Control circuit setup complete!");
        } catch (error) {
            console.error("Error during wiring:", error);
        }
    }, 500);
}

// Example 3: pH Full Control Circuit Setup (1 sensor + 2 actuators)
function setupPhFullControlCircuit() {
    console.log("Setting up pH Full Control circuit...");
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(250).setY(50));

    const phSensorFigure = new ComponentFigure(wokwiComponentById[29]);
    hackCable.editor.canvas.add(phSensorFigure.setX(50).setY(100));

    const mistPumpFigure = new ComponentFigure(wokwiComponentById[31]);
    hackCable.editor.canvas.add(mistPumpFigure.setX(550).setY(80));

    const fanFigure = new ComponentFigure(wokwiComponentById[33]);
    hackCable.editor.canvas.add(fanFigure.setX(550).setY(180));

    setTimeout(() => {
        try {
            // pH Sensor connections
            connectPorts(phSensorFigure, "VCC", boardFigure, "3V3_2");
            connectPorts(phSensorFigure, "GND", boardFigure, "GND_2");
            connectPorts(phSensorFigure, "AO", boardFigure, "IO36");

            // Misting Pump
            connectPorts(mistPumpFigure, "VCC", boardFigure, "VIN_1");
            connectPorts(mistPumpFigure, "GND", boardFigure, "GND_5");
            connectPorts(mistPumpFigure, "SIG", boardFigure, "IO25");

            // Fan
            connectPorts(fanFigure, "VCC", boardFigure, "VIN_2");
            connectPorts(fanFigure, "GND", boardFigure, "GND_6");
            connectPorts(fanFigure, "SIG", boardFigure, "IO4");

            console.log("pH Full Control circuit setup complete!");
        } catch (error) {
            console.error("Error during wiring:", error);
        }
    }, 500);
}

// Example 4: Humidity Climate Control Circuit Setup (1 sensor + 2 actuators)
function setupHumidityClimateControlCircuit() {
    console.log("Setting up Humidity Climate Control circuit...");
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(250).setY(50));

    const humiditySensorFigure = new ComponentFigure(wokwiComponentById[30]);
    hackCable.editor.canvas.add(humiditySensorFigure.setX(50).setY(100));

    const mistPumpFigure = new ComponentFigure(wokwiComponentById[31]);
    hackCable.editor.canvas.add(mistPumpFigure.setX(550).setY(80));

    const fanFigure = new ComponentFigure(wokwiComponentById[33]);
    hackCable.editor.canvas.add(fanFigure.setX(550).setY(180));

    setTimeout(() => {
        try {
            // Humidity Sensor connections
            connectPorts(humiditySensorFigure, "VCC", boardFigure, "3V3_3");
            connectPorts(humiditySensorFigure, "GND", boardFigure, "GND_3");
            connectPorts(humiditySensorFigure, "OUT", boardFigure, "IO39");

            // Misting Pump
            connectPorts(mistPumpFigure, "VCC", boardFigure, "VIN_1");
            connectPorts(mistPumpFigure, "GND", boardFigure, "GND_5");
            connectPorts(mistPumpFigure, "SIG", boardFigure, "IO25");

            // Fan
            connectPorts(fanFigure, "VCC", boardFigure, "VIN_2");
            connectPorts(fanFigure, "GND", boardFigure, "GND_6");
            connectPorts(fanFigure, "SIG", boardFigure, "IO4");

            console.log("Humidity Climate Control circuit setup complete!");
        } catch (error) {
            console.error("Error during wiring:", error);
        }
    }, 500);
}

// Example 5: Dual Sensor Misting Circuit Setup (2 sensors + 1 actuator)
function setupDualSensorMistingCircuit() {
    console.log("Setting up Dual Sensor Misting circuit...");
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(280).setY(50));

    const phSensorFigure = new ComponentFigure(wokwiComponentById[29]);
    hackCable.editor.canvas.add(phSensorFigure.setX(50).setY(80));

    const humiditySensorFigure = new ComponentFigure(wokwiComponentById[30]);
    hackCable.editor.canvas.add(humiditySensorFigure.setX(50).setY(200));

    const mistPumpFigure = new ComponentFigure(wokwiComponentById[31]);
    hackCable.editor.canvas.add(mistPumpFigure.setX(580).setY(130));

    setTimeout(() => {
        try {
            // pH Sensor connections
            connectPorts(phSensorFigure, "VCC", boardFigure, "3V3_2");
            connectPorts(phSensorFigure, "GND", boardFigure, "GND_2");
            connectPorts(phSensorFigure, "AO", boardFigure, "IO36");

            // Humidity Sensor connections
            connectPorts(humiditySensorFigure, "VCC", boardFigure, "3V3_3");
            connectPorts(humiditySensorFigure, "GND", boardFigure, "GND_3");
            connectPorts(humiditySensorFigure, "OUT", boardFigure, "IO39");

            // Misting Pump
            connectPorts(mistPumpFigure, "VCC", boardFigure, "VIN_1");
            connectPorts(mistPumpFigure, "GND", boardFigure, "GND_5");
            connectPorts(mistPumpFigure, "SIG", boardFigure, "IO25");

            console.log("Dual Sensor Misting circuit setup complete!");
        } catch (error) {
            console.error("Error during wiring:", error);
        }
    }, 500);
}

// Example 6: Dual Sensor Fan Control Circuit Setup (2 sensors + 1 actuator)
function setupDualSensorFanCircuit() {
    console.log("Setting up Dual Sensor Fan Control circuit...");
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(280).setY(50));

    const phSensorFigure = new ComponentFigure(wokwiComponentById[29]);
    hackCable.editor.canvas.add(phSensorFigure.setX(50).setY(80));

    const humiditySensorFigure = new ComponentFigure(wokwiComponentById[30]);
    hackCable.editor.canvas.add(humiditySensorFigure.setX(50).setY(200));

    const fanFigure = new ComponentFigure(wokwiComponentById[33]);
    hackCable.editor.canvas.add(fanFigure.setX(580).setY(130));

    setTimeout(() => {
        try {
            // pH Sensor connections
            connectPorts(phSensorFigure, "VCC", boardFigure, "3V3_2");
            connectPorts(phSensorFigure, "GND", boardFigure, "GND_2");
            connectPorts(phSensorFigure, "AO", boardFigure, "IO36");

            // Humidity Sensor connections
            connectPorts(humiditySensorFigure, "VCC", boardFigure, "3V3_3");
            connectPorts(humiditySensorFigure, "GND", boardFigure, "GND_3");
            connectPorts(humiditySensorFigure, "OUT", boardFigure, "IO39");

            // Fan
            connectPorts(fanFigure, "VCC", boardFigure, "VIN_2");
            connectPorts(fanFigure, "GND", boardFigure, "GND_6");
            connectPorts(fanFigure, "SIG", boardFigure, "IO4");

            console.log("Dual Sensor Fan Control circuit setup complete!");
        } catch (error) {
            console.error("Error during wiring:", error);
        }
    }, 500);
}

// Example 7: Relay Sequential Blink Circuit Setup (4 relay modules)
function setupRelayBlinkCircuit() {
    console.log("Setting up Relay Sequential Blink circuit...");
    hackCable.editor.canvas.clear();

    // HandySense Pro board (id: 28)
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(250).setY(50));

    // 4 Relay elements (id: 34) positioned around the board
    const relay1Figure = new ComponentFigure(wokwiComponentById[34]);
    hackCable.editor.canvas.add(relay1Figure.setX(20).setY(60));

    const relay2Figure = new ComponentFigure(wokwiComponentById[34]);
    hackCable.editor.canvas.add(relay2Figure.setX(20).setY(160));

    const relay3Figure = new ComponentFigure(wokwiComponentById[34]);
    hackCable.editor.canvas.add(relay3Figure.setX(560).setY(60));

    const relay4Figure = new ComponentFigure(wokwiComponentById[34]);
    hackCable.editor.canvas.add(relay4Figure.setX(560).setY(160));

    setTimeout(() => {
        try {
            // Relay 1 - IO25 (R1)
            connectPorts(relay1Figure, "VCC", boardFigure, "VIN_1");
            connectPorts(relay1Figure, "GND", boardFigure, "GND_5");
            connectPorts(relay1Figure, "IN", boardFigure, "IO25");

            // Relay 2 - IO4 (R2)
            connectPorts(relay2Figure, "VCC", boardFigure, "VIN_2");
            connectPorts(relay2Figure, "GND", boardFigure, "GND_6");
            connectPorts(relay2Figure, "IN", boardFigure, "IO4");

            // Relay 3 - IO12 (R3)
            connectPorts(relay3Figure, "VCC", boardFigure, "3V3_R1");
            connectPorts(relay3Figure, "GND", boardFigure, "GND_R1");
            connectPorts(relay3Figure, "IN", boardFigure, "IO12");

            // Relay 4 - IO13 (R4)
            connectPorts(relay4Figure, "VCC", boardFigure, "3V3_R2");
            connectPorts(relay4Figure, "GND", boardFigure, "GND_R2");
            connectPorts(relay4Figure, "IN", boardFigure, "IO13");

            console.log("Relay Sequential Blink circuit setup complete!");
        } catch (error) {
            console.error("Error during wiring:", error);
        }
    }, 500);
}

// Example 8: MCP23008 Blink - board + LED on IO25 (MCP pin 0)
function setupMcpSmartControlCircuit() {
    console.log("Setting up MCP23008 Blink circuit...");
    hackCable.editor.canvas.clear();

    // HandySense Pro board (id: 28)
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(250).setY(50));

    // LED on IO25 (MCP pin 0)
    const ledFigure = new ComponentFigure(wokwiComponentById[1]);
    hackCable.editor.canvas.add(ledFigure.setX(20).setY(60));

    setTimeout(() => {
        try {
            connectPorts(ledFigure, "A", boardFigure, "IO25");
            connectPorts(ledFigure, "C", boardFigure, "GND_5");

            console.log("MCP23008 Blink circuit setup complete!");
        } catch (error) {
            console.error("Error during wiring:", error);
        }
    }, 500);
}

// ============================================
// BFarm Field Sensor Circuit Setup Functions
// ============================================

// Helper: create HandysensePro board (ID 28) at center, sensor at right
function setupBfarmRs485Sensor(sensorId: number, label: string) {
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(150).setY(50));
    const sensorFigure = new ComponentFigure(wokwiComponentById[sensorId]);
    hackCable.editor.canvas.add(sensorFigure.setX(470).setY(90));
    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, '3V3_R3');
            connectPorts(sensorFigure, 'GND', boardFigure, 'GND_R3');
            connectPorts(sensorFigure, 'A+',  boardFigure, 'TX2');
            connectPorts(sensorFigure, 'B-',  boardFigure, 'RX2');
            console.log(`${label} circuit setup complete!`);
        } catch (error) {
            console.error(`Error during ${label} wiring:`, error);
        }
    }, 500);
}

// BFarm 1: RS485 pH Sensor (ID 35)
function setupBfarmRs485PhCircuit() {
    setupBfarmRs485Sensor(35, 'RS485 pH Sensor');
}

// BFarm 2: RS485 Light Sensor (ID 36)
function setupBfarmRs485LightCircuit() {
    setupBfarmRs485Sensor(36, 'RS485 Light Sensor');
}

// BFarm 3: RS485 Rain Sensor (ID 37)
function setupBfarmRs485RainCircuit() {
    setupBfarmRs485Sensor(37, 'RS485 Rain Sensor');
}

// BFarm 4: RS485 Wind Speed Sensor (ID 38)
function setupBfarmRs485WindCircuit() {
    setupBfarmRs485Sensor(38, 'RS485 Wind Speed Sensor');
}

// BFarm 5: RS485 PAR Sensor (ID 39)
function setupBfarmRs485ParCircuit() {
    setupBfarmRs485Sensor(39, 'RS485 PAR Sensor');
}

// BFarm 6: Weather Sensor HTCo2PLx (ID 40)
function setupBfarmRs485WeatherCircuit() {
    setupBfarmRs485Sensor(40, 'Weather Sensor HTCo2PLx');
}

// BFarm 7: SHT31 I2C Sensor (ID 41)
function setupBfarmSht31Circuit() {
    console.log("Setting up SHT31 I2C circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(150).setY(50));
    const sensorFigure = new ComponentFigure(wokwiComponentById[41]);
    hackCable.editor.canvas.add(sensorFigure.setX(470).setY(90));
    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, '3V3_R1');
            connectPorts(sensorFigure, 'GND', boardFigure, 'GND_R1');
            connectPorts(sensorFigure, 'SDA', boardFigure, 'SDA_1');
            connectPorts(sensorFigure, 'SCL', boardFigure, 'SCL_1');
            console.log("SHT31 circuit setup complete!");
        } catch (error) {
            console.error("Error during SHT31 wiring:", error);
        }
    }, 500);
}

// BFarm 8: BH1750 I2C Light Sensor (ID 42)
function setupBfarmBh1750Circuit() {
    console.log("Setting up BH1750 I2C circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(150).setY(50));
    const sensorFigure = new ComponentFigure(wokwiComponentById[42]);
    hackCable.editor.canvas.add(sensorFigure.setX(470).setY(90));
    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, '3V3_R1');
            connectPorts(sensorFigure, 'GND', boardFigure, 'GND_R1');
            connectPorts(sensorFigure, 'SDA', boardFigure, 'SDA_1');
            connectPorts(sensorFigure, 'SCL', boardFigure, 'SCL_1');
            console.log("BH1750 circuit setup complete!");
        } catch (error) {
            console.error("Error during BH1750 wiring:", error);
        }
    }, 500);
}

// BFarm 9: 4-20mA Current Loop / MCP3424 I2C ADC (ID 43)
function setupBfarmCurrent420maCircuit() {
    console.log("Setting up 4-20mA Current Loop circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(150).setY(50));
    const sensorFigure = new ComponentFigure(wokwiComponentById[43]);
    hackCable.editor.canvas.add(sensorFigure.setX(470).setY(90));
    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, '3V3_R2');
            connectPorts(sensorFigure, 'GND', boardFigure, 'GND_R2');
            connectPorts(sensorFigure, 'SDA', boardFigure, 'SDA_2');
            connectPorts(sensorFigure, 'SCL', boardFigure, 'SCL_2');
            console.log("4-20mA Current Loop circuit setup complete!");
        } catch (error) {
            console.error("Error during 4-20mA wiring:", error);
        }
    }, 500);
}

// BFarm 10: Soil Moisture Sensor (ID 44)
function setupBfarmSoilMoistureCircuit() {
    console.log("Setting up Soil Moisture Sensor circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(200).setY(50));
    const sensorFigure = new ComponentFigure(wokwiComponentById[44]);
    hackCable.editor.canvas.add(sensorFigure.setX(50).setY(80));
    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, '3V3_2');
            connectPorts(sensorFigure, 'GND', boardFigure, 'GND_2');
            connectPorts(sensorFigure, 'AO',  boardFigure, 'IO36');
            console.log("Soil Moisture circuit setup complete!");
        } catch (error) {
            console.error("Error during Soil Moisture wiring:", error);
        }
    }, 500);
}

// BFarm 11: Four Channel Relay (ID 45)
function setupBfarmRelayCircuit() {
    console.log("Setting up 4-Channel Relay circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(200).setY(50));
    const relayFigure = new ComponentFigure(wokwiComponentById[45]);
    hackCable.editor.canvas.add(relayFigure.setX(500).setY(80));
    setTimeout(() => {
        try {
            connectPorts(relayFigure, 'VCC', boardFigure, 'VIN_1');
            connectPorts(relayFigure, 'GND', boardFigure, 'GND_5');
            connectPorts(relayFigure, 'IN1', boardFigure, 'IO25');
            connectPorts(relayFigure, 'IN2', boardFigure, 'IO4');
            connectPorts(relayFigure, 'IN3', boardFigure, 'IO12');
            connectPorts(relayFigure, 'IN4', boardFigure, 'IO13');
            console.log("4-Channel Relay circuit setup complete!");
        } catch (error) {
            console.error("Error during Relay wiring:", error);
        }
    }, 500);
}

// BFarm 12: Fertilizer pH Sensor (ID 46)
function setupBfarmFertilizerPhCircuit() {
    setupBfarmRs485Sensor(46, 'Fertilizer pH Sensor');
}

// BFarm 13: EC Sensor (ID 47)
function setupBfarmEcCircuit() {
    setupBfarmRs485Sensor(47, 'EC Sensor');
}

// BFarm 14: Fertilizer Temp Sensor (ID 48)
function setupBfarmFertilizerTempCircuit() {
    setupBfarmRs485Sensor(48, 'Fertilizer Temp Sensor');
}

// BFarm 15: Four Channel Button (ID 49)
function setupBfarmButtonCircuit() {
    console.log("Setting up 4-Channel Button circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(200).setY(50));
    const buttonFigure = new ComponentFigure(wokwiComponentById[49]);
    hackCable.editor.canvas.add(buttonFigure.setX(50).setY(80));
    setTimeout(() => {
        try {
            connectPorts(buttonFigure, 'VCC', boardFigure, '3V3_4');
            connectPorts(buttonFigure, 'GND', boardFigure, 'GND_4');
            connectPorts(buttonFigure, 'B1',  boardFigure, 'IO32');
            connectPorts(buttonFigure, 'B2',  boardFigure, 'IO33');
            connectPorts(buttonFigure, 'B3',  boardFigure, 'IO15');
            connectPorts(buttonFigure, 'B4',  boardFigure, 'IO39');
            console.log("4-Channel Button circuit setup complete!");
        } catch (error) {
            console.error("Error during Button wiring:", error);
        }
    }, 500);
}

// postMessage listener: receive code from BFarm and handle shell resize
window.addEventListener('message', (e: MessageEvent) => {
    if (!e.data) return;
    if (e.data.source === 'bfarm' && e.data.type === 'code-sync' && typeof e.data.code === 'string') {
        if (codeInput instanceof HTMLTextAreaElement) {
            codeInput.value = e.data.code;
            localStorage.setItem('hackCable-webExample-inputCode', e.data.code);
            showStatus('ui.status.codeReceived', 'success');
        }
    }
    if (e.data.source === 'bfarm' && e.data.type === 'add-component' && typeof e.data.componentId === 'number') {
        const info = wokwiComponentById[e.data.componentId];
        if (info) {
            const figure = new ComponentFigure(info);
            hackCable.editor.canvas.add(figure.setX(300).setY(200));
        }
    }
    if (e.data.source === 'shell' && e.data.type === 'resize') {
        window.dispatchEvent(new Event('resize'));
    }
});

// Transfer code to Blocks page
const transferToBlocksBtn = document.getElementById('transfer-to-blocks');
const autoSyncBlocksCheckbox = document.getElementById('auto-sync-blocks') as HTMLInputElement | null;

function transferToBlocks() {
    if (codeInput instanceof HTMLTextAreaElement) {
        window.parent.postMessage({ source: 'hackcable', type: 'code-sync', code: codeInput.value }, '*');
    }
}

transferToBlocksBtn?.addEventListener('click', transferToBlocks);

let autoSyncBlocksHandler: (() => void) | null = null;
autoSyncBlocksCheckbox?.addEventListener('change', () => {
    if (autoSyncBlocksCheckbox.checked) {
        autoSyncBlocksHandler = () => transferToBlocks();
        codeInput?.addEventListener('input', autoSyncBlocksHandler);
    } else if (autoSyncBlocksHandler) {
        codeInput?.removeEventListener('input', autoSyncBlocksHandler);
        autoSyncBlocksHandler = null;
    }
});


