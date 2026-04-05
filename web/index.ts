import "./css/main.styl"
import {CompileResult, EmulatorManager, HackCable} from "../src/main";
import {wokwiComponentById, wokwiComponentByClass, ComponentType} from "../src/panels/component";
import {ComponentFigure} from "../src/editor/component-figure";
import * as draw2d from "draw2d";
import {DisconnectableConnectionPolicy} from "../src/editor/connections-policies";
import { ClangWasmRunner } from './clang-runner';
import { ArduinoWasmShim } from './arduino-wasm-shim';
import { getArduinoHeaders } from './arduino-headers';
import { convertBfarmMacroToCpp, hasBfarmMacroMarkers } from './bfarm-macro-converter';

console.log("Running HackCable web interface")

const mountingDiv = document.getElementById('hackCable');
if(!mountingDiv) throw new DOMException("Mounting div not found")

const lang = localStorage.getItem('hackCable-webExample-language');
let hackCable = new HackCable(mountingDiv, lang ? lang : 'en_us');

// Emscripten WASM state
let activeWasmModule: any = null;
let activeWasmScript: HTMLScriptElement | null = null;
let lastEmscriptenResult: { js: string; wasm: string } | null = null;
let emscriptenAvailable = false;

// Clang/LLVM WASM state
const clangRunner = new ClangWasmRunner();
let lastClangResult: Uint8Array | null = null;
let activeClangLoopHandle: ReturnType<typeof setInterval> | null = null;

// Native Clang WASM state
let lastClangNativeResult: Uint8Array | null = null;
let activeClangNativeLoopHandle: ReturnType<typeof setInterval> | null = null;
let clangNativeAvailable = false;

async function checkEmscriptenStatus(retries = 5, delayMs = 1000) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const res = await fetch('/api/compile/emscripten/status');
            if (res.ok) {
                const data = await res.json();
                emscriptenAvailable = data.available === true;
                updateEmscriptenOption();
                return;
            }
        } catch {
            // network error (backend not ready yet) — will retry
        }
        if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
    emscriptenAvailable = false;
    updateEmscriptenOption();
}

function updateEmscriptenOption() {
    if (!compilerModeSelect) return;
    const opt = compilerModeSelect.querySelector('option[value="emscripten"]') as HTMLOptionElement;
    if (!opt) return;
    if (emscriptenAvailable) {
        opt.textContent = 'Emscripten C++ - Native';
        opt.disabled = false;
    } else {
        opt.textContent = 'Emscripten C++ (unavailable)';
        opt.disabled = true;
        if (compilerModeSelect.value === 'emscripten') {
            compilerModeSelect.value = 'micropython';
        }
    }
}

async function checkClangNativeStatus(retries = 5, delayMs = 1000) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const res = await fetch('/api/compile/clang/status');
            if (res.ok) {
                const data = await res.json();
                clangNativeAvailable = data.available === true;
                updateClangNativeOption();
                return;
            }
        } catch {
            // network error — will retry
        }
        if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
    clangNativeAvailable = false;
    updateClangNativeOption();
}

function updateClangNativeOption() {
    if (!compilerModeSelect) return;
    const opt = compilerModeSelect.querySelector('option[value="clang-native"]') as HTMLOptionElement;
    if (!opt) return;
    if (clangNativeAvailable) {
        opt.textContent = 'Native Clang WASM';
        opt.disabled = false;
    } else {
        opt.textContent = 'Native Clang WASM (unavailable)';
        opt.disabled = true;
        if (compilerModeSelect.value === 'clang-native') {
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
            setupNewBfarmSmartGreenhouseCircuit();
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
        examplesSelect.value = 'new_bfarm_smart_greenhouse';
    }
    setTimeout(() => {
        if (codeInput instanceof HTMLTextAreaElement && !codeInput.value.trim()) {
            codeInput.value = preprocessExampleCode(
                'new_bfarm_smart_greenhouse',
                codeExamples['new_bfarm_smart_greenhouse']
            );
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
checkClangNativeStatus();

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
            // --- EMSCRIPTEN PATH ---
            hexInput.value = '// Emscripten C++ compilation in progress...';
            fetch('/api/compile/emscripten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeInput.value })
            }).then(async res => {
                const data = await res.json();
                if (data.code === 'EMSCRIPTEN_NOT_FOUND' || data.code === 'BACKEND_UNAVAILABLE') {
                    // Emscripten unavailable — fall back to MicroPython
                    hexInput.value = '// Emscripten unavailable, using MicroPython fallback...';
                    showStatus('ui.status.emscriptenFallback', 'info');
                    emscriptenAvailable = false;
                    updateEmscriptenOption();
                    hackCable.emulatorManager.compileAndLoadCode(codeInput.value).then(() => {});
                    showStatus('ui.status.compileComplete', 'success');
                    return;
                }
                if (data.error) {
                    hexInput.value = '// Compilation error:\n' + data.error;
                    if (data.stderr) hexInput.value += '\n' + data.stderr;
                    showStatus('ui.status.compileFailed', 'error');
                    return;
                }
                lastEmscriptenResult = { js: data.js, wasm: data.wasm };
                hexInput.value = '// Emscripten compilation OK. Click Execute.';
                showStatus('ui.status.compileComplete', 'success');
            }).catch(() => {
                // Network error (backend not running) — fall back to MicroPython
                hexInput.value = '// Backend unreachable, using MicroPython fallback...';
                showStatus('ui.status.emscriptenFallback', 'info');
                emscriptenAvailable = false;
                updateEmscriptenOption();
                hackCable.emulatorManager.compileAndLoadCode(codeInput.value).then(() => {});
                showStatus('ui.status.compileComplete', 'success');
            });

        } else if (boardType === 'esp32' && mode === 'clang-native') {
            // --- NATIVE CLANG SERVER-SIDE PATH ---
            hexInput.value = '// Compiling with Native Clang (server-side)...';
            fetch('/api/compile/clang', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeInput.value })
            }).then(async res => {
                const data = await res.json();
                if (data.code === 'CLANG_NOT_FOUND') {
                    hexInput.value = '// Native Clang unavailable.';
                    clangNativeAvailable = false;
                    updateClangNativeOption();
                    showStatus('ui.status.compileFailed', 'error');
                    return;
                }
                if (data.error) {
                    hexInput.value = '// Compilation error:\n' + data.error;
                    if (data.stderr) hexInput.value += '\n' + data.stderr;
                    showStatus('ui.status.compileFailed', 'error');
                    return;
                }
                const wasmBytes = await fetch(`data:application/octet-stream;base64,${data.wasm}`)
                    .then(r => r.arrayBuffer())
                    .then(b => new Uint8Array(b));
                lastClangNativeResult = wasmBytes;
                hexInput.value = '// Native Clang compilation OK. Click Execute.';
                showStatus('ui.status.compileComplete', 'success');
            }).catch(() => {
                hexInput.value = '// Backend unreachable.';
                showStatus('ui.status.compileFailed', 'error');
            });

        } else if (boardType === 'esp32' && mode === 'clang-llvm') {
            // --- CLANG/LLVM IN-BROWSER PATH ---
            hexInput.value = '// Loading Clang/LLVM (~35 MB first use)...';
            clangRunner.load((loaded, total, label) => {
                if (total > 0) {
                    const pct = Math.round(loaded / total * 100);
                    hexInput.value = `// Downloading ${label}: ${pct}%`;
                }
            }).then(() => {
                hexInput.value = '// Compiling with Clang/LLVM...';
                return clangRunner.compile(codeInput.value, getArduinoHeaders());
            }).then(result => {
                if (result.stderr) console.warn('[clang]', result.stderr);
                lastClangResult = result.wasmBytes;
                hexInput.value = '// Clang/LLVM compilation OK. Click Execute.';
                showStatus('ui.status.compileComplete', 'success');
            }).catch(err => {
                hexInput.value = '// Clang/LLVM error:\n' + err.message;
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

        } else if (boardType === 'esp32' && mode === 'clang-native') {
            // --- NATIVE CLANG EXECUTE ---
            if (!lastClangNativeResult) {
                appendSerial('Error: No compiled WASM. Click Compile first.\n');
                showStatus('ui.status.compileFailed', 'error');
                return;
            }
            cleanupWasmInstance();
            const shimNative = new ArduinoWasmShim(
                (pin, value) => hackCable.esp32PinUpdate(pin, value),
                (text) => appendSerial(text),
                (_slaveId, _reg) => 0,
                () => 0,
                () => 0,
                () => 0,
            );
            WebAssembly.instantiate(lastClangNativeResult, shimNative.buildImports())
                .then(({ instance }) => {
                    const exp = instance.exports as any;
                    if (exp.memory) shimNative.setWasmMemory(exp.memory);
                    if (typeof exp.sim_run_setup === 'function') exp.sim_run_setup();
                    if (typeof exp.sim_run_loop === 'function') {
                        activeClangNativeLoopHandle = setInterval(() => {
                            try { exp.sim_run_loop(); } catch (e) {
                                clearInterval(activeClangNativeLoopHandle!);
                                activeClangNativeLoopHandle = null;
                                appendSerial('Runtime error: ' + (e as Error).message + '\n');
                            }
                        }, 16);
                    }
                    autoActivateSensorsFromCode(codeInput.value);
                    showStatus('ui.status.executing', 'info');
                })
                .catch(err => {
                    appendSerial('WASM load error: ' + err.message + '\n');
                    showStatus('ui.status.compileFailed', 'error');
                });

        } else if (boardType === 'esp32' && mode === 'clang-llvm') {
            // --- CLANG/LLVM EXECUTE ---
            if (!lastClangResult) {
                appendSerial('Error: No compiled WASM. Click Compile first.\n');
                showStatus('ui.status.compileFailed', 'error');
                return;
            }
            cleanupWasmInstance();
            const shim = new ArduinoWasmShim(
                (pin, value) => hackCable.esp32PinUpdate(pin, value),
                (text) => appendSerial(text),
                (_slaveId, _reg) => 0,
                () => 0,
                () => 0,
                () => 0,
            );
            WebAssembly.instantiate(lastClangResult, shim.buildImports())
                .then(({ instance }) => {
                    const exp = instance.exports as any;
                    if (exp.memory) shim.setWasmMemory(exp.memory);
                    if (typeof exp.setup === 'function') exp.setup();
                    if (typeof exp.loop === 'function') {
                        activeClangLoopHandle = setInterval(() => {
                            try { exp.loop(); } catch (e) {
                                clearInterval(activeClangLoopHandle!);
                                activeClangLoopHandle = null;
                                appendSerial('Runtime error: ' + (e as Error).message + '\n');
                            }
                        }, 16);
                    }
                    autoActivateSensorsFromCode(codeInput.value);
                    showStatus('ui.status.executing', 'info');
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
    if (tabName === 'io') resizePlotterCanvas();
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

// ── Serial Plotter ──────────────────────────────────────────────
const PLOTTER_MAX_POINTS = 100;
const PLOTTER_COLORS = ['#00ff00', '#ff6b6b', '#61dafb', '#ffd700', '#ff9f43', '#a29bfe'];

interface PlotterSeries { label: string; data: number[]; }
let plotterSeries: PlotterSeries[] = [];
let serialLineBuffer = '';

function parsePlotterLine(line: string): { label: string; value: number }[] | null {
    const labelPairs = [...line.matchAll(/(\w+)\s*[=:]\s*([+-]?\d+\.?\d*)/g)];
    if (labelPairs.length > 0)
        return labelPairs.map(m => ({ label: m[1], value: parseFloat(m[2]) }));
    const nums = line.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && line.trim() !== '');
    if (nums.length > 0)
        return nums.map((v, i) => ({ label: String(i + 1), value: v }));
    return null;
}

function pushPlotterData(parsed: { label: string; value: number }[]) {
    parsed.forEach(({ label, value }, i) => {
        if (!plotterSeries[i]) plotterSeries[i] = { label, data: [] };
        plotterSeries[i].label = label;
        plotterSeries[i].data.push(value);
        if (plotterSeries[i].data.length > PLOTTER_MAX_POINTS)
            plotterSeries[i].data.shift();
    });
    plotterSeries.length = parsed.length;
    drawPlotter();
}

function drawPlotter() {
    const canvas = document.getElementById('serial-plotter-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);

    if (plotterSeries.length === 0 || plotterSeries.every(s => s.data.length === 0)) {
        ctx.fillStyle = '#555';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for numeric data...', W / 2, H / 2);
        return;
    }

    let minVal = Infinity, maxVal = -Infinity;
    for (const s of plotterSeries)
        for (const v of s.data) { if (v < minVal) minVal = v; if (v > maxVal) maxVal = v; }
    if (minVal === maxVal) { minVal -= 1; maxVal += 1; }

    const pad = { top: 8, bottom: 20, left: 36, right: 4 };
    const gW = W - pad.left - pad.right;
    const gH = H - pad.top - pad.bottom;

    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = pad.top + (gH * i / 4);
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
        const val = maxVal - ((maxVal - minVal) * i / 4);
        ctx.fillStyle = '#555';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(val.toFixed(1), pad.left - 3, y + 3);
    }

    plotterSeries.forEach((series, si) => {
        if (series.data.length < 2) return;
        ctx.strokeStyle = PLOTTER_COLORS[si % PLOTTER_COLORS.length];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        series.data.forEach((v, idx) => {
            const x = pad.left + (idx / (PLOTTER_MAX_POINTS - 1)) * gW;
            const y = pad.top + gH - ((v - minVal) / (maxVal - minVal)) * gH;
            idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.fillStyle = PLOTTER_COLORS[si % PLOTTER_COLORS.length];
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(series.label, pad.left + si * 50, H - 6);
    });
}

function clearPlotter() {
    plotterSeries = [];
    serialLineBuffer = '';
    drawPlotter();
}

function feedPlotter(data: string) {
    serialLineBuffer += data;
    let nl: number;
    while ((nl = serialLineBuffer.indexOf('\n')) !== -1) {
        const line = serialLineBuffer.slice(0, nl);
        serialLineBuffer = serialLineBuffer.slice(nl + 1);
        const parsed = parsePlotterLine(line);
        if (parsed) pushPlotterData(parsed);
    }
}

function resizePlotterCanvas() {
    const canvas = document.getElementById('serial-plotter-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawPlotter();
}
window.addEventListener('resize', resizePlotterCanvas);
setTimeout(resizePlotterCanvas, 100);

hackCable.serialDataCallback = (data: string) => { appendSerial(data); feedPlotter(data); };
document.getElementById('serial-clear')?.addEventListener('click', clearSerial);
document.getElementById('serial-plotter-clear')?.addEventListener('click', clearPlotter);

const simHttpPathInput = document.getElementById('sim-http-path') as HTMLInputElement | null;
const simHttpSendBtn = document.getElementById('sim-http-send') as HTMLButtonElement | null;
const simHttpResponseEl = document.getElementById('sim-http-response') as HTMLElement | null;

function renderSimulatedHttpResponse(text: string) {
    if (simHttpResponseEl) simHttpResponseEl.textContent = text;
}

async function runSimulatedHttpGet(path: string) {
    const rawPath = (path || '').trim() || '/';
    renderSimulatedHttpResponse(`GET ${rawPath}\n(waiting...)`);
    const response = await hackCable.simulatedHttpGet(rawPath);
    renderSimulatedHttpResponse(
        `GET ${rawPath}\nstatus: ${response.status}\ncontent-type: ${response.contentType}\n\n${response.body}`
    );
    return response;
}

simHttpSendBtn?.addEventListener('click', async () => {
    try {
        await runSimulatedHttpGet(simHttpPathInput?.value || '/');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        renderSimulatedHttpResponse(`Error: ${message}`);
    }
});

simHttpPathInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    simHttpSendBtn?.click();
});

// Emscripten WASM ↔ canvas bridge callbacks
(window as any).hackcable_update_pin = (pin: number, value: boolean) => {
    hackCable.esp32PinUpdate(pin, value);
};
(window as any).hackcable_pin_mode = (_pin: number, _mode: number) => {};
(window as any).hackcable_read_pin = (_pin: number): boolean => false;
(window as any).hackcable_analog_read = (pin: number): number => {
    if (pin === 36) return getMock('soil', 50) * 40.95; // 0-100% → 0-4095 ADC
    return 0;
};
(window as any).hackcable_http_get = async (path: string) => {
    return runSimulatedHttpGet(path);
};
(window as any).hackcable_serial_begin = (_baud: number) => {};
(window as any).hackcable_serial_data = (text: string) => { appendSerial(text); feedPlotter(text); };
// Sensor mock input parser
function parseMockValues(): Record<string, number> {
    const el = document.getElementById('sensor-mock-input') as HTMLTextAreaElement | null;
    if (!el) return {};
    const result: Record<string, number> = {};
    for (const line of el.value.split('\n')) {
        const m = line.match(/^\s*(\w+)\s*=\s*([+-]?\d+\.?\d*)\s*$/);
        if (m) result[m[1].toLowerCase()] = parseFloat(m[2]);
    }
    return result;
}

function getMock(key: string, defaultVal: number): number {
    const v = parseMockValues()[key];
    return v !== undefined ? v : defaultVal;
}

// Sensor data bridges (called from Emscripten WASM sensor mocks)
(window as any).hackcable_modbus_read = (_slaveId: number, regAddr: number): number => {
    const weatherKeys: Record<number, [string, number]> = {
        0: ['temperature', 25.0], 1: ['humidity', 60.0], 2: ['co2', 400.0], 3: ['pressure', 1013.0]
    };
    if (weatherKeys[regAddr]) return getMock(weatherKeys[regAddr][0], weatherKeys[regAddr][1]);
    return getMock('ph', 7.0);
};
(window as any).hackcable_sht31_temp = (): number => getMock('temperature', 25.0);
(window as any).hackcable_sht31_humidity = (): number => getMock('humidity', 60.0);
(window as any).hackcable_bh1750_lux = (): number => getMock('lux', 500.0);

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
    if (activeClangLoopHandle !== null) {
        clearInterval(activeClangLoopHandle);
        activeClangLoopHandle = null;
    }
    if (activeClangNativeLoopHandle !== null) {
        clearInterval(activeClangNativeLoopHandle);
        activeClangNativeLoopHandle = null;
    }
}

// Emscripten WASM loader
async function loadEmscriptenWasm(jsGlue: string, wasmBase64: string) {
    await cleanupWasmInstance();

    // Decode base64 → ArrayBuffer
    const bytes = Uint8Array.from(atob(wasmBase64), c => c.charCodeAt(0));
    const wasmBinary = bytes.buffer; // Emscripten expects ArrayBuffer

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

    activeWasmModule = await factory({
        wasmBinary,
        print: (t: string) => appendSerial(t + '\n'),
        printErr: (t: string) => console.warn('[Emscripten]', t),
        locateFile: (p: string) => p
    });
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
}`,

    // ── TEST BFARM 1: SHT31 + WiFi + Cronjob + Fan ──────────────────────────
    test_bfarm_greenhouse: `// TEST BFARM - Greenhouse Controller
// Blocks: Sensor(SHT31 I2C) + WiFi + Cronjob(every 30s) + Actuator(Fan pin 4)
// Logic:  humidity > 80% → Fan ON,  else → Fan OFF
// WiFi:   GET /status → { "temp": x, "humidity": y, "fan": 0|1 }

#include <HandySense.h>
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include "SHT31.h"
#include <Wire.h>
#include <time.h>
#include "cjob.h"

#define FAN_PIN 4
#define WIFI_SSID "YourSSID"
#define WIFI_PASS "YourPassword"

SHT31 sht;
WebServer server(80);
CronID_t id_checkClimate;
bool fanState = false;

void checkClimate() {
  sht.read();
  float humidity = sht.getHumidity();
  if (humidity > 80.0f) {
    digitalWrite(FAN_PIN, HIGH);
    fanState = true;
  } else {
    digitalWrite(FAN_PIN, LOW);
    fanState = false;
  }
  Serial.printf("Temp: %.1f C  Humidity: %.1f%%  Fan: %s\\n",
    sht.getTemperature(), humidity, fanState ? "ON" : "OFF");
}

void setup() {
  Serial.begin(115200);
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);

  Wire.begin();
  Wire.setClock(10000);
  sht.begin(0x44);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  Serial.print("WiFi IP: "); Serial.println(WiFi.localIP());

  server.on("/status", []() {
    sht.read();
    String json = "{\\"temp\\":" + String(sht.getTemperature(), 1)
                + ",\\"humidity\\":" + String(sht.getHumidity(), 1)
                + ",\\"fan\\":" + String(fanState ? 1 : 0) + "}";
    server.send(200, "application/json", json);
  });
  server.begin();

  id_checkClimate = Cron.create("30 * * * * *", checkClimate, false);
}

void loop() {
  server.handleClient();
  Cron.delay();
}`,

    // ── TEST BFARM 2: RS485 pH + Cronjob + Misting Pump ────────────────────
    test_bfarm_ph_mist_auto: `// TEST BFARM - pH Auto-Mist Controller
// Blocks: Sensor(RS485 pH) + Cronjob(every 60s) + Actuator(Misting Pump pin 25)
// Logic:  pH > 7.0 → pump ON 5 s → pump OFF

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>
#include <time.h>
#include "cjob.h"

#define RXD 16
#define TXD 17
#define PUMP_PIN 25

ModbusMaster PHrs485;
float PH;
CronID_t id_phCheck;

void phCheck() {
  uint8_t result = PHrs485.readHoldingRegisters(0, 2);
  if (result == ModbusMaster::ku8MBSuccess) {
    PH = PHrs485.getResponseBuffer(1) / 10.00f;
    Serial.printf("pH: %.2f\\n", PH);
    if (PH > 7.0f) {
      Serial.println("pH high → Misting pump ON");
      digitalWrite(PUMP_PIN, HIGH);
      delay(5000);
      digitalWrite(PUMP_PIN, LOW);
      Serial.println("Misting pump OFF");
    }
  }
}

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);

  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  PHrs485.begin(1, Serial2);

  id_phCheck = Cron.create("0 * * * * *", phCheck, false);
  Serial.println("pH Auto-Mist Ready");
}

void loop() {
  Cron.delay();
}`,

    // ── TEST BFARM 3: Soil Moisture + Daily Cronjob + Water Pump ───────────
    test_bfarm_soil_irrigation: `// TEST BFARM - Daily Soil Irrigation
// Blocks: Sensor(Soil Moisture analog pin 36) + Cronjob(daily 06:00) + Actuator(Water Pump pin 32)
// Logic:  at 06:00 every day → if soil < 40% → pump ON 10 s → pump OFF

#include <HandySense.h>
#include <Arduino.h>
#include <WiFi.h>
#include <time.h>
#include "cjob.h"

#define SOIL_PIN 36
#define PUMP_PIN 32
#define WIFI_SSID "YourSSID"
#define WIFI_PASS "YourPassword"

CronID_t id_irrigate;

void irrigate() {
  int raw = analogRead(SOIL_PIN);
  int soilPct = map(raw, 4095, 0, 0, 100);
  Serial.printf("Soil moisture: %d%% (raw: %d)\\n", soilPct, raw);
  if (soilPct < 40) {
    Serial.println("Soil dry → Water pump ON");
    digitalWrite(PUMP_PIN, HIGH);
    delay(10000);
    digitalWrite(PUMP_PIN, LOW);
    Serial.println("Water pump OFF");
  } else {
    Serial.println("Soil OK → No irrigation needed");
  }
}

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  configTime(7 * 3600, 0, "pool.ntp.org");
  Serial.println("NTP synced — waiting for time...");
  delay(2000);

  // Daily at 06:00:00
  id_irrigate = Cron.create("0 0 6 * * *", irrigate, false);
  Serial.println("Daily Irrigation Scheduler Ready");
}

void loop() {
  Cron.delay();
}`,

    // ── TEST BFARM 4: BH1750 + NeoPixel Grow-Light Indicator ───────────────
    test_bfarm_light_neopixel: `// TEST BFARM - Light Monitor with NeoPixel Indicator
// Blocks: Sensor(BH1750 I2C) + Components>Display&LED(NeoPixel pin 4)
// Logic:  lux < 200 → RED,  200-600 → YELLOW,  > 600 → GREEN

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <BH1750.h>
#include <Adafruit_NeoPixel.h>

#define NEO_PIN   4
#define NEO_COUNT 8

BH1750 lightMeter;
Adafruit_NeoPixel strip(NEO_COUNT, NEO_PIN, NEO_GRB + NEO_KHZ800);

void setAllPixels(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < NEO_COUNT; i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  Wire.setClock(10000);
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);
  strip.begin();
  strip.show();
  Serial.println("Light Monitor Ready");
}

void loop() {
  float lux = lightMeter.readLightLevel();
  Serial.printf("Light: %.1f lux\\n", lux);
  if (lux < 200.0f) {
    setAllPixels(255, 0, 0);        // RED  — too dark
  } else if (lux < 600.0f) {
    setAllPixels(255, 180, 0);      // YELLOW — moderate
  } else {
    setAllPixels(0, 255, 0);        // GREEN — bright enough
  }
  delay(1000);
}`,

    // ── TEST BFARM 5: Weather RS485 (HTCo2PLx) + WiFi Server ───────────────
    test_bfarm_weather_wifi: `// TEST BFARM - Weather Station (RS485 HTCo2PLx) + WiFi JSON Server
// Blocks: Sensor(Weather RS485) + WiFi(connect + server)
// Endpoint: GET /weather → { temp, humidity, co2, pressure }

#include <HandySense.h>
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <ModbusMaster.h>

#define RXD 16
#define TXD 17
#define WIFI_SSID "YourSSID"
#define WIFI_PASS "YourPassword"

ModbusMaster weatherSensor;
WebServer server(80);

float w_temp, w_humidity, w_co2, w_pressure;

void readWeather() {
  uint8_t result = weatherSensor.readHoldingRegisters(0, 8);
  if (result == ModbusMaster::ku8MBSuccess) {
    w_temp     = weatherSensor.getResponseBuffer(0) / 10.0f;
    w_humidity = weatherSensor.getResponseBuffer(1) / 10.0f;
    w_co2      = weatherSensor.getResponseBuffer(2) * 1.0f;
    w_pressure = weatherSensor.getResponseBuffer(3) / 10.0f;
  }
}

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);

  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  weatherSensor.begin(1, Serial2);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  Serial.print("WiFi IP: "); Serial.println(WiFi.localIP());

  server.on("/weather", []() {
    readWeather();
    String json = "{\\"temp\\":" + String(w_temp, 1)
                + ",\\"humidity\\":" + String(w_humidity, 1)
                + ",\\"co2\\":" + String(w_co2, 0)
                + ",\\"pressure\\":" + String(w_pressure, 1) + "}";
    server.send(200, "application/json", json);
    Serial.printf("Served: %s\\n", json.c_str());
  });
  server.begin();
  Serial.println("Weather Station Ready — GET /weather");
}

void loop() {
  server.handleClient();
  readWeather();
  Serial.printf("Temp:%.1fC  Hum:%.1f%%  CO2:%.0fppm  Press:%.1fhPa\\n",
    w_temp, w_humidity, w_co2, w_pressure);
  delay(2000);
}`,

    // ============================================
    // new Bfarm Test - Canonical #block.md format
    // ============================================
    new_bfarm_smart_greenhouse: `// new Bfarm Test - Smart Greenhouse End-to-End
// Blocks used: HandySense_Setup, HandySense_setPin_Relay, sht31_begin_i2c, sht31_read_init_i2c, sht31_read_humid_i2c, sht31_read_temp_i2c, bh1750_begin, bh1750_read, wifi_connect, wifi_start_server, wifi_server_on, wifi_server_send, controls_if, logic_compare, relay_on, relay_off, time_delay
// Coverage: HS Generic, Sensor, WiFi, Electronic, Logic, Time

// HandySense_Setup
#SETUP setup_HandySense();#END
#SETUP Serial.begin(115200);#END
// HandySense_setPin_Relay
#SETUP setPin_Relay(32,33,25,26);#END
#SETUP setPin_SW(36,39,34,35);#END
#SETUP setPin_ErrorSensor(19,18,5);#END

// sht31_begin_i2c
#EXTINC#include "SHT31.h"#END
#EXTINC#include <Wire.h>#END
#VARIABLE SHT31 sht;#END
#SETUP Wire.begin();#END
#SETUP Wire.setClock(10000);#END
#SETUP sht.begin(0x44);#END

// bh1750_begin
#EXTINC#include <BH1750.h>#END
#VARIABLE BH1750 lightMeter;#END
#SETUP lightMeter.begin();#END

// wifi_connect + wifi_start_server
#EXTINC#include <WiFi.h>#END
#EXTINC#include <WebServer.h>#END
#VARIABLE WebServer server(80);#END
#VARIABLE float ghHumidity = 0;#END
#VARIABLE float ghTemp = 0;#END
#VARIABLE float ghLux = 0;#END
#VARIABLE bool fanOn = false;#END
#FUNCTION void connectGreenhouseWifi(){ WiFi.begin("FarmSSID","FarmPass123"); while(WiFi.status() != WL_CONNECTED){ delay(500); } }#END
#SETUP connectGreenhouseWifi();#END
#SETUP server.begin();#END
#LOOP_EXT_CODE server.handleClient();#END

// wifi_server_on + wifi_server_send
#SETUP server.on("/status", [](){#END
#SETUP   String payload = String("humidity=") + String(ghHumidity,1) + String(",temp=") + String(ghTemp,1) + String(",lux=") + String(ghLux,0);#END
#SETUP   server.send(200, "text/plain", payload);#END
#SETUP });#END

// sht31_read_init_i2c
#LOOP_EXT_CODE sht.read();#END
// sht31_read_humid_i2c
#LOOP_EXT_CODE ghHumidity = sht.getHumidity();#END
// sht31_read_temp_i2c
#LOOP_EXT_CODE ghTemp = sht.getTemperature();#END
// bh1750_read
#LOOP_EXT_CODE ghLux = lightMeter.readLightLevel();#END

// controls_if + logic_compare + relay_on + relay_off
#LOOP_EXT_CODE if ((ghHumidity > 82.0f) || (ghTemp > 32.0f)) {#END
#LOOP_EXT_CODE   digitalWrite(const_relay_pin[1], HIGH);#END
#LOOP_EXT_CODE   fanOn = true;#END
#LOOP_EXT_CODE } else {#END
#LOOP_EXT_CODE   digitalWrite(const_relay_pin[1], LOW);#END
#LOOP_EXT_CODE   fanOn = false;#END
#LOOP_EXT_CODE }#END
#LOOP_EXT_CODE Serial.println(String("humidity=") + String(ghHumidity,1) + String(",temp=") + String(ghTemp,1) + String(",lux=") + String(ghLux,0) + String(",fan=") + String(fanOn ? 1 : 0));#END
// time_delay
#LOOP_EXT_CODE delay(1000);#END`,

    new_bfarm_awd_automation: `// new Bfarm Test - Paddy Field AWD Automation
// Blocks used: HandySense_awdv1, CJOB_begin, CJOB_addschedule_every_minutes, CJOB_enable_schedule, io_analog_read, math_arithmetic, controls_if, logic_compare, relay_on, relay_off, time_sync, time_get_hour, time_get_minute, pub_topic
// Coverage: Solution, Cronjob, GPIO, Math, Logic, Time, Cloud

// HandySense_awdv1 scaffold fragments
#EXTINC#include <WiFi.h>#END
#EXTINC#include <ThingSpeakWriter_asukiaaa.h>#END
#EXTINC#include <mqtt_client.h>#END
#EXTINC#include <pub_topic.h>#END
#FUNCTION void connectWifiIfNotConnected(){ if (WiFi.status() != WL_CONNECTED) { WiFi.begin("FarmSSID","FarmPass123"); while(WiFi.status() != WL_CONNECTED){ delay(500); } } }#END
#FUNCTION void Netpiecallback(String topic,byte* payload,unsigned int length){ }#END
#SETUP Serial.begin(115200);#END
#SETUP setupMQTT();#END

// CJOB_begin
#EXTINC#include <time.h>#END
#EXTINC#include "cjob.h"#END
#VARIABLE int CJOB_begin;#END
#LOOP_EXT_CODE Cron.delay();#END

// time_sync + time_get_hour/minute
#EXTINC#include "BFarmTime.h"#END
#VARIABLE BFarmTime bfarmtime;#END
#SETUP bfarmtime.sync();#END

#VARIABLE CronID_t id_awdCycle;#END
#VARIABLE int soilRaw = 0;#END
#VARIABLE float waterDepthCm = 0;#END
#VARIABLE bool valveOpen = false;#END
#VARIABLE const int AWD_RELAY_INDEX = 0;#END
#VARIABLE int awdNowHour = 0;#END
#VARIABLE int awdNowMinute = 0;#END
#VARIABLE unsigned long awdLastStatusMs = 0;#END
#VARIABLE void awdCycle();#END
#FUNCTION void awdCycle(){#END
#FUNCTION   soilRaw = analogRead(36);#END
#FUNCTION   waterDepthCm = ((4095 - soilRaw) / 4095.0f) * 15.0f;#END
#FUNCTION   if (waterDepthCm < 3.0f) {#END
#FUNCTION     digitalWrite(const_relay_pin[AWD_RELAY_INDEX], HIGH);#END
#FUNCTION     valveOpen = true;#END
#FUNCTION   } else {#END
#FUNCTION     digitalWrite(const_relay_pin[AWD_RELAY_INDEX], LOW);#END
#FUNCTION     valveOpen = false;#END
#FUNCTION   }#END
#FUNCTION   pub_topic("@msg/awd/depth", waterDepthCm);#END
#FUNCTION }#END

#SETUP setPin_Relay(25,4,12,13);#END
#SETUP setPin_SW(36,39,34,35);#END
#SETUP setPin_ErrorSensor(19,18,5);#END
#SETUP soilRaw = 0;#END
#SETUP waterDepthCm = 0;#END
#SETUP valveOpen = false;#END
#SETUP awdNowHour = 0;#END
#SETUP awdNowMinute = 0;#END
#SETUP awdLastStatusMs = 0;#END
// CJOB_addschedule_every_minutes
#SETUP id_awdCycle = Cron.create("0 */15 * * * *", awdCycle, false);#END
// CJOB_enable_schedule
#SETUP Cron.enable(id_awdCycle);#END

#LOOP_EXT_CODE connectWifiIfNotConnected();#END
#LOOP_EXT_CODE awdCycle();#END
#LOOP_EXT_CODE awdNowHour = bfarmtime.getHour();#END
#LOOP_EXT_CODE awdNowMinute = bfarmtime.getMinute();#END
#LOOP_EXT_CODE Netpieclient.loop();#END
#LOOP_EXT_CODE if (millis() - awdLastStatusMs >= 1000UL) {#END
#LOOP_EXT_CODE   awdLastStatusMs = millis();#END
#LOOP_EXT_CODE   Serial.println(String("soil_raw=") + String(soilRaw) + String(",depth_cm=") + String(waterDepthCm,2) + String(",valve=") + String(valveOpen ? 1 : 0) + String(",pump=") + String(valveOpen ? 1 : 0) + String(",hour=") + String(awdNowHour) + String(",minute=") + String(awdNowMinute));#END
#LOOP_EXT_CODE }#END
#LOOP_EXT_CODE delay(200);#END`,

    new_bfarm_fertigation_lab: `// new Bfarm Test - Fertigation Controller Lab
// Blocks used: Initial_Fertilizer, Load_preferences, Read_pH, Read_EC, Read_temp, control_pH, control_EC, set_preferences, serial_usb_init, serial_write_data, controls_if, math_arithmetic
// Coverage: Solution(Fertilizer Control), Variables, Math, Serial, Logic

// Initial_Fertilizer
#EXTINC#include <Preferences.h>#END
#EXTINC#include <fertilizer.h>#END
#VARIABLE Preferences preferences;#END
#SETUP preferences = Preferences();#END
#SETUP preferences.begin("credentials", false);#END
#SETUP load_preferences();#END

#VARIABLE int adcPH = 1800;#END
#VARIABLE int adcEC = 2000;#END
#VARIABLE int adcTemp = 1700;#END
#VARIABLE float phValue = 0;#END
#VARIABLE float tempValue = 0;#END
#VARIABLE int ecValue = 0;#END
#VARIABLE int phPumpState = 0;#END
#VARIABLE int ecPumpState = 0;#END
#VARIABLE int mixValveState = 0;#END
#VARIABLE unsigned long fertLastRunMs = 0;#END
#VARIABLE unsigned long fertLastStatusMs = 0;#END

// serial_usb_init
#SETUP Serial.begin(115200);#END
#SETUP setPin_Relay(25,4,12,13);#END
// set_preferences
#SETUP calTemp = 25;#END
#SETUP calPH4 = 1500;#END
#SETUP calPH7 = 2000;#END
#SETUP calPH10 = 2500;#END
#SETUP calEC0 = 100;#END
#SETUP calEC1413 = 1300;#END
#SETUP PHthresh_min = 5.8;#END
#SETUP PHthresh_max = 6.6;#END
#SETUP ECthresh_min = 900;#END
#SETUP PHdura_value = 3;#END
#SETUP ECdura_value = 4;#END
#SETUP set_preferences();#END
#SETUP adcPH = 1800;#END
#SETUP adcEC = 2000;#END
#SETUP adcTemp = 1700;#END
#SETUP phValue = 0;#END
#SETUP tempValue = 0;#END
#SETUP ecValue = 0;#END
#SETUP phPumpState = 0;#END
#SETUP ecPumpState = 0;#END
#SETUP mixValveState = 0;#END
#SETUP fertLastRunMs = 0;#END
#SETUP fertLastStatusMs = 0;#END

#FUNCTION void fertigationStep(){#END
// Read_pH
#FUNCTION phValue = (float)(PHcompute(adcPH));#END
// Read_temp
#FUNCTION tempValue = (float)(Tempcompute(adcTemp));#END
// Read_EC
#FUNCTION ecValue = (int)(ECcompute(adcEC,adcTemp));#END
// control_pH
#FUNCTION control_pH(phValue);#END
// control_EC
#FUNCTION control_EC(ecValue);#END
#FUNCTION }#END

// Load_preferences
#LOOP_EXT_CODE load_preferences();#END
#LOOP_EXT_CODE if (millis() - fertLastRunMs >= 1500UL) {#END
#LOOP_EXT_CODE   fertLastRunMs = millis();#END
#LOOP_EXT_CODE   adcPH = analogRead(36);#END
#LOOP_EXT_CODE   adcEC = analogRead(39);#END
#LOOP_EXT_CODE   adcTemp = analogRead(34);#END
#LOOP_EXT_CODE   fertigationStep();#END
#LOOP_EXT_CODE   if ((phValue < PHthresh_min) || (phValue > PHthresh_max)) { Serial.println("pH out of range"); }#END
#LOOP_EXT_CODE   phPumpState = digitalRead(const_relay_pin[0]);#END
#LOOP_EXT_CODE   ecPumpState = digitalRead(const_relay_pin[1]);#END
#LOOP_EXT_CODE   mixValveState = digitalRead(const_relay_pin[2]);#END
#LOOP_EXT_CODE }#END
// serial_write_data
#LOOP_EXT_CODE if (millis() - fertLastStatusMs >= 1000UL) {#END
#LOOP_EXT_CODE   fertLastStatusMs = millis();#END
#LOOP_EXT_CODE   Serial.println(String("pH=") + String(phValue,2) + String(",EC=") + String(ecValue) + String(",Temp=") + String(tempValue,1) + String(",ph_pump=") + String(phPumpState) + String(",ec_pump=") + String(ecPumpState) + String(",mix_valve=") + String(mixValveState));#END
#LOOP_EXT_CODE }#END
#LOOP_EXT_CODE delay(100);#END`,

    new_bfarm_weather_station_sim: `// new Bfarm Test - Edge Weather Station Simulator
// Blocks used: Weather_HTCo2PLx_begin_rs485, Weather_HTCo2PLx_read_humidity_rs485, Weather_HTCo2PLx_read_temperature_rs485, Weather_HTCo2PLx_read_co2_rs485, Weather_HTCo2PLx_read_pressure_rs485, wifi_connect, netpie_begin, netpie_connect, pub_topic, serial_write_data
// Coverage: Sensor(RS485), WiFi, Cloud, Serial

// Weather_HTCo2PLx_begin_rs485
#EXTINC#include <ModbusMaster.h>#END
#VARIABLE ModbusMaster rs485_Weather_HTCo2PLx;#END
#VARIABLE float Weather_HTCo2PLx;#END
#VARIABLE #define RXD 16#END
#VARIABLE #define TXD 17#END
#SETUP Serial.begin(115200);#END
#SETUP pinMode(25, OUTPUT);#END
#SETUP Serial2.begin(9600, SERIAL_8N1, RXD, TXD);#END
#SETUP rs485_Weather_HTCo2PLx.begin(1, Serial2);#END

// wifi_connect
#EXTINC#include <WiFi.h>#END
#SETUP WiFi.begin("FarmSSID","FarmPass123");#END
#SETUP while(WiFi.status() != WL_CONNECTED){ delay(500); }#END

// netpie_begin
#EXTINC#include <pub_topic.h>#END
#EXTINC#include <mqtt_client.h>#END
#FUNCTION const char* Netpiemqtt_server = "broker.netpie.io";#END
#FUNCTION const int Netpiemqtt_port = 1883;#END
#SETUP setupMQTT();#END
#SETUP Netpieclient.setServer(Netpiemqtt_server, Netpiemqtt_port);#END

#VARIABLE int weatherReadResult = 0;#END
#VARIABLE float weatherHumidity = 0;#END
#VARIABLE float weatherTemp = 0;#END
#VARIABLE float weatherCO2 = 0;#END
#VARIABLE float weatherPressure = 0;#END
#VARIABLE int weatherLedState = 0;#END
#VARIABLE unsigned long weatherLastPollMs = 0;#END
#VARIABLE unsigned long weatherLastStatusMs = 0;#END
#VARIABLE int weatherRs485Ok = 0;#END
#SETUP weatherReadResult = 0;#END
#SETUP weatherHumidity = 0;#END
#SETUP weatherTemp = 0;#END
#SETUP weatherCO2 = 0;#END
#SETUP weatherPressure = 0;#END
#SETUP weatherLedState = 0;#END
#SETUP weatherLastPollMs = 0;#END
#SETUP weatherLastStatusMs = 0;#END
#SETUP weatherRs485Ok = 0;#END

// Weather_HTCo2PLx_read_*_rs485 + netpie_connect + pub_topic
#LOOP_EXT_CODE if (millis() - weatherLastPollMs >= 3000UL) {#END
#LOOP_EXT_CODE   weatherLastPollMs = millis();#END
#LOOP_EXT_CODE   weatherReadResult = rs485_Weather_HTCo2PLx.readHoldingRegisters(500, 10);#END
#LOOP_EXT_CODE   weatherRs485Ok = 0;#END
#LOOP_EXT_CODE   if (weatherReadResult == 0) {#END
#LOOP_EXT_CODE     weatherRs485Ok = 1;#END
#LOOP_EXT_CODE     weatherHumidity = ((rs485_Weather_HTCo2PLx.getResponseBuffer(0) / 10.00f));#END
#LOOP_EXT_CODE     weatherTemp = ((rs485_Weather_HTCo2PLx.getResponseBuffer(1) / 10.00f));#END
#LOOP_EXT_CODE     weatherCO2 = ((rs485_Weather_HTCo2PLx.getResponseBuffer(3) / 1.00f));#END
#LOOP_EXT_CODE     weatherPressure = ((rs485_Weather_HTCo2PLx.getResponseBuffer(5) / 1.00f));#END
#LOOP_EXT_CODE   }#END
#LOOP_EXT_CODE   if (!Netpieclient.connected()) Netpieclient.connect("weather-sim");#END
#LOOP_EXT_CODE   Netpieclient.loop();#END
#LOOP_EXT_CODE   pub_topic("@msg/weather/temp", weatherTemp);#END
#LOOP_EXT_CODE   pub_topic("@msg/weather/humidity", weatherHumidity);#END
#LOOP_EXT_CODE   pub_topic("@msg/weather/co2", weatherCO2);#END
#LOOP_EXT_CODE   if (weatherLedState == 0) {#END
#LOOP_EXT_CODE     weatherLedState = 1;#END
#LOOP_EXT_CODE   } else {#END
#LOOP_EXT_CODE     weatherLedState = 0;#END
#LOOP_EXT_CODE   }#END
#LOOP_EXT_CODE   if (weatherLedState == 1) {#END
#LOOP_EXT_CODE     digitalWrite(25, HIGH);#END
#LOOP_EXT_CODE   } else {#END
#LOOP_EXT_CODE     digitalWrite(25, LOW);#END
#LOOP_EXT_CODE   }#END
#LOOP_EXT_CODE }#END
// serial_write_data
#LOOP_EXT_CODE if (millis() - weatherLastStatusMs >= 1000UL) {#END
#LOOP_EXT_CODE   weatherLastStatusMs = millis();#END
#LOOP_EXT_CODE   Serial.println(String("W:temp=") + String(weatherTemp,1) + String(",humidity=") + String(weatherHumidity,1) + String(",co2=") + String(weatherCO2,0) + String(",pressure=") + String(weatherPressure,1) + String(",led=") + String(weatherLedState) + String(",rs485_ok=") + String(weatherRs485Ok));#END
#LOOP_EXT_CODE }#END
#LOOP_EXT_CODE delay(100);#END`,

    new_bfarm_hybrid_connectivity: `// new Bfarm Test - Hybrid Connectivity Testbed
// Blocks used: serial_usb_init, bt_start, bt_read_line, task_timer_interrupt_ext, io_setpin, io_digital_write, io_pwm_write, text_join, text_length, math_arithmetic, math_constrain, controls_if, logic_compare, logic_operation, controls_repeat_ext
// Coverage: Serial, Bluetooth, Task, GPIO, Text, Math, Logic, Loops

#EXTINC#include "BluetoothSerial.h"#END
#EXTINC#include "BFarmEvent.h"#END
#VARIABLE BluetoothSerial SerialBT;#END
#VARIABLE BFarmEvent bfarmevt;#END
#VARIABLE int blinkPin = 25;#END
#VARIABLE int pwmPin = 4;#END
#VARIABLE String latestLine = "";#END
#VARIABLE int commandPercent = 0;#END
#VARIABLE int currentPwmValue = 0;#END
#VARIABLE int relay1State = 0;#END
#VARIABLE int relay2State = 0;#END
#VARIABLE unsigned long hybridLastStatusMs = 0;#END

// serial_usb_init
#SETUP Serial.begin(115200);#END
// bt_start
#SETUP SerialBT.begin("HybridTestbed");#END
#SETUP setPin_Relay(25,4,12,13);#END
#SETUP latestLine = "";#END
#SETUP commandPercent = 0;#END
#SETUP currentPwmValue = 0;#END
#SETUP relay1State = 0;#END
#SETUP relay2State = 0;#END
#SETUP hybridLastStatusMs = 0;#END
// io_setpin
#SETUP pinMode(blinkPin, OUTPUT);#END
#SETUP pinMode(pwmPin, OUTPUT);#END

// task_timer_interrupt_ext
#BLOCKSETUP
bfarmevt.attach("hybrid_tick",BFarmEventType::EVERY, [](){
  SerialBT.println(String("tick:") + String(millis()));
}, 1000, 2048);
#END

#FUNCTION int parsePercent(String line){ int raw = line.toInt(); return constrain(raw, 0, 100); }#END

// bt_read_line + controls_if + logic_compare + logic_operation + math_arithmetic + math_constrain
#LOOP_EXT_CODE while(SerialBT.available()){#END
#LOOP_EXT_CODE   latestLine = SerialBT.readStringUntil('\\n');#END
#LOOP_EXT_CODE   commandPercent = parsePercent(latestLine);#END
#LOOP_EXT_CODE   currentPwmValue = (commandPercent * 255) / 100;#END
#LOOP_EXT_CODE   if ((latestLine.length() > 0) && (latestLine != "stop")) {#END
// io_pwm_write + io_digital_write + text_join
#LOOP_EXT_CODE     analogWrite(pwmPin, currentPwmValue);#END
#LOOP_EXT_CODE     digitalWrite(blinkPin, HIGH);#END
#LOOP_EXT_CODE     relay1State = 1;#END
#LOOP_EXT_CODE     if (currentPwmValue > 0) {#END
#LOOP_EXT_CODE       relay2State = 1;#END
#LOOP_EXT_CODE     } else {#END
#LOOP_EXT_CODE       relay2State = 0;#END
#LOOP_EXT_CODE     }#END
#LOOP_EXT_CODE     Serial.println(String("BT cmd=") + latestLine + String(", pwm=") + String(currentPwmValue));#END
#LOOP_EXT_CODE   } else {#END
#LOOP_EXT_CODE     analogWrite(pwmPin, 0);#END
#LOOP_EXT_CODE     digitalWrite(blinkPin, LOW);#END
#LOOP_EXT_CODE     currentPwmValue = 0;#END
#LOOP_EXT_CODE     relay1State = 0;#END
#LOOP_EXT_CODE     relay2State = 0;#END
#LOOP_EXT_CODE     Serial.println(String("BT cmd ignored: ") + latestLine);#END
#LOOP_EXT_CODE   }#END
#LOOP_EXT_CODE }#END
// controls_repeat_ext + serial plotter status
#LOOP_EXT_CODE if (millis() - hybridLastStatusMs >= 1000UL) {#END
#LOOP_EXT_CODE   hybridLastStatusMs = millis();#END
#LOOP_EXT_CODE   Serial.println(String("BT cmd=") + String(commandPercent) + String(",pwm=") + String(currentPwmValue) + String(",relay1=") + String(relay1State) + String(",relay2=") + String(relay2State) + String(",bt_rx_chars=") + String(latestLine.length()));#END
#LOOP_EXT_CODE }#END
#LOOP_EXT_CODE delay(200);#END`
};

function isNewBfarmExample(exampleKey: string): boolean {
    return exampleKey.startsWith('new_bfarm_');
}

function preprocessExampleCode(exampleKey: string, rawCode: string): string {
    if (!isNewBfarmExample(exampleKey)) {
        return rawCode;
    }

    if (!hasBfarmMacroMarkers(rawCode)) {
        return rawCode;
    }

    return convertBfarmMacroToCpp(rawCode);
}

function isBrokenCachedAwdCode(code: string): boolean {
    if (!code) return false;
    if (!code.includes('Paddy Field AWD Automation')) return false;
    const awdStart = code.indexOf('void awdCycle(){');
    const setupStart = code.indexOf('void setup() {');
    const pubLine = code.indexOf('pub_topic("@msg/awd/depth", waterDepthCm);');
    const missingRuntimeInit = !code.includes('awdLastStatusMs = 0');
    if (missingRuntimeInit) return true;
    if (awdStart < 0 || setupStart < 0 || pubLine < 0) return false;
    // Broken output had setup() directly after pub_topic() inside awdCycle().
    return awdStart < pubLine && pubLine < setupStart;
}

function repairCachedNewBfarmCodeIfNeeded(): void {
    const cachedCode = localStorage.getItem('hackCable-webExample-inputCode');
    if (!cachedCode || !isBrokenCachedAwdCode(cachedCode)) return;

    const fixedCode = preprocessExampleCode(
        'new_bfarm_awd_automation',
        codeExamples['new_bfarm_awd_automation']
    );

    localStorage.setItem('hackCable-webExample-inputCode', fixedCode);
    if (codeInput instanceof HTMLTextAreaElement) {
        codeInput.value = fixedCode;
    }
    console.log('Repaired stale cached code for new_bfarm_awd_automation.');
}

const codeExamplesSelect = document.getElementById('code-examples') as HTMLSelectElement;
repairCachedNewBfarmCodeIfNeeded();

if (codeExamplesSelect && codeInput instanceof HTMLTextAreaElement) {
    codeExamplesSelect.addEventListener('change', () => {
        const selectedExample = codeExamplesSelect.value;
        if (selectedExample && codeExamples[selectedExample]) {
            const rawExampleCode = codeExamples[selectedExample];
            const preparedExampleCode = preprocessExampleCode(selectedExample, rawExampleCode);
            codeInput.value = preparedExampleCode;
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
                // TEST BFARM Examples
                case 'test_bfarm_greenhouse':
                    setupTestBfarmGreenhouseCircuit();
                    break;
                case 'test_bfarm_ph_mist_auto':
                    setupTestBfarmPhMistAutoCircuit();
                    break;
                case 'test_bfarm_soil_irrigation':
                    setupTestBfarmSoilIrrigationCircuit();
                    break;
                case 'test_bfarm_light_neopixel':
                    setupTestBfarmLightNeopixelCircuit();
                    break;
                case 'test_bfarm_weather_wifi':
                    setupTestBfarmWeatherWifiCircuit();
                    break;
                // new Bfarm Test Examples
                case 'new_bfarm_smart_greenhouse':
                    setupNewBfarmSmartGreenhouseCircuit();
                    break;
                case 'new_bfarm_awd_automation':
                    setupNewBfarmAwdAutomationCircuit();
                    break;
                case 'new_bfarm_fertigation_lab':
                    setupNewBfarmFertigationLabCircuit();
                    break;
                case 'new_bfarm_weather_station_sim':
                    setupNewBfarmWeatherStationSimCircuit();
                    break;
                case 'new_bfarm_hybrid_connectivity':
                    setupNewBfarmHybridConnectivityCircuit();
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
            // Match code: setPin_Relay(25,4,12,13) => IN1..IN4 map to IO25, IO4, IO12, IO13.
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

// TEST BFARM 1: Greenhouse — SHT31 + Fan
function setupTestBfarmGreenhouseCircuit() {
    console.log("Setting up TEST BFARM Greenhouse circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(200).setY(50));
    const sht31Figure = new ComponentFigure(wokwiComponentById[41]);
    hackCable.editor.canvas.add(sht31Figure.setX(500).setY(50));
    const fanFigure = new ComponentFigure(wokwiComponentById[33]);
    hackCable.editor.canvas.add(fanFigure.setX(500).setY(180));
    setTimeout(() => {
        try {
            connectPorts(sht31Figure, 'VCC', boardFigure, '3V3_R1');
            connectPorts(sht31Figure, 'GND', boardFigure, 'GND_R1');
            connectPorts(sht31Figure, 'SDA', boardFigure, 'SDA_1');
            connectPorts(sht31Figure, 'SCL', boardFigure, 'SCL_1');
            connectPorts(fanFigure, 'VCC', boardFigure, 'VIN_2');
            connectPorts(fanFigure, 'GND', boardFigure, 'GND_6');
            connectPorts(fanFigure, 'SIG', boardFigure, 'IO4');
            console.log("TEST BFARM Greenhouse circuit setup complete!");
        } catch (error) {
            console.error("Error during TEST BFARM Greenhouse wiring:", error);
        }
    }, 500);
}

// TEST BFARM 2: pH Auto-Mist — RS485 pH + Misting Pump
function setupTestBfarmPhMistAutoCircuit() {
    console.log("Setting up TEST BFARM pH Auto-Mist circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(200).setY(50));
    const phSensorFigure = new ComponentFigure(wokwiComponentById[35]);
    hackCable.editor.canvas.add(phSensorFigure.setX(500).setY(50));
    const mistPumpFigure = new ComponentFigure(wokwiComponentById[31]);
    hackCable.editor.canvas.add(mistPumpFigure.setX(500).setY(190));
    setTimeout(() => {
        try {
            connectPorts(phSensorFigure, 'VCC', boardFigure, '3V3_R3');
            connectPorts(phSensorFigure, 'GND', boardFigure, 'GND_R3');
            connectPorts(phSensorFigure, 'A+',  boardFigure, 'TX2');
            connectPorts(phSensorFigure, 'B-',  boardFigure, 'RX2');
            connectPorts(mistPumpFigure, 'VCC', boardFigure, 'VIN_1');
            connectPorts(mistPumpFigure, 'GND', boardFigure, 'GND_5');
            connectPorts(mistPumpFigure, 'SIG', boardFigure, 'IO25');
            console.log("TEST BFARM pH Auto-Mist circuit setup complete!");
        } catch (error) {
            console.error("Error during TEST BFARM pH Auto-Mist wiring:", error);
        }
    }, 500);
}

// TEST BFARM 3: Soil Irrigation — Soil Moisture + Water Pump
function setupTestBfarmSoilIrrigationCircuit() {
    console.log("Setting up TEST BFARM Soil Irrigation circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(200).setY(50));
    const soilFigure = new ComponentFigure(wokwiComponentById[44]);
    hackCable.editor.canvas.add(soilFigure.setX(50).setY(80));
    const pumpFigure = new ComponentFigure(wokwiComponentById[32]);
    hackCable.editor.canvas.add(pumpFigure.setX(500).setY(130));
    setTimeout(() => {
        try {
            connectPorts(soilFigure, 'VCC', boardFigure, '3V3_2');
            connectPorts(soilFigure, 'GND', boardFigure, 'GND_2');
            connectPorts(soilFigure, 'AO',  boardFigure, 'IO36');
            connectPorts(pumpFigure, 'VCC', boardFigure, 'VIN_1');
            connectPorts(pumpFigure, 'GND', boardFigure, 'GND_5');
            connectPorts(pumpFigure, 'SIG', boardFigure, 'IO32');
            console.log("TEST BFARM Soil Irrigation circuit setup complete!");
        } catch (error) {
            console.error("Error during TEST BFARM Soil Irrigation wiring:", error);
        }
    }, 500);
}

// TEST BFARM 4: Light NeoPixel — BH1750 + NeoPixel
function setupTestBfarmLightNeopixelCircuit() {
    console.log("Setting up TEST BFARM Light NeoPixel circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(200).setY(50));
    const bh1750Figure = new ComponentFigure(wokwiComponentById[42]);
    hackCable.editor.canvas.add(bh1750Figure.setX(500).setY(50));
    const neopixelFigure = new ComponentFigure(wokwiComponentById[4]);
    hackCable.editor.canvas.add(neopixelFigure.setX(500).setY(180));
    setTimeout(() => {
        try {
            connectPorts(bh1750Figure, 'VCC', boardFigure, '3V3_R1');
            connectPorts(bh1750Figure, 'GND', boardFigure, 'GND_R1');
            connectPorts(bh1750Figure, 'SDA', boardFigure, 'SDA_1');
            connectPorts(bh1750Figure, 'SCL', boardFigure, 'SCL_1');
            connectPorts(neopixelFigure, 'VDD', boardFigure, 'VIN_1');
            connectPorts(neopixelFigure, 'VSS', boardFigure, 'GND_5');
            connectPorts(neopixelFigure, 'DIN', boardFigure, 'IO4');
            console.log("TEST BFARM Light NeoPixel circuit setup complete!");
        } catch (error) {
            console.error("Error during TEST BFARM Light NeoPixel wiring:", error);
        }
    }, 500);
}

// TEST BFARM 5: Weather WiFi — Weather RS485 HTCo2PLx
function setupTestBfarmWeatherWifiCircuit() {
    console.log("Setting up TEST BFARM Weather WiFi circuit...");
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(150).setY(50));
    const weatherFigure = new ComponentFigure(wokwiComponentById[40]);
    hackCable.editor.canvas.add(weatherFigure.setX(470).setY(90));
    setTimeout(() => {
        try {
            connectPorts(weatherFigure, 'VCC', boardFigure, '3V3_R3');
            connectPorts(weatherFigure, 'GND', boardFigure, 'GND_R3');
            connectPorts(weatherFigure, 'A+',  boardFigure, 'TX2');
            connectPorts(weatherFigure, 'B-',  boardFigure, 'RX2');
            console.log("TEST BFARM Weather WiFi circuit setup complete!");
        } catch (error) {
            console.error("Error during TEST BFARM Weather WiFi wiring:", error);
        }
    }, 500);
}

// ============================================
// new Bfarm Test Circuit Setup Functions
// ============================================

function setupNewBfarmSmartGreenhouseCircuit() {
    console.log("Setting up new Bfarm Smart Greenhouse circuit...");
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(180).setY(40));
    const sht31Figure = new ComponentFigure(wokwiComponentById[41]);
    hackCable.editor.canvas.add(sht31Figure.setX(480).setY(40));
    const bh1750Figure = new ComponentFigure(wokwiComponentById[42]);
    hackCable.editor.canvas.add(bh1750Figure.setX(480).setY(150));
    const fanFigure = new ComponentFigure(wokwiComponentById[33]);
    hackCable.editor.canvas.add(fanFigure.setX(480).setY(260));
    const relayFigure = new ComponentFigure(wokwiComponentById[45]);
    hackCable.editor.canvas.add(relayFigure.setX(20).setY(180));

    setTimeout(() => {
        try {
            connectPorts(sht31Figure, 'VCC', boardFigure, '3V3_R1');
            connectPorts(sht31Figure, 'GND', boardFigure, 'GND_R1');
            connectPorts(sht31Figure, 'SDA', boardFigure, 'SDA_1');
            connectPorts(sht31Figure, 'SCL', boardFigure, 'SCL_1');

            connectPorts(bh1750Figure, 'VCC', boardFigure, '3V3_R2');
            connectPorts(bh1750Figure, 'GND', boardFigure, 'GND_R2');
            connectPorts(bh1750Figure, 'SDA', boardFigure, 'SDA_2');
            connectPorts(bh1750Figure, 'SCL', boardFigure, 'SCL_2');

            connectPorts(fanFigure, 'VCC', boardFigure, 'VIN_2');
            connectPorts(fanFigure, 'GND', boardFigure, 'GND_6');
            // Match code: setPin_Relay(32,33,25,26) and control const_relay_pin[1] => IO33.
            connectPorts(fanFigure, 'SIG', boardFigure, 'IO33');

            connectPorts(relayFigure, 'VCC', boardFigure, 'VIN_1');
            connectPorts(relayFigure, 'GND', boardFigure, 'GND_5');
            // Match the same relay mapping used in generated code.
            connectPorts(relayFigure, 'IN1', boardFigure, 'IO32');
            connectPorts(relayFigure, 'IN2', boardFigure, 'IO33');
            connectPorts(relayFigure, 'IN3', boardFigure, 'IO25');
            connectPorts(relayFigure, 'IN4', boardFigure, 'IO26');

            console.log("new Bfarm Smart Greenhouse circuit setup complete!");
        } catch (error) {
            console.error("Error during new Bfarm Smart Greenhouse wiring:", error);
        }
    }, 500);
}

function setupNewBfarmAwdAutomationCircuit() {
    console.log("Setting up new Bfarm AWD Automation circuit...");
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(200).setY(50));
    const soilFigure = new ComponentFigure(wokwiComponentById[44]);
    hackCable.editor.canvas.add(soilFigure.setX(40).setY(90));
    const pumpFigure = new ComponentFigure(wokwiComponentById[32]);
    hackCable.editor.canvas.add(pumpFigure.setX(500).setY(120));
    const relayFigure = new ComponentFigure(wokwiComponentById[45]);
    hackCable.editor.canvas.add(relayFigure.setX(500).setY(240));

    setTimeout(() => {
        try {
            connectPorts(soilFigure, 'VCC', boardFigure, '3V3_2');
            connectPorts(soilFigure, 'GND', boardFigure, 'GND_2');
            connectPorts(soilFigure, 'AO', boardFigure, 'IO36');

            connectPorts(pumpFigure, 'VCC', boardFigure, 'VIN_1');
            connectPorts(pumpFigure, 'GND', boardFigure, 'GND_5');
            connectPorts(pumpFigure, 'SIG', boardFigure, 'IO25');

            connectPorts(relayFigure, 'VCC', boardFigure, 'VIN_2');
            connectPorts(relayFigure, 'GND', boardFigure, 'GND_6');
            // Match code: setPin_Relay(25,4,12,13) => IN1..IN4 map to IO25, IO4, IO12, IO13.
            connectPorts(relayFigure, 'IN1', boardFigure, 'IO25');
            connectPorts(relayFigure, 'IN2', boardFigure, 'IO4');
            connectPorts(relayFigure, 'IN3', boardFigure, 'IO12');
            connectPorts(relayFigure, 'IN4', boardFigure, 'IO13');

            console.log("new Bfarm AWD Automation circuit setup complete!");
        } catch (error) {
            console.error("Error during new Bfarm AWD Automation wiring:", error);
        }
    }, 500);
}

function setupNewBfarmFertigationLabCircuit() {
    console.log("Setting up new Bfarm Fertigation Lab circuit...");
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(160).setY(40));
    const fertPhFigure = new ComponentFigure(wokwiComponentById[46]);
    hackCable.editor.canvas.add(fertPhFigure.setX(500).setY(40));
    const ecFigure = new ComponentFigure(wokwiComponentById[47]);
    hackCable.editor.canvas.add(ecFigure.setX(500).setY(150));
    const tempFigure = new ComponentFigure(wokwiComponentById[48]);
    hackCable.editor.canvas.add(tempFigure.setX(500).setY(260));
    const relayFigure = new ComponentFigure(wokwiComponentById[45]);
    hackCable.editor.canvas.add(relayFigure.setX(20).setY(130));

    setTimeout(() => {
        try {
            [fertPhFigure, ecFigure, tempFigure].forEach((sensorFigure) => {
                connectPorts(sensorFigure, 'VCC', boardFigure, '3V3_R3');
                connectPorts(sensorFigure, 'GND', boardFigure, 'GND_R3');
                connectPorts(sensorFigure, 'A+', boardFigure, 'TX2');
                connectPorts(sensorFigure, 'B-', boardFigure, 'RX2');
            });

            connectPorts(relayFigure, 'VCC', boardFigure, 'VIN_1');
            connectPorts(relayFigure, 'GND', boardFigure, 'GND_5');
            // Match code: setPin_Relay(25,4,12,13) => IN1..IN4 map to IO25, IO4, IO12, IO13.
            connectPorts(relayFigure, 'IN1', boardFigure, 'IO25');
            connectPorts(relayFigure, 'IN2', boardFigure, 'IO4');
            connectPorts(relayFigure, 'IN3', boardFigure, 'IO12');
            connectPorts(relayFigure, 'IN4', boardFigure, 'IO13');

            console.log("new Bfarm Fertigation Lab circuit setup complete!");
        } catch (error) {
            console.error("Error during new Bfarm Fertigation Lab wiring:", error);
        }
    }, 500);
}

function setupNewBfarmWeatherStationSimCircuit() {
    console.log("Setting up new Bfarm Weather Station Simulator circuit...");
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(150).setY(50));
    const weatherFigure = new ComponentFigure(wokwiComponentById[40]);
    hackCable.editor.canvas.add(weatherFigure.setX(470).setY(90));
    const ledFigure = new ComponentFigure(wokwiComponentById[1]);
    hackCable.editor.canvas.add(ledFigure.setX(40).setY(150));

    setTimeout(() => {
        try {
            connectPorts(weatherFigure, 'VCC', boardFigure, '3V3_R3');
            connectPorts(weatherFigure, 'GND', boardFigure, 'GND_R3');
            connectPorts(weatherFigure, 'A+', boardFigure, 'TX2');
            connectPorts(weatherFigure, 'B-', boardFigure, 'RX2');

            connectPorts(ledFigure, 'A', boardFigure, 'IO25');
            connectPorts(ledFigure, 'C', boardFigure, 'GND_5');

            console.log("new Bfarm Weather Station Simulator circuit setup complete!");
        } catch (error) {
            console.error("Error during new Bfarm Weather Station Simulator wiring:", error);
        }
    }, 500);
}

function setupNewBfarmHybridConnectivityCircuit() {
    console.log("Setting up new Bfarm Hybrid Connectivity circuit...");
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(180).setY(40));
    const buttonFigure = new ComponentFigure(wokwiComponentById[49]);
    hackCable.editor.canvas.add(buttonFigure.setX(20).setY(70));
    const relayFigure = new ComponentFigure(wokwiComponentById[45]);
    hackCable.editor.canvas.add(relayFigure.setX(500).setY(80));
    const neopixelFigure = new ComponentFigure(wokwiComponentById[4]);
    hackCable.editor.canvas.add(neopixelFigure.setX(500).setY(260));

    setTimeout(() => {
        try {
            connectPorts(buttonFigure, 'VCC', boardFigure, '3V3_4');
            connectPorts(buttonFigure, 'GND', boardFigure, 'GND_4');
            connectPorts(buttonFigure, 'B1', boardFigure, 'IO32');
            connectPorts(buttonFigure, 'B2', boardFigure, 'IO33');
            connectPorts(buttonFigure, 'B3', boardFigure, 'IO15');
            connectPorts(buttonFigure, 'B4', boardFigure, 'IO39');

            connectPorts(relayFigure, 'VCC', boardFigure, 'VIN_1');
            connectPorts(relayFigure, 'GND', boardFigure, 'GND_5');
            // Match code: setPin_Relay(25,4,12,13) with blinkPin=IO25 and pwmPin=IO4.
            connectPorts(relayFigure, 'IN1', boardFigure, 'IO25');
            connectPorts(relayFigure, 'IN2', boardFigure, 'IO4');
            connectPorts(relayFigure, 'IN3', boardFigure, 'IO12');
            connectPorts(relayFigure, 'IN4', boardFigure, 'IO13');

            connectPorts(neopixelFigure, 'VDD', boardFigure, 'VIN_1');
            connectPorts(neopixelFigure, 'VSS', boardFigure, 'GND_5');
            connectPorts(neopixelFigure, 'DIN', boardFigure, 'IO4');

            console.log("new Bfarm Hybrid Connectivity circuit setup complete!");
        } catch (error) {
            console.error("Error during new Bfarm Hybrid Connectivity wiring:", error);
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
