import "./css/main.styl"
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";
import "codemirror/mode/clike/clike";
import {CompileResult, EmulatorManager, HackCable} from "../src/main";
import {wokwiComponentById, wokwiComponentByClass, ComponentType} from "../src/panels/component";
import {ComponentFigure} from "../src/editor/component-figure";
import type {EditorSaveData} from "../src/editor/editor";
import * as draw2d from "draw2d";
import {DisconnectableConnectionPolicy} from "../src/editor/connections-policies";
import { ClangWasmRunner, isClangCancellation } from './clang-runner';
import { ArduinoWasmShim } from './arduino-wasm-shim';
import { getArduinoHeaders } from './arduino-headers';
import { convertBfarmMacroToCpp, hasBfarmMacroMarkers } from './bfarm-macro-converter';
import { installWasmCompatHarness } from './wasm-compat-runner';
import { HANDYSENSE_REAL_BOARD_CONTROL_EVENT } from '../src/components/handysense-real-board';
import type { HandysenseRealBoardControlDetail, HandysenseRealBoardControlName } from '../src/components/handysense-real-board';

console.log("Running HackCable web interface")
installWasmCompatHarness();

const mountingDiv = document.getElementById('hackCable');
if(!mountingDiv) throw new DOMException("Mounting div not found")

const languageStorageKey = 'hackCable-webExample-language';
localStorage.setItem(languageStorageKey, 'en_us');
let hackCable = new HackCable(mountingDiv, 'en_us');

// Clang/LLVM WASM state
const clangRunner = new ClangWasmRunner();
let lastClangResult: Uint8Array | null = null;
let activeClangLoopHandle: ReturnType<typeof setInterval> | null = null;
let activeClangShim: ArduinoWasmShim | null = null;

const SIM_FIXED_STEP_MS = 16;
const SIM_MAX_STEPS_PER_TICK = 240;
const SIM_MAX_PENDING_STEPS = 12000;

function startFixedStepSimulationLoop(
    step: () => void,
    onError: (error: unknown) => void,
): ReturnType<typeof setInterval> {
    let pendingSteps = 0;
    let lastTimestamp = performance.now();
    let warnedBacklog = false;

    return setInterval(() => {
        const now = performance.now();
        let elapsedMs = now - lastTimestamp;
        lastTimestamp = now;
        if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
            elapsedMs = SIM_FIXED_STEP_MS;
        }

        const computedSteps = Math.max(1, Math.floor(elapsedMs / SIM_FIXED_STEP_MS));
        pendingSteps += computedSteps;

        if (pendingSteps > SIM_MAX_PENDING_STEPS) {
            pendingSteps = SIM_MAX_PENDING_STEPS;
            if (!warnedBacklog) {
                warnedBacklog = true;
                console.warn('[HackCable] Simulation loop backlog is very large; limiting catch-up work per interval.');
            }
        }

        const stepsThisTick = Math.min(pendingSteps, SIM_MAX_STEPS_PER_TICK);
        for (let i = 0; i < stepsThisTick; i++) {
            try {
                step();
            } catch (error) {
                onError(error);
                return;
            }
        }
        pendingSteps -= stepsThisTick;
    }, SIM_FIXED_STEP_MS);
}

const DEFAULT_STARTUP_BOARD_POSITION = { x: 900, y: 600 };

function getInitialViewportBoardPosition(
    _figure: ComponentFigure,
    fallback: { x: number; y: number } = DEFAULT_STARTUP_BOARD_POSITION
): { x: number; y: number } {
    return fallback;
}

function positionBoardForInitialViewport(
    boardFigure: ComponentFigure,
    onPositioned?: (position: { x: number; y: number }) => void
) {
    setTimeout(() => {
        const position = getInitialViewportBoardPosition(boardFigure);
        boardFigure.setX(position.x).setY(position.y);
        onPositioned?.(position);
    }, 60);
}

function isSingleBoardCircuitData(data: EditorSaveData | null | undefined): boolean {
    if (!data) return false;
    const standaloneLines = data.standaloneLines ?? [];
    return data.figures.length === 1
        && data.connections.length === 0
        && standaloneLines.length === 0;
}

function repositionRestoredSingleBoardIfNeeded() {
    const figures = hackCable.editor.canvas.getAllFigures();
    if (figures.length !== 1) return;
    positionBoardForInitialViewport(figures[0]);
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
    hackCable.editor.canvas.add(arduinoFigure.setX(900).setY(600));

    // Create LED (component id: 1)
    const ledFigure = new ComponentFigure(wokwiComponentById[1]);
    hackCable.editor.canvas.add(ledFigure.setX(500).setY(200));

    positionBoardForInitialViewport(arduinoFigure, ({ x, y }) => {
        ledFigure.setX(x + 300).setY(y + 100);
    });

    // Wait for components to be fully rendered before wiring
    setTimeout(() => {
        try {
            // Connect LED anode to Arduino pin 13
            const pin13Port = arduinoFigure.getPortByName("13");
            const ledAnodePort = ledFigure.getPortByName("A");

            if (pin13Port && ledAnodePort) {
                let connection1 = new draw2d.Connection();
                connection1.setRouter(new draw2d.layout.connection.InteractiveManhattanConnectionRouter());
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
                connection2.setRouter(new draw2d.layout.connection.InteractiveManhattanConnectionRouter());
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

function scheduleInitialViewportCenter(delayMs = 700) {
    const attemptDelays = [delayMs, delayMs + 350, delayMs + 900];
    attemptDelays.forEach((attemptDelay) => {
        setTimeout(() => {
            hackCable.editor.canvas.centerViewportOnPrimaryBoardOrContent();
        }, attemptDelay);
    });
}

function setupBoardForNewCircuit(
    selectedBoard: ReturnType<typeof normalizeBoardSelection>,
    forceDefaultSetup = false
) {
    if (selectedBoard === 'esp32') {
        setupESP32Circuit();
    } else if (selectedBoard === 'custom-esp32') {
        setupCustomESP32Circuit();
    } else if (isHandysenseBoard(selectedBoard)) {
        setupHandysenseCircuit(selectedBoard);
    } else {
        autoSetupBasicCircuit(forceDefaultSetup);
    }
}

// Call auto-setup after a short delay to ensure everything is loaded
setTimeout(() => {
    // Check which board should be loaded
    const selectedBoard = normalizeBoardSelection(localStorage.getItem('hackCable-selectedBoard'));
    const savedCircuit = localStorage.getItem('savedEditor');

    // Auto-restore saved circuit if it has figures, otherwise run default setup
    let hasRestoredData = false;
    let restoredSingleBoardCircuit = false;
    if (savedCircuit) {
        try {
            const parsedData = JSON.parse(savedCircuit) as EditorSaveData;
            if (parsedData.figures && parsedData.figures.length > 0) {
                hackCable.editor.loadEditorSaveData(parsedData);
                hasRestoredData = true;
                restoredSingleBoardCircuit = isSingleBoardCircuitData(parsedData);
            }
        } catch (e) {
            console.log("Error parsing saved circuit data:", e);
        }
    }

    if (!hasRestoredData) {
        setupBoardForNewCircuit(selectedBoard);
        scheduleInitialViewportCenter();
    } else if (restoredSingleBoardCircuit) {
        repositionRestoredSingleBoardIfNeeded();
        scheduleInitialViewportCenter();
    }

    // Setup automatic code generation when circuit changes
    const persistCurrentCircuit = () => {
        try {
            const data = hackCable.editor.getEditorSaveData();
            localStorage.setItem('savedEditor', JSON.stringify(data));
        } catch (error) {
            console.warn('[HackCable] Unable to auto-save circuit:', error);
        }
    };

    hackCable.editor.canvas.setOnCircuitStateChangeCallback(persistCurrentCircuit);
    window.addEventListener('pagehide', persistCurrentCircuit);

    hackCable.editor.canvas.setOnCircuitChangeCallback((generatedCode: string) => {
        if (codeInput instanceof HTMLTextAreaElement) {
            // Only update if user hasn't written custom code
            const currentCode = getCodeEditorValue().trim();
            if (!currentCode || currentCode.includes('// Auto-generated code based on circuit design')) {
                setCodeEditorValue(generatedCode);
                console.log('Code automatically generated from circuit');
            }
        }
    });

    // Set default example selection and load its code
    const examplesSelect = document.getElementById('code-examples') as HTMLSelectElement;
    if (examplesSelect) {
        const savedExample = localStorage.getItem(EXAMPLE_SELECTION_STORAGE_KEY) || '';
        if (savedExample && codeExamples[savedExample]) {
            examplesSelect.value = savedExample;
        } else {
            examplesSelect.value = 'handysense_real_six_button_test';
        }
    }
    setTimeout(() => {
        if (!(codeInput instanceof HTMLTextAreaElement) || !examplesSelect) return;
        const currentCode = getCodeEditorValue().trim();
        if (!currentCode) {
            const selectedKey = examplesSelect.value && codeExamples[examplesSelect.value]
                ? examplesSelect.value
                : 'handysense_real_six_button_test';
            setCodeEditorValue(codeExamples[selectedKey]);
            localStorage.setItem('hackCable-webExample-inputCode', getCodeEditorValue());
            localStorage.setItem(EXAMPLE_SELECTION_STORAGE_KEY, selectedKey);
            return;
        }
    }, 1000);
}, 100);

const compileButton = document.getElementById('compile');
const executeButton = document.getElementById('execute');
const stopButton = document.getElementById('stop');
const pauseButton = document.getElementById('pause');
const buildCircuitFromCodeButton = document.getElementById('build-circuit-from-code');
const clearCodeButton = document.getElementById('clear-code');
const codeInput = document.getElementById('code-editor');
const hexInput = document.getElementById('code-compiled');
const statusMessage = document.getElementById('status-message');
const codeEditorShell = document.querySelector('.editor-tab-panel[data-editor-panel="code"] .code-editor-shell') as HTMLElement | null;
const codeEditorResizeHandle = document.getElementById('code-editor-resize-handle') as HTMLDivElement | null;
const EXAMPLE_SELECTION_STORAGE_KEY = 'hackCable-webExample-selected';

const compilerModeSelect = document.getElementById('compiler-mode') as HTMLSelectElement;
const boardSelectEl = document.getElementById('board-select') as HTMLSelectElement;
const HANDYSENSE_REAL_RUNTIME_INPUT_PINS: Record<Exclude<HandysenseRealBoardControlName, 'reset'>, number> = {
    boot: 0,
    button0: 32,
    button1: 33,
    button2: 15,
    button3: 39,
};

type MockSource = 'text' | 'timeline';
type SensorKey = 'humidity' | 'temperature' | 'ph' | 'lux' | 'soil' | 'co2' | 'pressure' | 'ec' | 'nitrogen' | 'phosphorus' | 'potassium' | 'ammonia' | 'pm1' | 'pm25' | 'pm4' | 'pm10' | 'voc' | 'nox' | 'distance' | 'turbidity' | 'nitrate_vout' | 'nitrate_vout_temp' | 'nitrate_sample' | 'nitrate_error' | 'nitrate_r_square' | 'nitrate_sensitivity' | 'nitrate_std1' | 'nitrate_std2' | 'nitrate_std3' | 'voltage' | 'tmec_analog_uv' | 'water_level' | 'water_temperature' | 'dissolved_oxygen' | 'do_temperature' | 'ammonia_temperature' | 'tubular_moisture_10' | 'tubular_temperature_10' | 'tubular_moisture_20' | 'tubular_temperature_20' | 'tubular_moisture_30' | 'tubular_temperature_30' | 'tubular_moisture_40' | 'tubular_temperature_40' | 'tubular_moisture_50' | 'tubular_temperature_50' | 'air_velocity' | 'noise' | 'weight' | 'wind_direction' | 'wind_speed' | 'rain' | 'par';
type MockSegment = { startSec: number; endSec: number; value: number };
type MockTimelineConfig = { durationSec: number; tracks: Record<SensorKey, MockSegment[]> };
type GraphPoint = { tSec: number; value: number };
type MockEditorMode = 'graph' | 'timeline';
type SensorRange = { min: number; max: number };
type MockGraphUiPrefs = {
    selectedSensor: SensorKey;
    editorMode: MockEditorMode;
    yRanges: Partial<Record<SensorKey, SensorRange>>;
};
type CircuitSessionMockState = {
    source: MockSource;
    text: string;
    timelineConfig: MockTimelineConfig;
    graphUiPrefs: MockGraphUiPrefs;
};
type CircuitSessionFile = {
    version: 1;
    app: 'hackcable-circuit-session';
    savedAt: string;
    board: ReturnType<typeof normalizeBoardSelection>;
    code: string;
    circuit: EditorSaveData;
    mock: CircuitSessionMockState;
};
type SaveFilePickerOptions = {
    suggestedName?: string;
    types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
    }>;
};
type SaveFileHandle = {
    createWritable: () => Promise<{
        write: (data: Blob | string) => Promise<void>;
        close: () => Promise<void>;
    }>;
};

const SENSOR_KEYS: SensorKey[] = ['humidity', 'temperature', 'ph', 'lux', 'soil', 'co2', 'pressure', 'ec', 'nitrogen', 'phosphorus', 'potassium', 'ammonia', 'pm1', 'pm25', 'pm4', 'pm10', 'voc', 'nox', 'distance', 'turbidity', 'nitrate_vout', 'nitrate_vout_temp', 'nitrate_sample', 'nitrate_error', 'nitrate_r_square', 'nitrate_sensitivity', 'nitrate_std1', 'nitrate_std2', 'nitrate_std3', 'voltage', 'tmec_analog_uv', 'water_level', 'water_temperature', 'dissolved_oxygen', 'do_temperature', 'ammonia_temperature', 'tubular_moisture_10', 'tubular_temperature_10', 'tubular_moisture_20', 'tubular_temperature_20', 'tubular_moisture_30', 'tubular_temperature_30', 'tubular_moisture_40', 'tubular_temperature_40', 'tubular_moisture_50', 'tubular_temperature_50', 'air_velocity', 'noise', 'weight', 'wind_direction', 'wind_speed', 'rain', 'par'];
const SENSOR_KEY_SET = new Set<SensorKey>(SENSOR_KEYS);
const SENSOR_DEFAULT_RANGES: Record<SensorKey, SensorRange> = {
    humidity: { min: 0, max: 100 },
    temperature: { min: -10, max: 60 },
    ph: { min: 0, max: 14 },
    lux: { min: 0, max: 120000 },
    soil: { min: 0, max: 100 },
    co2: { min: 300, max: 2000 },
    pressure: { min: 900, max: 1100 },
    ec: { min: 0, max: 5000 },
    nitrogen: { min: 0, max: 2000 },
    phosphorus: { min: 0, max: 2000 },
    potassium: { min: 0, max: 2000 },
    ammonia: { min: 0, max: 100 },
    pm1: { min: 0, max: 500 },
    pm25: { min: 0, max: 500 },
    pm4: { min: 0, max: 500 },
    pm10: { min: 0, max: 500 },
    voc: { min: 0, max: 500 },
    nox: { min: 0, max: 500 },
    distance: { min: 0, max: 1000 },
    turbidity: { min: 0, max: 4000 },
    nitrate_vout: { min: -1000, max: 1000 },
    nitrate_vout_temp: { min: -1000, max: 1000 },
    nitrate_sample: { min: 0, max: 1000 },
    nitrate_error: { min: 0, max: 100 },
    nitrate_r_square: { min: 0, max: 1 },
    nitrate_sensitivity: { min: 0, max: 500 },
    nitrate_std1: { min: 0, max: 1000 },
    nitrate_std2: { min: 0, max: 1000 },
    nitrate_std3: { min: 0, max: 1000 },
    voltage: { min: 0, max: 30 },
    tmec_analog_uv: { min: 0, max: 5000 },
    water_level: { min: 0, max: 500 },
    water_temperature: { min: 0, max: 60 },
    dissolved_oxygen: { min: 0, max: 20 },
    do_temperature: { min: 0, max: 60 },
    ammonia_temperature: { min: 0, max: 60 },
    tubular_moisture_10: { min: 0, max: 100 },
    tubular_temperature_10: { min: -10, max: 60 },
    tubular_moisture_20: { min: 0, max: 100 },
    tubular_temperature_20: { min: -10, max: 60 },
    tubular_moisture_30: { min: 0, max: 100 },
    tubular_temperature_30: { min: -10, max: 60 },
    tubular_moisture_40: { min: 0, max: 100 },
    tubular_temperature_40: { min: -10, max: 60 },
    tubular_moisture_50: { min: 0, max: 100 },
    tubular_temperature_50: { min: -10, max: 60 },
    air_velocity: { min: 0, max: 60 },
    noise: { min: 0, max: 150 },
    weight: { min: 0, max: 3000 },
    wind_direction: { min: 0, max: 360 },
    wind_speed: { min: 0, max: 60 },
    rain: { min: 0, max: 500 },
    par: { min: 0, max: 3000 },
};
const SENSOR_LABEL_KEYS: Record<SensorKey, string> = {
    humidity: 'ui.mock.sensor.humidity',
    temperature: 'ui.mock.sensor.temperature',
    ph: 'ui.mock.sensor.ph',
    lux: 'ui.mock.sensor.lux',
    soil: 'ui.mock.sensor.soil',
    co2: 'ui.mock.sensor.co2',
    pressure: 'ui.mock.sensor.pressure',
    ec: 'ui.mock.sensor.ec',
    nitrogen: 'ui.mock.sensor.nitrogen',
    phosphorus: 'ui.mock.sensor.phosphorus',
    potassium: 'ui.mock.sensor.potassium',
    ammonia: 'ui.mock.sensor.ammonia',
    pm1: 'ui.mock.sensor.pm1',
    pm25: 'ui.mock.sensor.pm25',
    pm4: 'ui.mock.sensor.pm4',
    pm10: 'ui.mock.sensor.pm10',
    voc: 'ui.mock.sensor.voc',
    nox: 'ui.mock.sensor.nox',
    distance: 'ui.mock.sensor.distance',
    turbidity: 'ui.mock.sensor.turbidity',
    nitrate_vout: 'ui.mock.sensor.nitrateVout',
    nitrate_vout_temp: 'ui.mock.sensor.nitrateVoutTemp',
    nitrate_sample: 'ui.mock.sensor.nitrateSample',
    nitrate_error: 'ui.mock.sensor.nitrateError',
    nitrate_r_square: 'ui.mock.sensor.nitrateRSquare',
    nitrate_sensitivity: 'ui.mock.sensor.nitrateSensitivity',
    nitrate_std1: 'ui.mock.sensor.nitrateStd1',
    nitrate_std2: 'ui.mock.sensor.nitrateStd2',
    nitrate_std3: 'ui.mock.sensor.nitrateStd3',
    voltage: 'ui.mock.sensor.voltage',
    tmec_analog_uv: 'ui.mock.sensor.tmecAnalogUv',
    water_level: 'ui.mock.sensor.waterLevel',
    water_temperature: 'ui.mock.sensor.waterTemperature',
    dissolved_oxygen: 'ui.mock.sensor.dissolvedOxygen',
    do_temperature: 'ui.mock.sensor.doTemperature',
    ammonia_temperature: 'ui.mock.sensor.ammoniaTemperature',
    tubular_moisture_10: 'ui.mock.sensor.tubularMoisture10',
    tubular_temperature_10: 'ui.mock.sensor.tubularTemperature10',
    tubular_moisture_20: 'ui.mock.sensor.tubularMoisture20',
    tubular_temperature_20: 'ui.mock.sensor.tubularTemperature20',
    tubular_moisture_30: 'ui.mock.sensor.tubularMoisture30',
    tubular_temperature_30: 'ui.mock.sensor.tubularTemperature30',
    tubular_moisture_40: 'ui.mock.sensor.tubularMoisture40',
    tubular_temperature_40: 'ui.mock.sensor.tubularTemperature40',
    tubular_moisture_50: 'ui.mock.sensor.tubularMoisture50',
    tubular_temperature_50: 'ui.mock.sensor.tubularTemperature50',
    air_velocity: 'ui.mock.sensor.airVelocity',
    noise: 'ui.mock.sensor.noise',
    weight: 'ui.mock.sensor.weight',
    wind_direction: 'ui.mock.sensor.windDirection',
    wind_speed: 'ui.mock.sensor.windSpeed',
    rain: 'ui.mock.sensor.rain',
    par: 'ui.mock.sensor.par',
};
const MOCK_SOURCE_STORAGE_KEY = 'hackCable-mock-source';
const MOCK_TIMELINE_STORAGE_KEY = 'hackCable-mock-timeline';
const MOCK_GRAPH_UI_STORAGE_KEY = 'hackCable-mock-graph-ui';
const MOCK_TEXT_STORAGE_KEY = 'hackCable-mock-text';
const DEFAULT_MOCK_TIMELINE_DURATION_SEC = 20;
const GRAPH_TIME_SNAP_SEC = 0.5;
const GRAPH_AXIS_PADDING_LEFT = 46;
const GRAPH_AXIS_PADDING_RIGHT = 12;
const GRAPH_AXIS_PADDING_TOP = 14;
const GRAPH_AXIS_PADDING_BOTTOM = 26;
const GRAPH_POINT_RADIUS = 5;
const mockSourceButtons = Array.from(document.querySelectorAll('.mock-source-btn')) as HTMLButtonElement[];
const mockSourcePanels = Array.from(document.querySelectorAll('.mock-source-panel')) as HTMLElement[];
const mockTimelineDurationInput = document.getElementById('mock-timeline-duration') as HTMLInputElement | null;
const mockOpenTimelineBtn = document.getElementById('mock-open-timeline-btn') as HTMLButtonElement | null;
const mockBackGraphBtn = document.getElementById('mock-back-graph-btn') as HTMLButtonElement | null;
const mockGraphEditor = document.getElementById('mock-graph-editor') as HTMLDivElement | null;
const mockTimelineEditor = document.getElementById('mock-timeline-editor') as HTMLDivElement | null;
const mockGraphSensorSelect = document.getElementById('mock-graph-sensor') as HTMLSelectElement | null;
const mockGraphYMinInput = document.getElementById('mock-graph-y-min') as HTMLInputElement | null;
const mockGraphYMaxInput = document.getElementById('mock-graph-y-max') as HTMLInputElement | null;
const mockDeletePointBtn = document.getElementById('mock-delete-point-btn') as HTMLButtonElement | null;
const mockGraphCanvas = document.getElementById('mock-graph-canvas') as HTMLCanvasElement | null;
const mockTimelineTracksContainer = document.getElementById('mock-timeline-tracks') as HTMLDivElement | null;
const mockTimelineError = document.getElementById('mock-timeline-error') as HTMLDivElement | null;
const mockTextInput = document.getElementById('sensor-mock-input') as HTMLTextAreaElement | null;
const downloadSessionButton = document.getElementById('download-session') as HTMLButtonElement | null;
const uploadSessionButton = document.getElementById('upload-session') as HTMLButtonElement | null;
const uploadSessionInput = document.getElementById('upload-session-input') as HTMLInputElement | null;

let activeMockSource: MockSource = 'text';
let mockRunStartMs = Date.now();
let mockTimelineConfig: MockTimelineConfig = createDefaultMockTimelineConfig();
let mockTimelineErrorKey: string | null = null;
let activeMockEditorMode: MockEditorMode = 'graph';
let activeGraphSensor: SensorKey = 'ph';
let graphRangeOverrides: Partial<Record<SensorKey, SensorRange>> = {};
let selectedGraphPointIndex: number | null = null;
let graphDragPointIndex: number | null = null;
let graphDidDrag = false;

function postCanvasViewState(): void {
    window.parent.postMessage({
        source: 'hackcable',
        type: 'canvas-view-state',
        darkMode: hackCable.editor.canvas.isDarkMode(),
        gridVisible: hackCable.editor.canvas.isGridVisible(),
    }, '*');
}

type RunControlState = 'needs-compile' | 'compiling' | 'compiled' | 'executing';
let runControlState: RunControlState = 'needs-compile';
let isCompilingCode = false;
let compileOperationId = 0;
let activeCompileCancel: (() => void) | null = null;
let codeMirrorEditor: any = null;
const CODE_EDITOR_MIN_HEIGHT = 220;

function setEsp32RuntimeInputPin(pin: number, value: boolean): void {
    hackCable.emulatorManager.setInputPin(pin, value);
    activeClangShim?.setInputPin(pin, value);
}

function getCodeEditorInput(): HTMLTextAreaElement | null {
    return codeInput instanceof HTMLTextAreaElement ? codeInput : null;
}

function getCodeEditorValue(): string {
    if (codeMirrorEditor) return codeMirrorEditor.getValue();
    const editor = getCodeEditorInput();
    return editor ? editor.value : '';
}

function setCodeEditorValue(nextCode: string): void {
    if (codeMirrorEditor) {
        codeMirrorEditor.setValue(nextCode);
        return;
    }
    const editor = getCodeEditorInput();
    if (!editor) return;
    editor.value = nextCode;
}

function setCodeEditorHeight(nextHeight: number): void {
    if (!codeEditorShell || !codeMirrorEditor) return;
    const maxHeight = Math.max(CODE_EDITOR_MIN_HEIGHT, Math.floor(window.innerHeight * 0.75));
    const clampedHeight = Math.max(CODE_EDITOR_MIN_HEIGHT, Math.min(Math.round(nextHeight), maxHeight));
    codeEditorShell.style.height = `${clampedHeight}px`;
    codeMirrorEditor.setSize(null, clampedHeight);
}

const codeEditorInputEl = getCodeEditorInput();
if (codeEditorInputEl) {
    codeMirrorEditor = CodeMirror.fromTextArea(codeEditorInputEl, {
        mode: 'text/x-c++src',
        theme: 'material-darker',
        lineNumbers: true,
        lineWrapping: false,
        indentUnit: 4,
        tabSize: 4
    });
    codeMirrorEditor.on('change', () => markCompileStale());

    if (codeEditorShell) {
        const currentHeight = codeEditorShell.getBoundingClientRect().height || 260;
        setCodeEditorHeight(currentHeight);
    }
}

codeEditorResizeHandle?.addEventListener('mousedown', (event: MouseEvent) => {
    if (!codeEditorShell || !codeMirrorEditor) return;
    event.preventDefault();

    const startY = event.clientY;
    const startHeight = codeEditorShell.getBoundingClientRect().height;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = moveEvent.clientY - startY;
        setCodeEditorHeight(startHeight + deltaY);
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

window.addEventListener('resize', () => {
    if (!codeEditorShell) return;
    setCodeEditorHeight(codeEditorShell.getBoundingClientRect().height);
});

function setRunControlState(state: RunControlState) {
    if (!(compileButton instanceof HTMLButtonElement) ||
        !(executeButton instanceof HTMLButtonElement) ||
        !(stopButton instanceof HTMLButtonElement) ||
        !(pauseButton instanceof HTMLButtonElement)) {
        return;
    }

    runControlState = state;
    updateCompileButtonMode(state === 'compiling' && activeCompileCancel !== null);

    switch (state) {
        case 'needs-compile':
            compileButton.disabled = false;
            executeButton.disabled = true;
            stopButton.disabled = true;
            pauseButton.disabled = true;
            break;
        case 'compiling':
            compileButton.disabled = false;
            executeButton.disabled = true;
            stopButton.disabled = true;
            pauseButton.disabled = true;
            break;
        case 'compiled':
            compileButton.disabled = false;
            executeButton.disabled = false;
            stopButton.disabled = true;
            pauseButton.disabled = true;
            break;
        case 'executing':
            compileButton.disabled = false;
            executeButton.disabled = false;
            stopButton.disabled = false;
            pauseButton.disabled = false;
            break;
    }
}

function updateCompileButtonMode(isCancel: boolean) {
    if (!(compileButton instanceof HTMLButtonElement)) return;
    compileButton.classList.toggle('is-cancel', isCancel);
    compileButton.title = isCancel ? 'Cancel compile' : 'Compile';
    compileButton.setAttribute('aria-label', isCancel ? 'Cancel compile' : 'Compile');
}

function markCompileStale() {
    if (isCompilingCode) return;
    setRunControlState('needs-compile');
}

function updateCompilerVisibility() {
    if (compilerModeSelect) {
        compilerModeSelect.value = 'clang-llvm';
        compilerModeSelect.hidden = true;
        compilerModeSelect.setAttribute('aria-hidden', 'true');
        compilerModeSelect.style.display = 'none';
    }
}
boardSelectEl?.addEventListener('change', () => {
    activeCompileCancel?.();
    updateCompilerVisibility();
    markCompileStale();
});
compilerModeSelect?.addEventListener('change', () => {
    activeCompileCancel?.();
    markCompileStale();
    if (compilerModeSelect.value !== 'clang-llvm') {
        clangRunner.dispose();
    }
});
updateCompilerVisibility();

if(compileButton && executeButton && stopButton && pauseButton && codeInput instanceof HTMLTextAreaElement && hexInput instanceof HTMLTextAreaElement){

    const code = localStorage.getItem('hackCable-webExample-inputCode');
    if (code) {
        const normalizedCode = normalizeBfarmMacroCode(code);
        if (normalizedCode !== code) {
            localStorage.setItem('hackCable-webExample-inputCode', normalizedCode);
        }
        setCodeEditorValue(normalizedCode);
    }
    const hex = localStorage.getItem('hackCable-webExample-inputHex');
    if(hex) hexInput.value = hex;

    setRunControlState('needs-compile');
    registerSerialDataCallback();

    compileButton.addEventListener("click", () => compile());
    executeButton.addEventListener("click", () => { clearSerial(); execute(); setTimeout(startIOMonitor, 200); });
    buildCircuitFromCodeButton?.addEventListener('click', () => buildCircuitFromCurrentCode());
    clearCodeButton?.addEventListener('click', () => {
        if (!confirm('Clear all code? This action cannot be undone.')) return;
        setCodeEditorValue('');
        codeMirrorEditor?.focus();
    });
    stopButton.addEventListener("click", () => {
        if ((stopButton as HTMLButtonElement).disabled) return;
        hackCable.emulatorManager.stop();
        stopIOMonitor();
        cleanupWasmInstance();
        setRunControlState('compiled');
    });
    pauseButton.addEventListener("click", () => {
        if ((pauseButton as HTMLButtonElement).disabled) return;
        hackCable.emulatorManager.setPaused(!hackCable.emulatorManager.isPosed())
    });

    function compile(){
        if(!(codeInput instanceof HTMLTextAreaElement && hexInput instanceof HTMLTextAreaElement)) return;
        if (isCompilingCode) {
            activeCompileCancel?.();
            return;
        }
        const rawSourceCode = getCodeEditorValue();
        const sourceCode = normalizeBfarmMacroCode(rawSourceCode);
        if (sourceCode !== rawSourceCode) {
            setCodeEditorValue(sourceCode);
        }

        const boardType = hackCable.editor.canvas.getBoardType();
        if (boardType) hackCable.emulatorManager.setBoardType(boardType);

        const currentCompileId = ++compileOperationId;
        const isCurrentCompile = () => currentCompileId === compileOperationId;

        isCompilingCode = true;
        setRunControlState('compiling');
        showStatus('ui.status.compiling', 'info');
        localStorage.setItem('hackCable-webExample-inputCode', sourceCode);

        const onCompileSuccess = () => {
            if (!isCurrentCompile()) return;
            isCompilingCode = false;
            activeCompileCancel = null;
            setRunControlState('compiled');
            showStatus('ui.status.compileComplete', 'success');
        };
        const onCompileFailure = () => {
            if (!isCurrentCompile()) return;
            isCompilingCode = false;
            activeCompileCancel = null;
            setRunControlState('needs-compile');
            showStatus('ui.status.compileFailed', 'error');
        };
        const onCompileCancelled = () => {
            if (!isCurrentCompile()) return;
            isCompilingCode = false;
            activeCompileCancel = null;
            setRunControlState('needs-compile');
            hexInput.value = '// Clang/LLVM compile cancelled. Click Compile to try again.';
            showStatus('ui.status.compileCancelled', 'info');
        };

        if (boardType === 'esp32') {
            // --- CLANG/LLVM IN-BROWSER PATH ---
            const clangAbortController = new AbortController();
            activeCompileCancel = () => {
                ++compileOperationId;
                clangAbortController.abort();
                clangRunner.cancel();
                isCompilingCode = false;
                activeCompileCancel = null;
                lastClangResult = null;
                setRunControlState('needs-compile');
                hexInput.value = '// Clang/LLVM compile cancelled. Click Compile to try again.';
                showStatus('ui.status.compileCancelled', 'info');
            };
            setRunControlState('compiling');
            lastClangResult = null;
            hexInput.value = '// Loading Clang/LLVM (first download ~35 MB)...';
            clangRunner.load((loaded, total, label) => {
                if (!isCurrentCompile()) return;
                if (total > 0) {
                    const pct = Math.round(loaded / total * 100);
                    hexInput.value = `// Downloading ${label}: ${pct}%`;
                }
            }, clangAbortController.signal).then(() => {
                if (!isCurrentCompile()) throw new Error('Stale Clang compile ignored');
                hexInput.value = '// Compiling with Clang/LLVM...';
                return clangRunner.compile(sourceCode, getArduinoHeaders());
            }).then(result => {
                if (!isCurrentCompile()) return;
                if (result.stderr) console.warn('[clang]', result.stderr);
                lastClangResult = result.wasmBytes;
                hexInput.value = '// Clang/LLVM compilation OK. Click Execute.';
                onCompileSuccess();
            }).catch(err => {
                if (!isCurrentCompile()) return;
                if (isClangCancellation(err)) {
                    onCompileCancelled();
                    return;
                }
                hexInput.value = '// Clang/LLVM error:\n' + err.message;
                onCompileFailure();
            }).finally(() => {
                // Keep compiled WASM bytes, release heavyweight compiler worker memory.
                clangRunner.dispose();
            });

        } else {
            // --- ARDUINO AVR PATH ---
            EmulatorManager.compileCode(sourceCode).then((data: CompileResult) => {
                if(data){
                    hexInput.value = data.hex;
                    localStorage.setItem('hackCable-webExample-inputHex', data.hex);
                    onCompileSuccess();
                } else {
                    onCompileFailure();
                }
            }).catch(() => onCompileFailure());
        }
    }

    function execute(){
        if ((executeButton as HTMLButtonElement).disabled) return;
        if (runControlState === 'needs-compile' || runControlState === 'compiling') return;
        registerSerialDataCallback();
        beginSerialPipelineDiagnostics();
        const rawSourceCode = getCodeEditorValue();
        const sourceCode = normalizeBfarmMacroCode(rawSourceCode);
        if (sourceCode !== rawSourceCode) {
            setCodeEditorValue(sourceCode);
            localStorage.setItem('hackCable-webExample-inputCode', sourceCode);
        }

        hackCable.emulatorManager.stop();

        const boardType = hackCable.editor.canvas.getBoardType();
        if (boardType) hackCable.emulatorManager.setBoardType(boardType);

        if(!(hexInput instanceof HTMLTextAreaElement && codeInput instanceof HTMLTextAreaElement)) return;
        showStatus('ui.status.executing', 'info');
        resetMockRunStartTime();
        flushSerialBufferToDom(true);

        if (boardType === 'esp32') {
            // --- CLANG/LLVM EXECUTE ---
            if (!lastClangResult) {
                appendSerial('Error: No compiled WASM. Click Compile first.\n');
                setRunControlState('needs-compile');
                showStatus('ui.status.compileFailed', 'error');
                return;
            }
            setRunControlState('executing');
            cleanupWasmInstance();
            const shim = new ArduinoWasmShim(
                (pin, value) => hackCable.esp32PinUpdate(pin, value),
                (text) => appendSerial(text),
                (slaveId, regAddr) => readBridgeNumber('hackcable_modbus_read', [slaveId, regAddr], 0),
                () => readBridgeNumber('hackcable_sht31_temp', [], 25),
                () => readBridgeNumber('hackcable_sht31_humidity', [], 60),
                () => readBridgeNumber('hackcable_bh1750_lux', [], 500),
                (index) => readBridgeNumber('hackcable_sen55_value', [index], 0),
                (pin) => readBridgeNumber('hackcable_analog_read', [pin], 0),
            );
            activeClangShim = shim;
            WebAssembly.instantiate(lastClangResult, shim.buildImports())
                .then(({ instance }) => {
                    const exp = instance.exports as any;
                    if (exp.memory) shim.setWasmMemory(exp.memory);
                    if (typeof exp.setup === 'function') exp.setup();
                    if (typeof exp.loop === 'function') {
                        activeClangLoopHandle = startFixedStepSimulationLoop(
                            () => {
                                if (shim.isLoopDelayActive()) return;
                                shim.beginLoopFrame();
                                try {
                                    exp.loop();
                                } catch (error) {
                                    shim.clearScheduledPinEvents();
                                    throw error;
                                }
                                shim.finishLoopFrame();
                            },
                            (e) => {
                                if (activeClangLoopHandle !== null) {
                                    clearInterval(activeClangLoopHandle);
                                    activeClangLoopHandle = null;
                                }
                                appendSerial('Runtime error: ' + (e as Error).message + '\n');
                            },
                        );
                    }
                    autoActivateSensorsFromCode(sourceCode);
                    showStatus('ui.status.executing', 'info');
                })
                .catch(err => {
                    appendSerial('WASM load error: ' + err.message + '\n');
                    setRunControlState('compiled');
                    showStatus('ui.status.compileFailed', 'error');
                });

        } else {
            // --- ARDUINO AVR ---
            setRunControlState('executing');
            localStorage.setItem('hackCable-webExample-inputHex', hexInput.value);
            hackCable.emulatorManager.loadCode(hexInput.value);
            hackCable.emulatorManager.run();
        }
    }

    document.addEventListener(HANDYSENSE_REAL_BOARD_CONTROL_EVENT, (event: Event) => {
        const controlEvent = event as CustomEvent<HandysenseRealBoardControlDetail>;
        const detail = controlEvent.detail;
        if (!detail) return;

        if (detail.control === 'reset') {
            clearSerial();
            execute();
            setTimeout(startIOMonitor, 200);
            return;
        }

        const pin = HANDYSENSE_REAL_RUNTIME_INPUT_PINS[detail.control];
        setEsp32RuntimeInputPin(pin, detail.pressed ? false : true);
    });
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

type EditorTabName = 'code' | 'mock';

function switchEditorTab(tabName: EditorTabName) {
    document.querySelectorAll('.editor-tab-btn').forEach((btn) => {
        const isActive = (btn as HTMLElement).dataset.editorTab === tabName;
        btn.classList.toggle('active', isActive);
    });

    document.querySelectorAll('.editor-tab-panel').forEach((panel) => {
        const isActive = (panel as HTMLElement).dataset.editorPanel === tabName;
        panel.classList.toggle('active', isActive);
        (panel as HTMLElement).hidden = !isActive;
    });
}

document.querySelectorAll('.editor-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.editorTab as EditorTabName | undefined;
        if (!tab) return;
        switchEditorTab(tab);
    });
});

// Default active tab: Code
switchEditorTab('code');

function translateUi(key: string): string {
    const i18n = (window as any).i18next;
    if (!i18n || typeof i18n.t !== 'function') return key;
    return String(i18n.t(key));
}

function createEmptyTimelineTracks(): Record<SensorKey, MockSegment[]> {
    return SENSOR_KEYS.reduce((acc, key) => {
        acc[key] = [];
        return acc;
    }, {} as Record<SensorKey, MockSegment[]>);
}

function createDefaultMockTimelineConfig(): MockTimelineConfig {
    return {
        durationSec: DEFAULT_MOCK_TIMELINE_DURATION_SEC,
        tracks: createEmptyTimelineTracks(),
    };
}

function getDefaultSensorRange(sensorKey: SensorKey): SensorRange {
    const preset = SENSOR_DEFAULT_RANGES[sensorKey];
    return { min: preset.min, max: preset.max };
}

function getSensorRange(sensorKey: SensorKey): SensorRange {
    const override = graphRangeOverrides[sensorKey];
    if (!override) return getDefaultSensorRange(sensorKey);
    if (!Number.isFinite(override.min) || !Number.isFinite(override.max) || override.min >= override.max) {
        return getDefaultSensorRange(sensorKey);
    }
    return { min: override.min, max: override.max };
}

function clampToSensorRange(sensorKey: SensorKey, value: number): number {
    const range = getSensorRange(sensorKey);
    return Math.max(range.min, Math.min(range.max, value));
}

function snapTimeSec(rawValue: number, durationSec: number): number {
    if (!Number.isFinite(rawValue)) return 0;
    const maxTime = Math.max(0, durationSec - GRAPH_TIME_SNAP_SEC);
    const clamped = Math.max(0, Math.min(maxTime, rawValue));
    return roundSeconds(Math.round(clamped / GRAPH_TIME_SNAP_SEC) * GRAPH_TIME_SNAP_SEC);
}

function normalizeGraphPoints(points: GraphPoint[], sensorKey: SensorKey): GraphPoint[] {
    const dedup = new Map<number, GraphPoint>();
    points.forEach((point) => {
        const tSec = snapTimeSec(point.tSec, mockTimelineConfig.durationSec);
        dedup.set(tSec, { tSec, value: clampToSensorRange(sensorKey, point.value) });
    });
    return Array.from(dedup.values()).sort((a, b) => a.tSec - b.tSec);
}

function segmentsToGraphPoints(sensorKey: SensorKey): GraphPoint[] {
    const segments = [...mockTimelineConfig.tracks[sensorKey]].sort((a, b) => a.startSec - b.startSec);
    const points: GraphPoint[] = segments.map((segment) => ({ tSec: segment.startSec, value: segment.value }));
    return normalizeGraphPoints(points, sensorKey);
}

function graphPointsToSegments(sensorKey: SensorKey, rawPoints: GraphPoint[]): MockSegment[] {
    const points = normalizeGraphPoints(rawPoints, sensorKey);
    if (points.length === 0) return [];

    const segments: MockSegment[] = [];
    for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[i + 1];
        const startSec = current.tSec;
        const endSec = next ? next.tSec : mockTimelineConfig.durationSec;
        if (endSec <= startSec) continue;
        segments.push({
            startSec: roundSeconds(startSec),
            endSec: roundSeconds(endSec),
            value: clampToSensorRange(sensorKey, current.value),
        });
    }
    return segments;
}

function saveMockGraphUiPrefs() {
    const payload = getMockGraphUiPrefs();
    localStorage.setItem(MOCK_GRAPH_UI_STORAGE_KEY, JSON.stringify(payload));
}

function getMockGraphUiPrefs(): MockGraphUiPrefs {
    return {
        selectedSensor: activeGraphSensor,
        editorMode: activeMockEditorMode,
        yRanges: graphRangeOverrides,
    };
}

function applyMockGraphUiPrefs(raw: unknown) {
    if (!raw || typeof raw !== 'object') return;
    const parsed = raw as {
        selectedSensor?: string;
        editorMode?: string;
        yRanges?: Record<string, { min?: unknown; max?: unknown }>;
    };
    if (parsed.selectedSensor && isSensorKey(parsed.selectedSensor)) {
        activeGraphSensor = parsed.selectedSensor;
    }
    if (parsed.editorMode === 'graph' || parsed.editorMode === 'timeline') {
        activeMockEditorMode = parsed.editorMode;
    }
    if (parsed.yRanges && typeof parsed.yRanges === 'object') {
        const nextRanges: Partial<Record<SensorKey, SensorRange>> = {};
        SENSOR_KEYS.forEach((sensorKey) => {
            const candidate = parsed.yRanges?.[sensorKey];
            if (!candidate) return;
            const min = asFiniteNumber(candidate.min);
            const max = asFiniteNumber(candidate.max);
            if (min === null || max === null || min >= max) return;
            nextRanges[sensorKey] = { min, max };
        });
        graphRangeOverrides = nextRanges;
    }
}

function loadMockGraphUiPrefs() {
    const raw = localStorage.getItem(MOCK_GRAPH_UI_STORAGE_KEY);
    if (!raw) return;
    try {
        applyMockGraphUiPrefs(JSON.parse(raw));
    } catch {
        // Ignore corrupt storage payload.
    }
}

function setActiveMockEditorMode(mode: MockEditorMode, persist = true) {
    activeMockEditorMode = mode;
    if (mockGraphEditor) mockGraphEditor.hidden = mode !== 'graph';
    if (mockTimelineEditor) mockTimelineEditor.hidden = mode !== 'timeline';
    if (mockOpenTimelineBtn) mockOpenTimelineBtn.hidden = mode === 'timeline';
    if (mockBackGraphBtn) mockBackGraphBtn.hidden = mode !== 'timeline';
    if (persist) saveMockGraphUiPrefs();
}

function setActiveGraphSensor(sensorKey: SensorKey, persist = true) {
    activeGraphSensor = sensorKey;
    selectedGraphPointIndex = null;
    if (mockGraphSensorSelect) mockGraphSensorSelect.value = sensorKey;
    const range = getSensorRange(sensorKey);
    if (mockGraphYMinInput) mockGraphYMinInput.value = String(range.min);
    if (mockGraphYMaxInput) mockGraphYMaxInput.value = String(range.max);
    if (persist) saveMockGraphUiPrefs();
}

function setSelectedGraphPoint(index: number | null) {
    selectedGraphPointIndex = index;
    if (mockDeletePointBtn) mockDeletePointBtn.disabled = index === null;
}

function updateTrackFromGraphPoints(sensorKey: SensorKey, points: GraphPoint[]): boolean {
    const segments = graphPointsToSegments(sensorKey, points);
    const ok = updateTrackSegments(sensorKey, segments);
    if (!ok) return false;
    setMockTimelineError(null);
    const normalized = normalizeGraphPoints(points, sensorKey);
    if (selectedGraphPointIndex !== null && selectedGraphPointIndex >= normalized.length) {
        setSelectedGraphPoint(normalized.length > 0 ? normalized.length - 1 : null);
    }
    return true;
}

function updateGraphPoint(sensorKey: SensorKey, index: number, nextPoint: GraphPoint): boolean {
    const points = segmentsToGraphPoints(sensorKey);
    if (!points[index]) return false;
    points[index] = nextPoint;
    const ok = updateTrackFromGraphPoints(sensorKey, points);
    if (!ok) return false;
    const refreshed = segmentsToGraphPoints(sensorKey);
    const snappedT = snapTimeSec(nextPoint.tSec, mockTimelineConfig.durationSec);
    const newIndex = refreshed.findIndex((point) => point.tSec === snappedT);
    setSelectedGraphPoint(newIndex >= 0 ? newIndex : null);
    return true;
}

function addOrReplaceGraphPoint(sensorKey: SensorKey, nextPoint: GraphPoint): boolean {
    const points = segmentsToGraphPoints(sensorKey);
    const snappedT = snapTimeSec(nextPoint.tSec, mockTimelineConfig.durationSec);
    const existingIndex = points.findIndex((point) => point.tSec === snappedT);
    if (existingIndex >= 0) {
        points[existingIndex] = { tSec: snappedT, value: nextPoint.value };
    } else {
        points.push({ tSec: snappedT, value: nextPoint.value });
    }
    const ok = updateTrackFromGraphPoints(sensorKey, points);
    if (!ok) return false;
    const refreshed = segmentsToGraphPoints(sensorKey);
    const selectedIndex = refreshed.findIndex((point) => point.tSec === snappedT);
    setSelectedGraphPoint(selectedIndex >= 0 ? selectedIndex : null);
    return true;
}

function deleteSelectedGraphPoint() {
    if (selectedGraphPointIndex === null) return;
    const points = segmentsToGraphPoints(activeGraphSensor);
    if (!points[selectedGraphPointIndex]) {
        setSelectedGraphPoint(null);
        return;
    }
    points.splice(selectedGraphPointIndex, 1);
    if (!updateTrackFromGraphPoints(activeGraphSensor, points)) return;
    setSelectedGraphPoint(null);
}

function resetMockRunStartTime() {
    mockRunStartMs = Date.now();
}

function readBridgeNumber(bridgeName: string, args: number[], fallback: number): number {
    const bridge = (window as any)[bridgeName];
    if (typeof bridge !== 'function') return fallback;
    const value = Number(bridge(...args));
    return Number.isFinite(value) ? value : fallback;
}

function asFiniteNumber(value: unknown): number | null {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : null;
}

function roundSeconds(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function getMockTextValue(): string {
    return mockTextInput?.value ?? '';
}

function setMockTextValue(nextText: string): void {
    if (!mockTextInput) return;
    mockTextInput.value = nextText;
}

function saveMockTextValue(): void {
    localStorage.setItem(MOCK_TEXT_STORAGE_KEY, getMockTextValue());
}

function getCircuitSessionSnapshot(): CircuitSessionFile {
    return {
        version: 1,
        app: 'hackcable-circuit-session',
        savedAt: new Date().toISOString(),
        board: normalizeBoardSelection(boardSelect?.value ?? localStorage.getItem('hackCable-selectedBoard')),
        code: getCodeEditorValue(),
        circuit: hackCable.editor.getEditorSaveData(),
        mock: {
            source: activeMockSource,
            text: getMockTextValue(),
            timelineConfig: normalizeMockTimelineConfig(mockTimelineConfig),
            graphUiPrefs: getMockGraphUiPrefs(),
        },
    };
}

function isEditorSaveData(value: unknown): value is EditorSaveData {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<EditorSaveData>;
    return Array.isArray(candidate.figures) && Array.isArray(candidate.connections)
        && (candidate.standaloneLines === undefined || Array.isArray(candidate.standaloneLines));
}

function isCircuitSessionFile(value: unknown): value is CircuitSessionFile {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<CircuitSessionFile>;
    return candidate.version === 1
        && candidate.app === 'hackcable-circuit-session'
        && typeof candidate.savedAt === 'string'
        && typeof candidate.board === 'string'
        && typeof candidate.code === 'string'
        && isEditorSaveData(candidate.circuit)
        && !!candidate.mock
        && typeof candidate.mock === 'object';
}

function applyImportedMockState(rawMock: unknown): void {
    const mock = rawMock && typeof rawMock === 'object'
        ? rawMock as Partial<CircuitSessionMockState>
        : {};

    activeMockSource = mock.source === 'timeline' ? 'timeline' : 'text';
    mockTimelineConfig = normalizeMockTimelineConfig(mock.timelineConfig);
    graphRangeOverrides = {};
    activeGraphSensor = 'ph';
    activeMockEditorMode = 'graph';
    applyMockGraphUiPrefs(mock.graphUiPrefs);
    setMockTextValue(typeof mock.text === 'string' ? mock.text : '');
    saveMockTextValue();
    saveMockTimelineConfig();
    saveMockSource();
    saveMockGraphUiPrefs();
    setActiveMockSource(activeMockSource, false);
    setActiveGraphSensor(activeGraphSensor, false);
    setActiveMockEditorMode(activeMockEditorMode, false);
    renderMockEditors();
    setSelectedGraphPoint(null);
    setMockTimelineError(null);
}

function applyImportedCircuitSession(session: CircuitSessionFile): void {
    const normalizedBoard = normalizeBoardSelection(session.board);
    selectBoardForExample(normalizedBoard);
    hackCable.editor.loadEditorSaveData(session.circuit);
    localStorage.setItem('savedEditor', JSON.stringify(session.circuit));

    setCodeEditorValue(session.code);
    localStorage.setItem('hackCable-webExample-inputCode', session.code);
    markCompileStale();

    applyImportedMockState(session.mock);
}

function downloadCircuitSession(): void {
    const snapshot = getCircuitSessionSnapshot();
    const stamp = snapshot.savedAt.replace(/[:.]/g, '-');
    const fileName = `hackcable-circuit-session-${stamp}.json`;
    const fileText = JSON.stringify(snapshot, null, 2);
    const pickerWindow = window as Window & {
        showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<SaveFileHandle>;
    };

    const fallbackDownload = () => {
        const blob = new Blob([fileText], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
        showPlainStatus('Circuit session downloaded.', 'success', 2500);
    };

    const saveFilePicker = pickerWindow.showSaveFilePicker;
    if (!saveFilePicker) {
        fallbackDownload();
        return;
    }

    void (async () => {
        try {
            const handle = await saveFilePicker({
                suggestedName: fileName,
                types: [
                    {
                        description: 'HackCable circuit session',
                        accept: {
                            'application/json': ['.json'],
                        },
                    },
                ],
            });
            const writable = await handle.createWritable();
            await writable.write(fileText);
            await writable.close();
            showPlainStatus('Circuit session saved.', 'success', 2500);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                showPlainStatus('Save cancelled.', 'info', 2000);
                return;
            }
            fallbackDownload();
        }
    })();
}

function importCircuitSessionFromText(rawText: string): void {
    if (!rawText.trim()) {
        throw new Error('The selected file is empty.');
    }
    const parsed = JSON.parse(rawText);
    if (!isCircuitSessionFile(parsed)) {
        throw new Error('Invalid session file format.');
    }
    applyImportedCircuitSession(parsed);
    showPlainStatus('Circuit session restored successfully.', 'success', 3500);
}

function normalizeMockTimelineConfig(raw: unknown): MockTimelineConfig {
    const fallback = createDefaultMockTimelineConfig();
    if (!raw || typeof raw !== 'object') return fallback;

    const rawObj = raw as { durationSec?: unknown; tracks?: unknown };
    const parsedDuration = asFiniteNumber(rawObj.durationSec);
    const durationSec = parsedDuration !== null && parsedDuration > 0 ? roundSeconds(parsedDuration) : fallback.durationSec;
    const tracks = createEmptyTimelineTracks();

    const rawTracks = rawObj.tracks;
    if (!rawTracks || typeof rawTracks !== 'object') {
        return { durationSec, tracks };
    }

    SENSOR_KEYS.forEach((key) => {
        const maybeList = (rawTracks as Record<string, unknown>)[key];
        if (!Array.isArray(maybeList)) return;
        const parsed: MockSegment[] = [];
        for (const item of maybeList) {
            if (!item || typeof item !== 'object') continue;
            const rawSeg = item as { startSec?: unknown; endSec?: unknown; value?: unknown };
            const startSec = asFiniteNumber(rawSeg.startSec);
            const endSec = asFiniteNumber(rawSeg.endSec);
            const value = asFiniteNumber(rawSeg.value);
            if (startSec === null || endSec === null || value === null) continue;
            if (startSec < 0 || endSec > durationSec || startSec >= endSec) continue;
            parsed.push({
                startSec: roundSeconds(startSec),
                endSec: roundSeconds(endSec),
                value,
            });
        }
        parsed.sort((a, b) => a.startSec - b.startSec);
        const filtered: MockSegment[] = [];
        parsed.forEach((segment) => {
            const prev = filtered[filtered.length - 1];
            if (!prev || segment.startSec >= prev.endSec) filtered.push(segment);
        });
        tracks[key] = filtered;
    });

    return { durationSec, tracks };
}

function setMockTimelineError(errorKey: string | null): void {
    mockTimelineErrorKey = errorKey;
    if (!mockTimelineError) return;
    if (!errorKey) {
        mockTimelineError.hidden = true;
        mockTimelineError.textContent = '';
        return;
    }
    mockTimelineError.hidden = false;
    mockTimelineError.textContent = translateUi(errorKey);
}

function validateTrackSegments(segments: MockSegment[], durationSec: number): string | null {
    const sorted = [...segments].sort((a, b) => a.startSec - b.startSec);
    let prevEnd = -1;
    for (const segment of sorted) {
        if (!Number.isFinite(segment.startSec) || !Number.isFinite(segment.endSec) || !Number.isFinite(segment.value)) {
            return 'ui.mock.timeline.error.numeric';
        }
        if (segment.startSec < 0 || segment.endSec > durationSec || segment.startSec >= segment.endSec) {
            return 'ui.mock.timeline.error.range';
        }
        if (prevEnd >= 0 && segment.startSec < prevEnd) {
            return 'ui.mock.timeline.error.overlap';
        }
        prevEnd = segment.endSec;
    }
    return null;
}

function validateTimelineConfig(config: MockTimelineConfig): string | null {
    if (!Number.isFinite(config.durationSec) || config.durationSec <= 0) {
        return 'ui.mock.timeline.error.duration';
    }
    for (const key of SENSOR_KEYS) {
        const error = validateTrackSegments(config.tracks[key], config.durationSec);
        if (error) return error;
    }
    return null;
}

function saveMockTimelineConfig() {
    localStorage.setItem(MOCK_TIMELINE_STORAGE_KEY, JSON.stringify(mockTimelineConfig));
}

function saveMockSource() {
    localStorage.setItem(MOCK_SOURCE_STORAGE_KEY, activeMockSource);
}

function setActiveMockSource(source: MockSource, persist = true) {
    activeMockSource = source;
    mockSourceButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.mockSource === source);
    });
    mockSourcePanels.forEach((panel) => {
        const isActive = panel.dataset.mockSourcePanel === source;
        panel.hidden = !isActive;
    });
    if (source === 'timeline') {
        requestAnimationFrame(() => renderMockGraphEditor());
    } else {
        graphDragPointIndex = null;
    }
    if (persist) saveMockSource();
}

function updateTimelineDuration(nextDuration: number): boolean {
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) {
        setMockTimelineError('ui.mock.timeline.error.duration');
        return false;
    }
    const durationSec = roundSeconds(nextDuration);
    const nextConfig: MockTimelineConfig = {
        durationSec,
        tracks: createEmptyTimelineTracks(),
    };
    SENSOR_KEYS.forEach((key) => {
        nextConfig.tracks[key] = mockTimelineConfig.tracks[key]
            .filter((segment) => segment.startSec < durationSec)
            .map((segment) => ({
                startSec: roundSeconds(segment.startSec),
                endSec: roundSeconds(Math.min(segment.endSec, durationSec)),
                value: segment.value,
            }))
            .filter((segment) => segment.endSec > segment.startSec);
    });
    const error = validateTimelineConfig(nextConfig);
    if (error) {
        setMockTimelineError(error);
        return false;
    }
    mockTimelineConfig = nextConfig;
    setMockTimelineError(null);
    saveMockTimelineConfig();
    renderMockEditors();
    return true;
}

function updateTrackSegments(sensorKey: SensorKey, nextSegments: MockSegment[]): boolean {
    const cleaned = nextSegments.map((segment) => ({
        startSec: roundSeconds(segment.startSec),
        endSec: roundSeconds(segment.endSec),
        value: segment.value,
    }));
    const error = validateTrackSegments(cleaned, mockTimelineConfig.durationSec);
    if (error) {
        setMockTimelineError(error);
        return false;
    }
    mockTimelineConfig.tracks[sensorKey] = cleaned.sort((a, b) => a.startSec - b.startSec);
    setMockTimelineError(null);
    saveMockTimelineConfig();
    renderMockEditors();
    return true;
}

function addSegment(sensorKey: SensorKey) {
    const segments = [...mockTimelineConfig.tracks[sensorKey]].sort((a, b) => a.startSec - b.startSec);
    const duration = mockTimelineConfig.durationSec;
    let start = 0;
    for (const segment of segments) {
        if (segment.startSec - start >= 1) break;
        start = segment.endSec;
    }
    const end = Math.min(duration, roundSeconds(start + 1));
    if (end <= start) {
        setMockTimelineError('ui.mock.timeline.error.noRoom');
        return;
    }
    const nextSegments = [...segments, { startSec: roundSeconds(start), endSec: end, value: 0 }];
    updateTrackSegments(sensorKey, nextSegments);
}

function updateSegmentField(sensorKey: SensorKey, index: number, field: keyof MockSegment, value: number): boolean {
    const nextSegments = mockTimelineConfig.tracks[sensorKey].map((segment) => ({ ...segment }));
    const target = nextSegments[index];
    if (!target) return false;
    target[field] = value;
    return updateTrackSegments(sensorKey, nextSegments);
}

function deleteSegment(sensorKey: SensorKey, index: number): void {
    const nextSegments = mockTimelineConfig.tracks[sensorKey].filter((_segment, segmentIndex) => segmentIndex !== index);
    updateTrackSegments(sensorKey, nextSegments);
}

function renderMockTimelineTracks() {
    if (!mockTimelineTracksContainer) return;
    mockTimelineTracksContainer.innerHTML = '';
    if (mockTimelineDurationInput) mockTimelineDurationInput.value = String(mockTimelineConfig.durationSec);

    SENSOR_KEYS.forEach((sensorKey) => {
        const row = document.createElement('section');
        row.className = 'mock-timeline-track';

        const header = document.createElement('div');
        header.className = 'mock-timeline-track-header';

        const title = document.createElement('h4');
        title.className = 'mock-timeline-track-title';
        title.textContent = translateUi(SENSOR_LABEL_KEYS[sensorKey]);

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'mock-timeline-add-btn';
        addButton.textContent = translateUi('ui.mock.timeline.addSegment');
        addButton.addEventListener('click', () => addSegment(sensorKey));

        header.appendChild(title);
        header.appendChild(addButton);
        row.appendChild(header);

        const axis = document.createElement('div');
        axis.className = 'mock-timeline-track-axis';
        const segments = [...mockTimelineConfig.tracks[sensorKey]].sort((a, b) => a.startSec - b.startSec);
        segments.forEach((segment) => {
            const bar = document.createElement('div');
            bar.className = 'mock-timeline-segment-bar';
            const left = (segment.startSec / mockTimelineConfig.durationSec) * 100;
            const width = ((segment.endSec - segment.startSec) / mockTimelineConfig.durationSec) * 100;
            bar.style.left = `${Math.max(0, left)}%`;
            bar.style.width = `${Math.max(1.5, width)}%`;
            bar.textContent = String(segment.value);
            bar.title = `${segment.startSec}-${segment.endSec}s = ${segment.value}`;
            axis.appendChild(bar);
        });
        row.appendChild(axis);

        const list = document.createElement('div');
        list.className = 'mock-timeline-segment-list';
        if (segments.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'mock-timeline-empty';
            empty.textContent = translateUi('ui.mock.timeline.noSegments');
            list.appendChild(empty);
        }

        segments.forEach((segment, index) => {
            const item = document.createElement('div');
            item.className = 'mock-timeline-segment-item';

            const startInput = document.createElement('input');
            startInput.type = 'number';
            startInput.step = '0.1';
            startInput.min = '0';
            startInput.max = String(mockTimelineConfig.durationSec);
            startInput.value = String(segment.startSec);
            startInput.addEventListener('change', () => {
                const value = asFiniteNumber(startInput.value);
                if (value === null) {
                    setMockTimelineError('ui.mock.timeline.error.numeric');
                    renderMockEditors();
                    return;
                }
                if (!updateSegmentField(sensorKey, index, 'startSec', value)) {
                    renderMockEditors();
                }
            });

            const endInput = document.createElement('input');
            endInput.type = 'number';
            endInput.step = '0.1';
            endInput.min = '0';
            endInput.max = String(mockTimelineConfig.durationSec);
            endInput.value = String(segment.endSec);
            endInput.addEventListener('change', () => {
                const value = asFiniteNumber(endInput.value);
                if (value === null) {
                    setMockTimelineError('ui.mock.timeline.error.numeric');
                    renderMockEditors();
                    return;
                }
                if (!updateSegmentField(sensorKey, index, 'endSec', value)) {
                    renderMockEditors();
                }
            });

            const valueInput = document.createElement('input');
            valueInput.type = 'number';
            valueInput.step = '0.1';
            valueInput.value = String(segment.value);
            valueInput.addEventListener('change', () => {
                const value = asFiniteNumber(valueInput.value);
                if (value === null) {
                    setMockTimelineError('ui.mock.timeline.error.numeric');
                    renderMockEditors();
                    return;
                }
                if (!updateSegmentField(sensorKey, index, 'value', value)) {
                    renderMockEditors();
                }
            });

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'mock-timeline-delete-btn';
            deleteButton.textContent = translateUi('ui.mock.timeline.deleteSegment');
            deleteButton.addEventListener('click', () => deleteSegment(sensorKey, index));

            item.append(startInput, endInput, valueInput, deleteButton);
            list.appendChild(item);
        });

        row.appendChild(list);
        mockTimelineTracksContainer.appendChild(row);
    });
}

function populateMockGraphSensorOptions() {
    if (!mockGraphSensorSelect) return;
    mockGraphSensorSelect.innerHTML = '';
    SENSOR_KEYS.forEach((sensorKey) => {
        const option = document.createElement('option');
        option.value = sensorKey;
        option.textContent = translateUi(SENSOR_LABEL_KEYS[sensorKey]);
        mockGraphSensorSelect.appendChild(option);
    });
    mockGraphSensorSelect.value = activeGraphSensor;
}

type GraphCanvasMetrics = {
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
    plotWidth: number;
    plotHeight: number;
    range: SensorRange;
};

function getGraphCanvasMetrics(): GraphCanvasMetrics | null {
    if (!mockGraphCanvas) return null;
    const rect = mockGraphCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.max(320, Math.floor(rect.width || mockGraphCanvas.clientWidth || 640));
    const cssHeight = Math.max(180, Math.floor(rect.height || mockGraphCanvas.clientHeight || 240));
    const pixelWidth = Math.floor(cssWidth * dpr);
    const pixelHeight = Math.floor(cssHeight * dpr);
    if (mockGraphCanvas.width !== pixelWidth || mockGraphCanvas.height !== pixelHeight) {
        mockGraphCanvas.width = pixelWidth;
        mockGraphCanvas.height = pixelHeight;
    }
    const left = GRAPH_AXIS_PADDING_LEFT * dpr;
    const right = GRAPH_AXIS_PADDING_RIGHT * dpr;
    const top = GRAPH_AXIS_PADDING_TOP * dpr;
    const bottom = GRAPH_AXIS_PADDING_BOTTOM * dpr;
    return {
        width: pixelWidth,
        height: pixelHeight,
        left,
        right,
        top,
        bottom,
        plotWidth: Math.max(20, pixelWidth - left - right),
        plotHeight: Math.max(20, pixelHeight - top - bottom),
        range: getSensorRange(activeGraphSensor),
    };
}

function graphTimeToX(timeSec: number, metrics: GraphCanvasMetrics): number {
    if (mockTimelineConfig.durationSec <= 0) return metrics.left;
    const ratio = Math.max(0, Math.min(1, timeSec / mockTimelineConfig.durationSec));
    return metrics.left + ratio * metrics.plotWidth;
}

function graphValueToY(value: number, metrics: GraphCanvasMetrics): number {
    const span = metrics.range.max - metrics.range.min || 1;
    const clamped = Math.max(metrics.range.min, Math.min(metrics.range.max, value));
    const ratio = (clamped - metrics.range.min) / span;
    return metrics.top + (1 - ratio) * metrics.plotHeight;
}

function graphXToTime(x: number, metrics: GraphCanvasMetrics): number {
    const ratio = Math.max(0, Math.min(1, (x - metrics.left) / metrics.plotWidth));
    return ratio * mockTimelineConfig.durationSec;
}

function graphYToValue(y: number, metrics: GraphCanvasMetrics): number {
    const ratio = Math.max(0, Math.min(1, 1 - (y - metrics.top) / metrics.plotHeight));
    return metrics.range.min + ratio * (metrics.range.max - metrics.range.min);
}

function getCanvasEventPosition(event: MouseEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
    };
}

function findGraphPointIndexAt(x: number, y: number, points: GraphPoint[], metrics: GraphCanvasMetrics): number | null {
    const radius = GRAPH_POINT_RADIUS * (window.devicePixelRatio || 1) + 4;
    for (let i = points.length - 1; i >= 0; i--) {
        const px = graphTimeToX(points[i].tSec, metrics);
        const py = graphValueToY(points[i].value, metrics);
        const dx = px - x;
        const dy = py - y;
        if (dx * dx + dy * dy <= radius * radius) return i;
    }
    return null;
}

function renderMockGraphEditor() {
    if (!mockGraphCanvas) return;
    const metrics = getGraphCanvasMetrics();
    if (!metrics) return;
    const ctx = mockGraphCanvas.getContext('2d');
    if (!ctx) return;

    const points = segmentsToGraphPoints(activeGraphSensor);
    if (mockDeletePointBtn) {
        mockDeletePointBtn.disabled = selectedGraphPointIndex === null || !points[selectedGraphPointIndex];
    }

    ctx.clearRect(0, 0, metrics.width, metrics.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, metrics.width, metrics.height);

    ctx.strokeStyle = 'rgba(148,163,184,0.28)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const x = metrics.left + (i / 4) * metrics.plotWidth;
        ctx.beginPath();
        ctx.moveTo(x, metrics.top);
        ctx.lineTo(x, metrics.top + metrics.plotHeight);
        ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
        const y = metrics.top + (i / 4) * metrics.plotHeight;
        ctx.beginPath();
        ctx.moveTo(metrics.left, y);
        ctx.lineTo(metrics.left + metrics.plotWidth, y);
        ctx.stroke();
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(metrics.left, metrics.top + metrics.plotHeight);
    ctx.lineTo(metrics.left + metrics.plotWidth, metrics.top + metrics.plotHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(metrics.left, metrics.top);
    ctx.lineTo(metrics.left, metrics.top + metrics.plotHeight);
    ctx.stroke();

    const xLabelY = metrics.top + metrics.plotHeight + 16 * (window.devicePixelRatio || 1);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${11 * (window.devicePixelRatio || 1)}px sans-serif`;
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
        const timeVal = roundSeconds((i / 4) * mockTimelineConfig.durationSec);
        const x = metrics.left + (i / 4) * metrics.plotWidth;
        ctx.fillText(`${timeVal}s`, x, xLabelY);
    }
    ctx.textAlign = 'right';
    ctx.fillText(String(roundSeconds(metrics.range.max)), metrics.left - 6 * (window.devicePixelRatio || 1), metrics.top + 10 * (window.devicePixelRatio || 1));
    ctx.fillText(String(roundSeconds(metrics.range.min)), metrics.left - 6 * (window.devicePixelRatio || 1), metrics.top + metrics.plotHeight);

    if (points.length > 0) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const first = points[0];
        ctx.moveTo(graphTimeToX(first.tSec, metrics), graphValueToY(first.value, metrics));
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const next = points[i];
            const nextX = graphTimeToX(next.tSec, metrics);
            ctx.lineTo(nextX, graphValueToY(prev.value, metrics));
            ctx.lineTo(nextX, graphValueToY(next.value, metrics));
        }
        const last = points[points.length - 1];
        const endX = graphTimeToX(mockTimelineConfig.durationSec, metrics);
        ctx.lineTo(endX, graphValueToY(last.value, metrics));
        ctx.stroke();
    }

    points.forEach((point, index) => {
        const x = graphTimeToX(point.tSec, metrics);
        const y = graphValueToY(point.value, metrics);
        ctx.beginPath();
        ctx.arc(x, y, GRAPH_POINT_RADIUS * (window.devicePixelRatio || 1), 0, Math.PI * 2);
        const isSelected = index === selectedGraphPointIndex;
        ctx.fillStyle = isSelected ? '#fbbf24' : '#38bdf8';
        ctx.fill();
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeStyle = isSelected ? '#f59e0b' : '#0f172a';
        ctx.stroke();
    });
}

function renderMockEditors() {
    renderMockTimelineTracks();
    populateMockGraphSensorOptions();
    renderMockGraphEditor();
}

function initializeMockControls() {
    const savedSource = localStorage.getItem(MOCK_SOURCE_STORAGE_KEY);
    if (savedSource === 'text' || savedSource === 'timeline') {
        activeMockSource = savedSource;
    }

    const savedText = localStorage.getItem(MOCK_TEXT_STORAGE_KEY);
    if (savedText !== null) {
        setMockTextValue(savedText);
    } else {
        saveMockTextValue();
    }

    const rawTimeline = localStorage.getItem(MOCK_TIMELINE_STORAGE_KEY);
    if (rawTimeline) {
        try {
            mockTimelineConfig = normalizeMockTimelineConfig(JSON.parse(rawTimeline));
        } catch {
            mockTimelineConfig = createDefaultMockTimelineConfig();
        }
    }

    loadMockGraphUiPrefs();
    setActiveMockSource(activeMockSource, false);
    setActiveGraphSensor(activeGraphSensor, false);
    setActiveMockEditorMode(activeMockEditorMode, false);
    renderMockEditors();
    setSelectedGraphPoint(null);
    setMockTimelineError(null);
}

mockTextInput?.addEventListener('input', () => {
    saveMockTextValue();
});

mockSourceButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const source = button.dataset.mockSource;
        if (source !== 'text' && source !== 'timeline') return;
        setActiveMockSource(source);
    });
});

mockTimelineDurationInput?.addEventListener('change', () => {
    const nextDuration = asFiniteNumber(mockTimelineDurationInput.value);
    if (nextDuration === null) {
        setMockTimelineError('ui.mock.timeline.error.numeric');
        renderMockEditors();
        return;
    }
    if (!updateTimelineDuration(nextDuration)) {
        renderMockEditors();
    }
});

mockOpenTimelineBtn?.addEventListener('click', () => {
    setActiveMockEditorMode('timeline');
});

mockBackGraphBtn?.addEventListener('click', () => {
    setActiveMockEditorMode('graph');
    renderMockGraphEditor();
});

mockGraphSensorSelect?.addEventListener('change', () => {
    const value = mockGraphSensorSelect.value;
    if (!isSensorKey(value)) return;
    setActiveGraphSensor(value);
    renderMockGraphEditor();
});

mockGraphYMinInput?.addEventListener('change', () => {
    const nextMin = asFiniteNumber(mockGraphYMinInput.value);
    const current = getSensorRange(activeGraphSensor);
    if (nextMin === null || nextMin >= current.max) {
        setMockTimelineError('ui.mock.timeline.error.range');
        setActiveGraphSensor(activeGraphSensor, false);
        renderMockGraphEditor();
        return;
    }
    graphRangeOverrides[activeGraphSensor] = { min: nextMin, max: current.max };
    setMockTimelineError(null);
    saveMockGraphUiPrefs();
    renderMockEditors();
});

mockGraphYMaxInput?.addEventListener('change', () => {
    const nextMax = asFiniteNumber(mockGraphYMaxInput.value);
    const current = getSensorRange(activeGraphSensor);
    if (nextMax === null || nextMax <= current.min) {
        setMockTimelineError('ui.mock.timeline.error.range');
        setActiveGraphSensor(activeGraphSensor, false);
        renderMockGraphEditor();
        return;
    }
    graphRangeOverrides[activeGraphSensor] = { min: current.min, max: nextMax };
    setMockTimelineError(null);
    saveMockGraphUiPrefs();
    renderMockEditors();
});

mockDeletePointBtn?.addEventListener('click', () => {
    deleteSelectedGraphPoint();
});

mockGraphCanvas?.addEventListener('mousedown', (event: MouseEvent) => {
    const metrics = getGraphCanvasMetrics();
    if (!metrics || !mockGraphCanvas) return;
    const points = segmentsToGraphPoints(activeGraphSensor);
    const pos = getCanvasEventPosition(event, mockGraphCanvas);
    const hitIndex = findGraphPointIndexAt(pos.x, pos.y, points, metrics);
    graphDidDrag = false;
    if (hitIndex !== null) {
        graphDragPointIndex = hitIndex;
        setSelectedGraphPoint(hitIndex);
        renderMockGraphEditor();
    } else {
        graphDragPointIndex = null;
        setSelectedGraphPoint(null);
        renderMockGraphEditor();
    }
});

window.addEventListener('mousemove', (event: MouseEvent) => {
    if (graphDragPointIndex === null || !mockGraphCanvas) return;
    const metrics = getGraphCanvasMetrics();
    if (!metrics) return;
    const pos = getCanvasEventPosition(event, mockGraphCanvas);
    const tSec = snapTimeSec(graphXToTime(pos.x, metrics), mockTimelineConfig.durationSec);
    const value = clampToSensorRange(activeGraphSensor, graphYToValue(pos.y, metrics));
    if (updateGraphPoint(activeGraphSensor, graphDragPointIndex, { tSec, value })) {
        const points = segmentsToGraphPoints(activeGraphSensor);
        const nextIndex = points.findIndex((point) => point.tSec === tSec);
        graphDragPointIndex = nextIndex >= 0 ? nextIndex : graphDragPointIndex;
        graphDidDrag = true;
    }
});

window.addEventListener('mouseup', () => {
    graphDragPointIndex = null;
});

mockGraphCanvas?.addEventListener('click', (event: MouseEvent) => {
    if (!mockGraphCanvas) return;
    if (graphDidDrag) {
        graphDidDrag = false;
        return;
    }
    const metrics = getGraphCanvasMetrics();
    if (!metrics) return;
    const points = segmentsToGraphPoints(activeGraphSensor);
    const pos = getCanvasEventPosition(event, mockGraphCanvas);
    const hitIndex = findGraphPointIndexAt(pos.x, pos.y, points, metrics);
    if (hitIndex !== null) {
        setSelectedGraphPoint(hitIndex);
        renderMockGraphEditor();
        return;
    }
    const tSec = snapTimeSec(graphXToTime(pos.x, metrics), mockTimelineConfig.durationSec);
    const value = clampToSensorRange(activeGraphSensor, graphYToValue(pos.y, metrics));
    if (addOrReplaceGraphPoint(activeGraphSensor, { tSec, value })) {
        setMockTimelineError(null);
    }
});

window.addEventListener('resize', () => {
    renderMockGraphEditor();
});

initializeMockControls();

type OutputTabName = 'compiled' | 'serial' | 'plotter';
let activeOutputTab: OutputTabName = 'compiled';
const outputClearBtn = document.getElementById('output-clear-btn') as HTMLButtonElement | null;
type SerialPipelineMarker = 'execute_clicked' | 'callback_received' | 'dom_rendered' | 'plotter_fed';
type SerialDataSource = 'callback' | 'internal';
interface SerialPipelineRunState {
    runId: number;
    executeClickedAt: number;
    callbackReceived: boolean;
    domRendered: boolean;
    plotterFed: boolean;
    warningEmitted: boolean;
}
const SERIAL_PIPELINE_DEBUG = false;
const SERIAL_MAX_BUFFER_CHARS = 1_000_000;
const SERIAL_MAX_PENDING_CHARS = 200_000;
const SERIAL_TRUNCATED_NOTICE = '[Serial output truncated to latest data]\n';
let serialPipelineRunSeq = 0;
let serialPipelineState: SerialPipelineRunState | null = null;
let serialBufferedText = '';
let serialPendingChunks: string[] = [];
let serialPendingChars = 0;

function updateOutputClearButton(tabName: OutputTabName) {
    if (!outputClearBtn) return;
    const shouldShow = tabName === 'serial' || tabName === 'plotter';
    outputClearBtn.hidden = !shouldShow;
}

function switchOutputTab(tabName: OutputTabName) {
    activeOutputTab = tabName;
    document.querySelectorAll('.compiled-tab-btn').forEach((btn) => {
        const isActive = (btn as HTMLElement).dataset.outputTab === tabName;
        btn.classList.toggle('active', isActive);
    });

    document.querySelectorAll('.compiled-tab-panel').forEach((panel) => {
        const isActive = (panel as HTMLElement).dataset.outputPanel === tabName;
        panel.classList.toggle('active', isActive);
        (panel as HTMLElement).hidden = !isActive;
    });

    if (tabName === 'plotter') {
        setTimeout(() => resizePlotterCanvas(), 0);
    }

    flushSerialBufferToDom(tabName === 'serial');
    updateOutputClearButton(tabName);
}

document.querySelectorAll('.compiled-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.outputTab as OutputTabName | undefined;
        if (!tab) return;
        switchOutputTab(tab);
    });
});

// Default active tab: Compiled
switchOutputTab('compiled');

const compiledIoContainer = document.getElementById('compiled-io-container') as HTMLElement | null;
const outputFloatOpenBtn = document.getElementById('output-float-open') as HTMLButtonElement | null;
const outputFloatCloseBtn = document.getElementById('output-float-close') as HTMLButtonElement | null;
const outputFloatDragHandle = document.getElementById('output-float-drag') as HTMLButtonElement | null;

function setCompiledWindowFloating(isFloating: boolean) {
    if (!compiledIoContainer) return;
    compiledIoContainer.classList.toggle('floating', isFloating);

    if (outputFloatOpenBtn) outputFloatOpenBtn.hidden = isFloating;
    if (outputFloatCloseBtn) outputFloatCloseBtn.hidden = !isFloating;
    if (outputFloatDragHandle) outputFloatDragHandle.hidden = !isFloating;

    if (!isFloating) {
        compiledIoContainer.style.left = '';
        compiledIoContainer.style.top = '';
        compiledIoContainer.style.width = '';
        compiledIoContainer.style.height = '';
    }
}

function openCompiledWindowFloating() {
    if (!compiledIoContainer) return;
    if (!compiledIoContainer.classList.contains('floating')) {
        const rect = compiledIoContainer.getBoundingClientRect();
        setCompiledWindowFloating(true);
        compiledIoContainer.style.left = `${Math.max(8, rect.left)}px`;
        compiledIoContainer.style.top = `${Math.max(8, rect.top)}px`;
        compiledIoContainer.style.width = `${Math.max(320, rect.width)}px`;
        compiledIoContainer.style.height = `${Math.max(240, rect.height)}px`;
    }
}

function closeCompiledWindowFloating() {
    setCompiledWindowFloating(false);
}

outputFloatOpenBtn?.addEventListener('click', openCompiledWindowFloating);
outputFloatCloseBtn?.addEventListener('click', closeCompiledWindowFloating);
outputClearBtn?.addEventListener('click', () => {
    if (activeOutputTab === 'serial') {
        clearSerial();
    } else if (activeOutputTab === 'plotter') {
        clearPlotter();
    }
});

outputFloatDragHandle?.addEventListener('mousedown', (event: MouseEvent) => {
    if (!compiledIoContainer || !compiledIoContainer.classList.contains('floating')) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const initialLeft = parseFloat(compiledIoContainer.style.left || '0');
    const initialTop = parseFloat(compiledIoContainer.style.top || '0');

    const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        const nextLeft = Math.max(0, initialLeft + deltaX);
        const nextTop = Math.max(0, initialTop + deltaY);
        compiledIoContainer.style.left = `${nextLeft}px`;
        compiledIoContainer.style.top = `${nextTop}px`;
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
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
    // I2C sensors on default ESP32 I2C pins (SDA=21, SCL=22)
    if (/SHT31|BH1750|SensirionI2CSen5x|sen5x/.test(code)) {
        hackCable.activateSensorComponent('i2c', 21, 22);
    }
    const tmecAnalogMatch = code.match(/ReadAnalog_(?:from_)?MPC3424\s*\(\s*(\d+)/);
    if (tmecAnalogMatch) {
        const channelToBoardPin: Record<number, number> = { 1: 32, 2: 33, 3: 36, 4: 39 };
        const channel = parseInt(tmecAnalogMatch[1], 10);
        const boardPin = channelToBoardPin[channel];
        if (boardPin !== undefined) hackCable.activateSensorComponent('analog', boardPin, boardPin);
    }
}

// Serial Monitor
function debugSerialPipeline(message: string, extra?: unknown) {
    if (!SERIAL_PIPELINE_DEBUG) return;
    if (extra !== undefined) {
        console.log(`[SerialPipeline] ${message}`, extra);
    } else {
        console.log(`[SerialPipeline] ${message}`);
    }
}

function beginSerialPipelineDiagnostics(): number {
    serialPipelineRunSeq += 1;
    serialPipelineState = {
        runId: serialPipelineRunSeq,
        executeClickedAt: Date.now(),
        callbackReceived: false,
        domRendered: false,
        plotterFed: false,
        warningEmitted: false,
    };
    debugSerialPipeline('Run started', serialPipelineState);
    return serialPipelineState.runId;
}

function markSerialPipeline(marker: SerialPipelineMarker) {
    if (!serialPipelineState) return;
    if (marker === 'callback_received') serialPipelineState.callbackReceived = true;
    if (marker === 'dom_rendered') serialPipelineState.domRendered = true;
    if (marker === 'plotter_fed') serialPipelineState.plotterFed = true;
}

function flushSerialBufferToDom(forceFullSync = false): boolean {
    const output = document.getElementById('serial-output');
    if (!output) {
        debugSerialPipeline('Serial DOM not available yet');
        return false;
    }

    if (forceFullSync) {
        if ((output.textContent ?? '') !== serialBufferedText) {
            output.textContent = serialBufferedText;
        }
        serialPendingChunks = [];
        serialPendingChars = 0;
    } else if (serialPendingChunks.length > 0) {
        output.textContent = (output.textContent ?? '') + serialPendingChunks.join('');
        serialPendingChunks = [];
        serialPendingChars = 0;
    }

    output.scrollTop = output.scrollHeight;
    markSerialPipeline('dom_rendered');
    return true;
}

function trimSerialBufferIfNeeded(): boolean {
    if (serialBufferedText.length <= SERIAL_MAX_BUFFER_CHARS) return false;
    const tailLength = Math.max(0, SERIAL_MAX_BUFFER_CHARS - SERIAL_TRUNCATED_NOTICE.length);
    const tail = serialBufferedText.slice(-tailLength);
    serialBufferedText = SERIAL_TRUNCATED_NOTICE + tail;
    serialPendingChunks = [serialBufferedText];
    serialPendingChars = serialBufferedText.length;
    return true;
}

function appendSerial(data: string) {
    if (!data) return;
    serialBufferedText += data;
    const bufferTrimmed = trimSerialBufferIfNeeded();
    if (!bufferTrimmed) {
        serialPendingChunks.push(data);
        serialPendingChars += data.length;
        if (serialPendingChars > SERIAL_MAX_PENDING_CHARS) {
            const pendingTailLength = Math.min(SERIAL_MAX_PENDING_CHARS, serialBufferedText.length);
            const pendingTail = serialBufferedText.slice(-pendingTailLength);
            serialPendingChunks = [pendingTail];
            serialPendingChars = pendingTail.length;
        }
    }
    flushSerialBufferToDom(bufferTrimmed);
}

function clearSerial() {
    serialBufferedText = '';
    serialPendingChunks = [];
    serialPendingChars = 0;
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

function feedPlotter(data: string): boolean {
    let fed = false;
    serialLineBuffer += data;
    let nl: number;
    while ((nl = serialLineBuffer.indexOf('\n')) !== -1) {
        const line = serialLineBuffer.slice(0, nl);
        serialLineBuffer = serialLineBuffer.slice(nl + 1);
        const parsed = parsePlotterLine(line);
        if (parsed) {
            pushPlotterData(parsed);
            fed = true;
        }
    }
    return fed;
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

function routeIncomingSerialData(data: string, source: SerialDataSource = 'callback') {
    if (!data) return;
    markSerialPipeline('callback_received');
    debugSerialPipeline(`Serial data via ${source}`);
    appendSerial(data);
    if (feedPlotter(data)) {
        markSerialPipeline('plotter_fed');
    }
}

function registerSerialDataCallback() {
    hackCable.serialDataCallback = (data: string) => {
        routeIncomingSerialData(data, 'callback');
    };
}

const simHttpPathInput = document.getElementById('sim-http-path') as HTMLInputElement | null;
const simHttpSendBtn = document.getElementById('sim-http-send') as HTMLButtonElement | null;
const simHttpResponseEl = document.getElementById('sim-http-response') as HTMLElement | null;
const simHttpToggleBtn = document.getElementById('sim-http-toggle') as HTMLButtonElement | null;
const simHttpContainer = document.getElementById('sim-http-container') as HTMLElement | null;

function setSimHttpSettingsVisible(visible: boolean) {
    if (!simHttpContainer) return;
    simHttpContainer.hidden = !visible;
    simHttpContainer.style.display = visible ? 'flex' : 'none';
    if (!simHttpToggleBtn) return;
    simHttpToggleBtn.classList.toggle('active', visible);
    simHttpToggleBtn.setAttribute('aria-expanded', visible ? 'true' : 'false');
}

setSimHttpSettingsVisible(false);

simHttpToggleBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    setSimHttpSettingsVisible(simHttpContainer?.hidden ?? true);
});

simHttpContainer?.addEventListener('click', (event) => {
    event.stopPropagation();
});

document.addEventListener('click', (event) => {
    if (!simHttpContainer || simHttpContainer.hidden) return;
    const target = event.target as Node | null;
    if (!target) return;
    const clickedToggle = simHttpToggleBtn?.contains(target) ?? false;
    const clickedPopup = simHttpContainer.contains(target);
    if (!clickedToggle && !clickedPopup) {
        setSimHttpSettingsVisible(false);
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setSimHttpSettingsVisible(false);
});

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

(window as any).hackcable_analog_read = (pin: number): number => {
    const selectedExample = getSelectedExampleKey();
    if (selectedExample === 'handysense_real_bfarm_tmec_analog_test' || circuitHasComponent(61)) {
        if (pin >= 1 && pin <= 4) return getScaledMockRegisterValue('tmec_analog_uv', 2500);
        return 0;
    }
    if (pin === 36) return getMock('soil', 50) * 40.95; // 0-100% → 0-4095 ADC
    return 0;
};
(window as any).hackcable_http_get = async (path: string) => {
    return runSimulatedHttpGet(path);
};
(window as any).hackcable_serial_begin = (_baud: number) => {};
(window as any).hackcable_serial_data = (text: string) => { routeIncomingSerialData(text, 'internal'); };
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

function isSensorKey(key: string): key is SensorKey {
    return SENSOR_KEY_SET.has(key as SensorKey);
}

function getMockAtTime(
    key: SensorKey,
    nowMs: number,
    config: MockTimelineConfig,
    runStartMs: number,
): number | undefined {
    if (!Number.isFinite(nowMs) || !Number.isFinite(runStartMs)) return undefined;
    if (!Number.isFinite(config.durationSec) || config.durationSec <= 0) return undefined;

    const elapsedSec = Math.max(0, (nowMs - runStartMs) / 1000);
    const cycleSec = ((elapsedSec % config.durationSec) + config.durationSec) % config.durationSec;
    const segments = config.tracks[key] || [];
    for (const segment of segments) {
        if (cycleSec >= segment.startSec && cycleSec < segment.endSec) {
            return segment.value;
        }
    }
    return undefined;
}

function getMock(key: string, defaultVal: number): number {
    if (activeMockSource === 'timeline' && isSensorKey(key)) {
        const timedValue = getMockAtTime(key, Date.now(), mockTimelineConfig, mockRunStartMs);
        return timedValue !== undefined ? timedValue : defaultVal;
    }
    const value = parseMockValues()[key];
    return value !== undefined ? value : defaultVal;
}

function getSelectedExampleKey(): string | null {
    const examplesSelect = document.getElementById('code-examples') as HTMLSelectElement | null;
    return examplesSelect?.value || localStorage.getItem(EXAMPLE_SELECTION_STORAGE_KEY);
}

function circuitHasComponent(componentId: number): boolean {
    const figures = hackCable?.editor?.canvas?.getFigures?.();
    if (!figures || typeof figures.each !== 'function') return false;

    let found = false;
    figures.each((_index: number, figure: any) => {
        if (figure?.component?.id === componentId || figure?.componentId === componentId) {
            found = true;
        }
    });
    return found;
}

function getActiveModbusMockProfile(): 'sensor-weather-htco2plx' | 'sensor-ph-rs485' | 'sensor-rain-rs485' | 'sensor-wind-speed-rs485' | 'sensor-sht31-rs485' | 'sensor-weight-3kg-rs485' | 'sensor-wind-direction-rs485' | 'sensor-dt-par485' | 'bfarm-7in1-soil' | 'bfarm-ammonia-rs485' | 'bfarm-soil-temp-multiread-rs485' | 'bfarm-ultrasonic-rs485' | 'bfarm-turbidity-xm3318b-rs485' | 'bfarm-turbidity-xm8518-rs485' | 'bfarm-nitrate-isfet-rs485' | 'bfarm-tmec-tensio-rs485' | 'bfarm-water-quality-suite-rs485' | 'bfarm-tubular-soil-probe-rs485' | 'bfarm-air-velocity-sm3789' | 'bfarm-lux120k-rs485' | 'bfarm-weather-sensor-rs485' | 'default-weather' {
    const selectedExample = getSelectedExampleKey();
    if (selectedExample === 'handysense_real_sensor_weather_htco2plx_test' || circuitHasComponent(40)) {
        return 'sensor-weather-htco2plx';
    }
    if (selectedExample === 'handysense_real_sensor_ph_rs485_test' || circuitHasComponent(35)) {
        return 'sensor-ph-rs485';
    }
    if (selectedExample === 'handysense_real_sensor_rain_rs485_test' || circuitHasComponent(37)) {
        return 'sensor-rain-rs485';
    }
    if (selectedExample === 'handysense_real_sensor_wind_speed_rs485_test' || circuitHasComponent(38)) {
        return 'sensor-wind-speed-rs485';
    }
    if (selectedExample === 'handysense_real_sensor_sht31_rs485_test' || circuitHasComponent(67)) {
        return 'sensor-sht31-rs485';
    }
    if (selectedExample === 'handysense_real_sensor_weight_3kg_rs485_test' || circuitHasComponent(68)) {
        return 'sensor-weight-3kg-rs485';
    }
    if (selectedExample === 'handysense_real_sensor_wind_direction_rs485_test' || circuitHasComponent(69)) {
        return 'sensor-wind-direction-rs485';
    }
    if (selectedExample === 'handysense_real_sensor_dt_par485_test' || circuitHasComponent(70)) {
        return 'sensor-dt-par485';
    }
    if (selectedExample === 'handysense_real_bfarm_7in1_soil_multiread_test' || circuitHasComponent(52)) {
        return 'bfarm-7in1-soil';
    }
    if (selectedExample === 'handysense_real_bfarm_ammonia_rs485_test' || circuitHasComponent(53)) {
        return 'bfarm-ammonia-rs485';
    }
    if (selectedExample === 'handysense_real_bfarm_soil_temp_multiread_rs485_test' || circuitHasComponent(54)) {
        return 'bfarm-soil-temp-multiread-rs485';
    }
    if (selectedExample === 'handysense_real_bfarm_ultrasonic_rs485_test' || circuitHasComponent(56)) {
        return 'bfarm-ultrasonic-rs485';
    }
    if (selectedExample === 'handysense_real_bfarm_turbidity_xm8518_rs485_test' || circuitHasComponent(58)) {
        return 'bfarm-turbidity-xm8518-rs485';
    }
    if (selectedExample === 'handysense_real_bfarm_turbidity_xm3318b_rs485_test' || circuitHasComponent(57)) {
        return 'bfarm-turbidity-xm3318b-rs485';
    }
    if (selectedExample === 'handysense_real_bfarm_nitrate_isfet_rs485_test' || circuitHasComponent(59)) {
        return 'bfarm-nitrate-isfet-rs485';
    }
    if (selectedExample === 'handysense_real_bfarm_tmec_tensio_rs485_test' || circuitHasComponent(60)) {
        return 'bfarm-tmec-tensio-rs485';
    }
    if (selectedExample === 'handysense_real_bfarm_water_quality_suite_rs485_test' || circuitHasComponent(62)) {
        return 'bfarm-water-quality-suite-rs485';
    }
    if (selectedExample === 'handysense_real_bfarm_tubular_soil_probe_rs485_test' || circuitHasComponent(63)) {
        return 'bfarm-tubular-soil-probe-rs485';
    }
    if (selectedExample === 'handysense_real_bfarm_air_velocity_sensor_sm3789_test' || circuitHasComponent(64)) {
        return 'bfarm-air-velocity-sm3789';
    }
    if (selectedExample === 'handysense_real_bfarm_lux120k_rs485_test' || circuitHasComponent(65)) {
        return 'bfarm-lux120k-rs485';
    }
    if (selectedExample === 'handysense_real_bfarm_weather_sensor_test' || circuitHasComponent(66)) {
        return 'bfarm-weather-sensor-rs485';
    }
    return 'default-weather';
}

function getScaledMockRegisterValue(key: string, defaultVal: number, scale = 1): number {
    return Math.round(getMock(key, defaultVal) * scale);
}

function getScaledMockRegisterValueFromAliases(keys: string[], defaultVal: number, scale = 1): number {
    if (activeMockSource === 'timeline') {
        return getScaledMockRegisterValue(keys[keys.length - 1], defaultVal, scale);
    }

    const values = parseMockValues();
    for (const key of keys) {
        const value = values[key];
        if (value !== undefined) return Math.round(value * scale);
    }
    return Math.round(defaultVal * scale);
}

function getFloat32BigEndianWords(value: number): [number, number] {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, false);
    return [view.getUint16(0, false), view.getUint16(2, false)];
}

// Sensor data bridges for Clang/LLVM ESP32 examples
(window as any).hackcable_modbus_read = (slaveId: number, regAddr: number): number => {
    const activeProfile = getActiveModbusMockProfile();
    if (activeProfile === 'sensor-weather-htco2plx') {
        const registers: Record<number, number> = {
            500: getScaledMockRegisterValue('humidity', 60.0, 10),
            501: getScaledMockRegisterValue('temperature', 25.0, 10),
            503: getScaledMockRegisterValue('co2', 400.0),
            505: getScaledMockRegisterValue('pressure', 1013.0),
            507: getScaledMockRegisterValue('lux', 500.0),
        };
        return registers[regAddr] ?? 0;
    }
    if (activeProfile === 'sensor-ph-rs485') {
        if (regAddr === 0) return getScaledMockRegisterValue('temperature', 25.0, 10);
        if (regAddr === 1) return getScaledMockRegisterValue('ph', 7.0, 10);
        return 0;
    }
    if (activeProfile === 'sensor-rain-rs485') {
        return regAddr === 0 ? getScaledMockRegisterValue('rain', 12.0, 10) : 0;
    }
    if (activeProfile === 'sensor-wind-speed-rs485') {
        return regAddr === 0 ? getScaledMockRegisterValue('wind_speed', 5.0, 10) : 0;
    }
    if (activeProfile === 'sensor-sht31-rs485') {
        const registers: Record<number, number> = {
            0: getScaledMockRegisterValue('temperature', 25.0, 10),
            1: getScaledMockRegisterValue('humidity', 60.0, 10),
        };
        return registers[regAddr] ?? 0;
    }
    if (activeProfile === 'sensor-weight-3kg-rs485') {
        return regAddr === 1 ? getScaledMockRegisterValue('weight', 1500.0) : 0;
    }
    if (activeProfile === 'sensor-wind-direction-rs485') {
        return regAddr === 0 ? getScaledMockRegisterValue('wind_direction', 180.0, 10) : 0;
    }
    if (activeProfile === 'sensor-dt-par485') {
        return regAddr === 0 ? getScaledMockRegisterValue('par', 650.0) : 0;
    }
    if (getActiveModbusMockProfile() === 'bfarm-7in1-soil') {
        const soil7in1Registers: Record<number, number> = {
            0: getScaledMockRegisterValue('soil', 50.0, 10),
            1: getScaledMockRegisterValue('temperature', 25.0, 10),
            2: getScaledMockRegisterValue('ec', 1200.0),
            3: getScaledMockRegisterValue('ph', 7.0, 10),
            4: getScaledMockRegisterValue('nitrogen', 120.0),
            5: getScaledMockRegisterValue('phosphorus', 60.0),
            6: getScaledMockRegisterValue('potassium', 180.0),
        };
        if (regAddr in soil7in1Registers) return soil7in1Registers[regAddr];
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-ammonia-rs485') {
        const ammoniaRegisters: Record<number, number> = {
            0: getScaledMockRegisterValue('ammonia', 2.5, 100),
            1: getScaledMockRegisterValue('ph', 7.0, 100),
            2: getScaledMockRegisterValue('temperature', 25.0, 10),
        };
        if (regAddr in ammoniaRegisters) return ammoniaRegisters[regAddr];
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-soil-temp-multiread-rs485') {
        const soilTempRegisters: Record<number, number> = {
            0: getScaledMockRegisterValueFromAliases(['soil_moisture', 'soil'], 50.0, 10),
            1: getScaledMockRegisterValueFromAliases(['soil_temp', 'temperature'], 25.0, 10),
        };
        if (regAddr in soilTempRegisters) return soilTempRegisters[regAddr];
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-ultrasonic-rs485') {
        if (regAddr === 256) return getScaledMockRegisterValue('distance', 150.0, 10);
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-turbidity-xm3318b-rs485') {
        if (regAddr === 0) return getScaledMockRegisterValue('turbidity', 250.0);
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-turbidity-xm8518-rs485') {
        if (regAddr === 0) return getScaledMockRegisterValue('turbidity', 250.0);
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-nitrate-isfet-rs485') {
        const nitrateRegisters: Record<number, number> = {
            0: getScaledMockRegisterValue('nitrate_vout', 315.0, 10),
            1: getScaledMockRegisterValue('nitrate_vout_temp', 298.0, 10),
            2: getScaledMockRegisterValue('nitrate_sample', 125.0, 10),
            3: getScaledMockRegisterValue('temperature', 25.0, 10),
            4: getScaledMockRegisterValue('nitrate_error', 1.25, 100),
            5: getScaledMockRegisterValue('nitrate_r_square', 0.998, 1000),
            6: getScaledMockRegisterValue('nitrate_sensitivity', 58.5, 10),
            7: getScaledMockRegisterValue('nitrate_std1', 50.0, 100),
            8: getScaledMockRegisterValue('nitrate_std2', 100.0, 100),
            9: getScaledMockRegisterValue('nitrate_std3', 300.0, 100),
        };
        if (regAddr in nitrateRegisters) return nitrateRegisters[regAddr];
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-tmec-tensio-rs485') {
        const tensioRegisters: Record<number, number> = {
            0: 0,
            1: getScaledMockRegisterValue('temperature', 25.0, 10),
            2: getScaledMockRegisterValue('humidity', 60.0, 10),
            3: getScaledMockRegisterValue('lux', 500.0),
            4: 0,
            5: getScaledMockRegisterValue('voltage', 12.0, 1000),
        };
        if (regAddr in tensioRegisters) return tensioRegisters[regAddr];
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-water-quality-suite-rs485') {
        if (slaveId === 1 && regAddr === 4) {
            return getScaledMockRegisterValue('water_level', 120.0);
        }
        if (slaveId === 2) {
            const phRegisters: Record<number, number> = {
                0: getScaledMockRegisterValue('water_temperature', 24.5, 10),
                1: getScaledMockRegisterValue('ph', 7.2, 10),
            };
            return phRegisters[regAddr] ?? 0;
        }
        if (slaveId === 3) {
            const dissolvedOxygenWords = getFloat32BigEndianWords(getMock('dissolved_oxygen', 8.25));
            const doTemperatureWords = getFloat32BigEndianWords(getMock('do_temperature', 25.5));
            const doRegisters: Record<number, number> = {
                2: dissolvedOxygenWords[0],
                3: dissolvedOxygenWords[1],
                4: doTemperatureWords[0],
                5: doTemperatureWords[1],
            };
            return doRegisters[regAddr] ?? 0;
        }
        if (slaveId === 4 && regAddr === 1) {
            return getScaledMockRegisterValue('ec', 1.35, 10);
        }
        if (slaveId === 5) {
            const ammoniaRegisters: Record<number, number> = {
                0: getScaledMockRegisterValue('ammonia', 2.5, 100),
                1: getScaledMockRegisterValue('ph', 7.2, 100),
                2: getScaledMockRegisterValue('ammonia_temperature', 26.0, 10),
            };
            return ammoniaRegisters[regAddr] ?? 0;
        }
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-tubular-soil-probe-rs485') {
        const tubularSoilRegisters: Record<number, number> = {
            0: getScaledMockRegisterValue('tubular_moisture_10', 42.0, 10),
            1: getScaledMockRegisterValue('tubular_temperature_10', 26.0, 10),
            2: getScaledMockRegisterValue('tubular_moisture_20', 45.0, 10),
            3: getScaledMockRegisterValue('tubular_temperature_20', 25.0, 10),
            4: getScaledMockRegisterValue('tubular_moisture_30', 48.0, 10),
            5: getScaledMockRegisterValue('tubular_temperature_30', 24.0, 10),
            6: getScaledMockRegisterValue('tubular_moisture_40', 52.0, 10),
            7: getScaledMockRegisterValue('tubular_temperature_40', 23.0, 10),
            8: getScaledMockRegisterValue('tubular_moisture_50', 56.0, 10),
            9: getScaledMockRegisterValue('tubular_temperature_50', 22.0, 10),
        };
        if (slaveId === 1 && regAddr in tubularSoilRegisters) return tubularSoilRegisters[regAddr];
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-air-velocity-sm3789') {
        if (slaveId === 1 && regAddr === 0) {
            return getScaledMockRegisterValue('air_velocity', 12.0);
        }
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-lux120k-rs485') {
        if (slaveId === 1 && regAddr === 3) {
            return getScaledMockRegisterValue('lux', 500.0);
        }
        return 0;
    }

    if (getActiveModbusMockProfile() === 'bfarm-weather-sensor-rs485') {
        const weatherSensorRegisters: Record<number, number> = {
            500: getScaledMockRegisterValue('humidity', 60.0, 10),
            501: getScaledMockRegisterValue('temperature', 25.0, 10),
            502: getScaledMockRegisterValue('noise', 48.0, 10),
            503: getScaledMockRegisterValue('co2', 400.0),
            505: getScaledMockRegisterValue('pressure', 1013.0),
            507: getScaledMockRegisterValue('lux', 500.0),
        };
        if (slaveId === 1 && regAddr in weatherSensorRegisters) return weatherSensorRegisters[regAddr];
        return 0;
    }

    const weatherRegisters: Record<number, number> = {
        0: getScaledMockRegisterValue('temperature', 25.0),
        1: getScaledMockRegisterValue('humidity', 60.0),
        2: getScaledMockRegisterValue('co2', 400.0),
        3: getScaledMockRegisterValue('pressure', 1013.0),
    };
    if (regAddr in weatherRegisters) return weatherRegisters[regAddr];
    return getMock('ph', 7.0);
};
(window as any).hackcable_sht31_temp = (): number => getMock('temperature', 25.0);
(window as any).hackcable_sht31_humidity = (): number => getMock('humidity', 60.0);
(window as any).hackcable_bh1750_lux = (): number => getMock('lux', 500.0);
(window as any).hackcable_sen55_value = (index: number): number => {
    const values = [
        getMock('pm1', 8.0),
        getMock('pm25', 12.0),
        getMock('pm4', 15.0),
        getMock('pm10', 20.0),
        getMock('humidity', 60.0),
        getMock('temperature', 25.0),
        getMock('voc', 100.0),
        getMock('nox', 10.0),
    ];
    return values[index] ?? 0;
};

async function cleanupWasmInstance() {
    delete (window as any).HackCableModule;
    if (activeClangLoopHandle !== null) {
        clearInterval(activeClangLoopHandle);
        activeClangLoopHandle = null;
    }
    activeClangShim?.clearScheduledPinEvents();
    activeClangShim = null;
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
let controlBarElement: HTMLElement | null = null;
let controlBarResizeHandle: HTMLDivElement | null = null;
let controlBarWidth = 340;
const CONTROLBAR_WIDTH_STORAGE_KEY = 'hackCable-controlbar-width';
const CONTROLBAR_DEFAULT_WIDTH = 340;
const CONTROLBAR_MIN_WIDTH = 220;
const CONTROLBAR_MAX_WIDTH = 720;

function getControlBarWidthBounds() {
    const viewportLimitedMax = Math.floor(window.innerWidth * 0.85);
    const maxWidth = Math.max(180, Math.min(CONTROLBAR_MAX_WIDTH, viewportLimitedMax));
    const minWidth = Math.min(CONTROLBAR_MIN_WIDTH, maxWidth);
    return { minWidth, maxWidth };
}

function clampControlBarWidth(nextWidth: number) {
    const { minWidth, maxWidth } = getControlBarWidthBounds();
    const normalized = Number.isFinite(nextWidth) ? Math.round(nextWidth) : CONTROLBAR_DEFAULT_WIDTH;
    return Math.max(minWidth, Math.min(normalized, maxWidth));
}

function applyControlBarWidth(nextWidth: number, persist: boolean) {
    controlBarWidth = clampControlBarWidth(nextWidth);
    document.body.style.setProperty('--controlbar-width', `${controlBarWidth}px`);
    if (persist) {
        localStorage.setItem(CONTROLBAR_WIDTH_STORAGE_KEY, `${controlBarWidth}`);
    }
}

function loadSavedControlBarWidth() {
    const rawValue = localStorage.getItem(CONTROLBAR_WIDTH_STORAGE_KEY);
    if (!rawValue) return CONTROLBAR_DEFAULT_WIDTH;
    const parsedWidth = Number(rawValue);
    if (!Number.isFinite(parsedWidth) || parsedWidth <= 0) return CONTROLBAR_DEFAULT_WIDTH;
    return parsedWidth;
}

function initializeControlBarResize() {
    if (!controlBarResizeHandle) return;

    controlBarResizeHandle.addEventListener('mousedown', (event: MouseEvent) => {
        if (!controlBarElement || controlBarElement.classList.contains('hidden')) return;

        event.preventDefault();
        const startX = event.clientX;
        const startWidth = controlBarWidth;
        const previousCursor = document.body.style.cursor;
        const previousUserSelect = document.body.style.userSelect;
        document.body.classList.add('controlbar-resizing');
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            applyControlBarWidth(startWidth - deltaX, false);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.classList.remove('controlbar-resizing');
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousUserSelect;
            applyControlBarWidth(controlBarWidth, true);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function setControlBarHidden(hidden: boolean) {
    if (!controlBarElement) return;

    if (!hidden) {
        applyControlBarWidth(controlBarWidth, false);
    }
    controlBarElement.classList.toggle('hidden', hidden);
    document.body.classList.toggle('controlbar-hidden', hidden);
    localStorage.setItem('hackCable-controlbar-hidden', hidden.toString());

    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ source: 'hackcable', type: 'controlbar-state', hidden }, '*');
    }
}

function toggleControlBarVisibility() {
    if (!controlBarElement) return;
    const shouldHide = !controlBarElement.classList.contains('hidden');
    setControlBarHidden(shouldHide);
}

function initializeControlBarToggle() {
    const controlBar = document.querySelector('.controlBar') as HTMLElement | null;
    const legacyToggleBtn = document.querySelector('.toggle-controlbar') as HTMLButtonElement | null;

    if (!controlBar) return;
    controlBarElement = controlBar;
    controlBarResizeHandle = controlBar.querySelector('.controlbar-resize-handle') as HTMLDivElement | null;
    controlBarWidth = loadSavedControlBarWidth();
    applyControlBarWidth(controlBarWidth, false);
    initializeControlBarResize();
    window.addEventListener('resize', () => applyControlBarWidth(controlBarWidth, false));

    // Default state is always visible.
    setControlBarHidden(false);

    // Keep old side handle hidden; new toggle lives in HackCable header.
    if (legacyToggleBtn) {
        legacyToggleBtn.style.display = 'none';
    }
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
        if (isSingleBoardCircuitData(data)) {
            repositionRestoredSingleBoardIfNeeded();
            scheduleInitialViewportCenter();
        }
    });
    clearAll.addEventListener("click", () => {
        if(confirm('Êtes-vous sûr de vouloir effacer tous les composants et câblages ?')) {
            console.log('Clearing all components and wiring...');
            hackCable.editor.canvas.clear();
            localStorage.removeItem('savedEditor');
            console.log('Canvas cleared!');
            // Re-run auto-setup with force flag to bypass saved data check
            setTimeout(() => {
                autoSetupBasicCircuit(true);
                scheduleInitialViewportCenter();
            }, 100);
        }
    });
}

downloadSessionButton?.addEventListener('click', () => {
    downloadCircuitSession();
});

uploadSessionButton?.addEventListener('click', () => {
    uploadSessionInput?.click();
});

uploadSessionInput?.addEventListener('change', () => {
    const file = uploadSessionInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            importCircuitSessionFromText(String(reader.result ?? ''));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to import the selected file.';
            showPlainStatus(message, 'error', 4500);
        } finally {
            uploadSessionInput.value = '';
        }
    };
    reader.onerror = () => {
        showPlainStatus('Unable to read the selected file.', 'error', 4500);
        uploadSessionInput.value = '';
    };
    reader.readAsText(file);
});

// Function to update UI translations
function syncRunButtonA11yLabels() {
    document.querySelectorAll('.run-circle-btn').forEach((element) => {
        if (!(element instanceof HTMLButtonElement)) return;
        const label = (element.textContent || '').trim();
        if (!label) return;
        element.title = label;
        element.setAttribute('aria-label', label);
    });
}

function updateUITranslations() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        if (key) {
            const translated = (window as any).i18next.t(key);
            element.textContent = translated;
        }
    });
    syncRunButtonA11yLabels();
    renderMockEditors();
    setMockTimelineError(mockTimelineErrorKey);
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
syncRunButtonA11yLabels();
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

    handysense_real_six_button_test: `// Handysense real - 6 Button Test
// On-board controls:
// RESET -> restarts this sketch and prints the setup banner again
// BOOT  -> GPIO0 active LOW while held
// B0    -> GPIO32 active LOW while held, drives relay R1 (IO25)
// B1    -> GPIO33 active LOW while held, drives relay R2 (IO4)
// B2    -> GPIO15 active LOW while held, drives relay R3 (IO12)
// B3    -> GPIO39 active LOW while held, drives relay R4 (IO13)

void setup() {
  Serial.begin(115200);
  delay(150);

  pinMode(0, INPUT_PULLUP);
  pinMode(32, INPUT_PULLUP);
  pinMode(33, INPUT_PULLUP);
  pinMode(15, INPUT_PULLUP);
  pinMode(39, INPUT_PULLUP);
  pinMode(25, OUTPUT);
  pinMode(4, OUTPUT);
  pinMode(12, OUTPUT);
  pinMode(13, OUTPUT);
  digitalWrite(25, LOW);
  digitalWrite(4, LOW);
  digitalWrite(12, LOW);
  digitalWrite(13, LOW);

  Serial.println();
  Serial.println("Handysense real 6-button test ready");
  Serial.println("Press RESET to restart this sketch.");
  Serial.println("Press BOOT to watch GPIO0 change in Serial.");
  Serial.println("Press B0-B3 to drive relays R1-R4.");
}

void loop() {
  bool bootPressed = digitalRead(0) == LOW;
  bool button0Pressed = digitalRead(32) == LOW;
  if (button0Pressed) {
    digitalWrite(25, HIGH);
  } else {
    digitalWrite(25, LOW);
  }

  bool button1Pressed = digitalRead(33) == LOW;
  if (button1Pressed) {
    digitalWrite(4, HIGH);
  } else {
    digitalWrite(4, LOW);
  }

  bool button2Pressed = digitalRead(15) == LOW;
  if (button2Pressed) {
    digitalWrite(12, HIGH);
  } else {
    digitalWrite(12, LOW);
  }

  bool button3Pressed = digitalRead(39) == LOW;
  if (button3Pressed) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }

  Serial.print("BOOT=");
  if (bootPressed) {
    Serial.print("LOW");
  } else {
    Serial.print("HIGH");
  }

  Serial.print(" B0=");
  if (button0Pressed) {
    Serial.print("LOW");
  } else {
    Serial.print("HIGH");
  }

  Serial.print(" B1=");
  if (button1Pressed) {
    Serial.print("LOW");
  } else {
    Serial.print("HIGH");
  }

  Serial.print(" B2=");
  if (button2Pressed) {
    Serial.print("LOW");
  } else {
    Serial.print("HIGH");
  }

  Serial.print(" B3=");
  if (button3Pressed) {
    Serial.println("LOW");
  } else {
    Serial.println("HIGH");
  }

  delay(300);
}`,

    handysense_real_eight_led_test: `// Handysense real - 8 LED Test
// Built-in LEDs:
// LED0 -> GPIO2
// LED1 -> GPIO5
// LED2 -> GPIO18
// LED3 -> GPIO19
// LED4 -> GPIO21
// LED5 -> GPIO22
// LED6 -> GPIO23
// LED7 -> GPIO27

void setup() {
  Serial.begin(115200);
  delay(150);

  pinMode(2, OUTPUT);
  pinMode(5, OUTPUT);
  pinMode(18, OUTPUT);
  pinMode(19, OUTPUT);
  pinMode(21, OUTPUT);
  pinMode(22, OUTPUT);
  pinMode(23, OUTPUT);
  pinMode(27, OUTPUT);

  digitalWrite(2, LOW);
  digitalWrite(5, LOW);
  digitalWrite(18, LOW);
  digitalWrite(19, LOW);
  digitalWrite(21, LOW);
  digitalWrite(22, LOW);
  digitalWrite(23, LOW);
  digitalWrite(27, LOW);

  Serial.println();
  Serial.println("Handysense real 8-LED test ready");
  Serial.println("LED0-LED7 blink in sequence.");
}

void loop() {
  digitalWrite(2, HIGH);
  Serial.println("LED0 ON");
  delay(180);
  digitalWrite(2, LOW);

  digitalWrite(5, HIGH);
  Serial.println("LED1 ON");
  delay(180);
  digitalWrite(5, LOW);

  digitalWrite(18, HIGH);
  Serial.println("LED2 ON");
  delay(180);
  digitalWrite(18, LOW);

  digitalWrite(19, HIGH);
  Serial.println("LED3 ON");
  delay(180);
  digitalWrite(19, LOW);

  digitalWrite(21, HIGH);
  Serial.println("LED4 ON");
  delay(180);
  digitalWrite(21, LOW);

  digitalWrite(22, HIGH);
  Serial.println("LED5 ON");
  delay(180);
  digitalWrite(22, LOW);

  digitalWrite(23, HIGH);
  Serial.println("LED6 ON");
  delay(180);
  digitalWrite(23, LOW);

  digitalWrite(27, HIGH);
  Serial.println("LED7 ON");
  delay(180);
  digitalWrite(27, LOW);

  delay(250);
}`,

    handysense_real_buttons_leds_test: `// Handysense real - Buttons + LEDs Test
// RESET restarts this sketch and prints the setup banner again.
// BOOT drives LED0 while held.
// B0-B3 drive LED1-LED4 while held.
// LED5-LED7 run a small chase pattern so all 8 LEDs are tested.

void setup() {
  Serial.begin(115200);
  delay(150);

  pinMode(0, INPUT_PULLUP);
  pinMode(32, INPUT_PULLUP);
  pinMode(33, INPUT_PULLUP);
  pinMode(15, INPUT_PULLUP);
  pinMode(39, INPUT_PULLUP);

  pinMode(2, OUTPUT);
  pinMode(5, OUTPUT);
  pinMode(18, OUTPUT);
  pinMode(19, OUTPUT);
  pinMode(21, OUTPUT);
  pinMode(22, OUTPUT);
  pinMode(23, OUTPUT);
  pinMode(27, OUTPUT);

  digitalWrite(2, LOW);
  digitalWrite(5, LOW);
  digitalWrite(18, LOW);
  digitalWrite(19, LOW);
  digitalWrite(21, LOW);
  digitalWrite(22, LOW);
  digitalWrite(23, LOW);
  digitalWrite(27, LOW);

  Serial.println();
  Serial.println("Handysense real buttons + LEDs test ready");
  Serial.println("BOOT -> LED0");
  Serial.println("B0-B3 -> LED1-LED4");
  Serial.println("LED5-LED7 chase automatically.");
}

void loop() {
  bool bootPressed = digitalRead(0) == LOW;
  bool button0Pressed = digitalRead(32) == LOW;
  bool button1Pressed = digitalRead(33) == LOW;
  bool button2Pressed = digitalRead(15) == LOW;
  bool button3Pressed = digitalRead(39) == LOW;

  if (bootPressed) {
    digitalWrite(2, HIGH);
  } else {
    digitalWrite(2, LOW);
  }

  if (button0Pressed) {
    digitalWrite(5, HIGH);
  } else {
    digitalWrite(5, LOW);
  }

  if (button1Pressed) {
    digitalWrite(18, HIGH);
  } else {
    digitalWrite(18, LOW);
  }

  if (button2Pressed) {
    digitalWrite(19, HIGH);
  } else {
    digitalWrite(19, LOW);
  }

  if (button3Pressed) {
    digitalWrite(21, HIGH);
  } else {
    digitalWrite(21, LOW);
  }

  digitalWrite(22, HIGH);
  digitalWrite(23, LOW);
  digitalWrite(27, LOW);
  Serial.println("CHASE LED5");
  delay(160);

  digitalWrite(22, LOW);
  digitalWrite(23, HIGH);
  digitalWrite(27, LOW);
  Serial.println("CHASE LED6");
  delay(160);

  digitalWrite(22, LOW);
  digitalWrite(23, LOW);
  digitalWrite(27, HIGH);
  Serial.println("CHASE LED7");
  delay(160);
}`,

    handysense_real_bfarm_ph_misting: `// Handysense real - BFARM RS485 pH + Misting Pump
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// Actuator wiring:
// Misting Pump SIG -> LEDR_0 (GPIO25)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;
const int MIST_PUMP_PIN = 25;

ModbusMaster phSensor;
float phValue = 7.0f;
const float PH_HIGH_THRESHOLD = 7.2f;
const float PH_LOW_THRESHOLD = 6.8f;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  pinMode(MIST_PUMP_PIN, OUTPUT);
  digitalWrite(MIST_PUMP_PIN, LOW);

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  phSensor.begin(1, Serial2);

  Serial.println("Handysense real RS485 pH + Misting Pump ready");
}

void loop() {
  uint8_t result = phSensor.readHoldingRegisters(0, 2);
  if (result == ModbusMaster::ku8MBSuccess) {
    phValue = phSensor.getResponseBuffer(1) / 10.0f;
  }

  if (phValue > PH_HIGH_THRESHOLD) {
    digitalWrite(MIST_PUMP_PIN, HIGH);
  } else if (phValue < PH_LOW_THRESHOLD) {
    digitalWrite(MIST_PUMP_PIN, LOW);
  }

  Serial.print("pH=");
  Serial.print(phValue, 2);
  Serial.print(",mist=");
  Serial.println(digitalRead(MIST_PUMP_PIN));
  delay(1000);
}`,

    handysense_real_bfarm_soil_watering: `// Handysense real - BFARM Soil Moisture + Water Pump
// Sensor wiring:
// VCC -> A05_1_VCC, GND -> A05_1_GND, AO -> A05_1_SIG (GPIO36)
// Actuator wiring:
// Water Pump SIG -> LEDR_1 (GPIO4)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>

const int SOIL_PIN = 36;
const int WATER_PUMP_PIN = 4;
const int SOIL_DRY_THRESHOLD = 45;   // %: lower means drier
const int SOIL_WET_THRESHOLD = 60;   // %: higher means wet enough

int soilRaw = 0;
int soilPercent = 0;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  pinMode(WATER_PUMP_PIN, OUTPUT);
  digitalWrite(WATER_PUMP_PIN, LOW);

  Serial.println("Handysense real Soil Moisture + Water Pump ready");
}

void loop() {
  soilRaw = analogRead(SOIL_PIN);
  soilPercent = map(soilRaw, 4095, 0, 0, 100);

  if (soilPercent < SOIL_DRY_THRESHOLD) {
    digitalWrite(WATER_PUMP_PIN, HIGH);
  } else if (soilPercent > SOIL_WET_THRESHOLD) {
    digitalWrite(WATER_PUMP_PIN, LOW);
  }

  Serial.print("soil_raw=");
  Serial.print(soilRaw);
  Serial.print(",soil_percent=");
  Serial.print(soilPercent);
  Serial.print(",pump=");
  Serial.println(digitalRead(WATER_PUMP_PIN));
  delay(1000);
}`,

    handysense_real_bfarm_sht31_fan: `// Handysense real - BFARM SHT31 + Fan
// Sensor wiring:
// VCC -> I2C1_VCC, GND -> I2C1_GND, SDA -> I2C1_SDA (GPIO21), SCL -> I2C1_SCL (GPIO22)
// Actuator wiring:
// Fan SIG -> LEDR_1 (GPIO4)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <SHT31.h>

const int FAN_PIN = 4;
const float HUMIDITY_HIGH = 80.0f;
const float HUMIDITY_LOW = 70.0f;
const float TEMP_HIGH = 33.0f;
const float TEMP_LOW = 30.0f;

SHT31 sht31;
float temperatureC = 0.0f;
float humidityRh = 0.0f;
bool fanOn = false;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);

  Wire.begin();
  Wire.setClock(10000);
  sht31.begin(0x44);

  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);

  Serial.println("Handysense real SHT31 + Fan ready");
}

void loop() {
  sht31.read();
  temperatureC = sht31.getTemperature();
  humidityRh = sht31.getHumidity();

  if ((humidityRh >= HUMIDITY_HIGH) || (temperatureC >= TEMP_HIGH)) {
    fanOn = true;
  } else if ((humidityRh <= HUMIDITY_LOW) && (temperatureC <= TEMP_LOW)) {
    fanOn = false;
  }

  digitalWrite(FAN_PIN, fanOn ? HIGH : LOW);

  Serial.print("temp=");
  Serial.print(temperatureC, 1);
  Serial.print(",humidity=");
  Serial.print(humidityRh, 1);
  Serial.print(",fan=");
  Serial.println(fanOn ? 1 : 0);
  delay(1000);
}`,

    handysense_real_bfarm_7in1_soil_multiread_test: `// Handysense real - 7in1Soil MultiRead Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster rs485_npk;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  rs485_npk.begin(1, Serial2);

  Serial.println("Handysense real 7in1Soil MultiRead test ready");
}

void loop() {
  uint8_t result = rs485_npk.readHoldingRegisters(0, 10);

  float moisture = 0.0f;
  float temperature = 0.0f;
  float ec = 0.0f;
  float ph = 0.0f;
  float nitrogen = 0.0f;
  float phosphorus = 0.0f;
  float potassium = 0.0f;

  if (result == ModbusMaster::ku8MBSuccess) {
    moisture = rs485_npk.getResponseBuffer(0) / 10.0f;
    temperature = rs485_npk.getResponseBuffer(1) / 10.0f;
    ec = rs485_npk.getResponseBuffer(2);
    ph = rs485_npk.getResponseBuffer(3) / 10.0f;
    nitrogen = rs485_npk.getResponseBuffer(4);
    phosphorus = rs485_npk.getResponseBuffer(5);
    potassium = rs485_npk.getResponseBuffer(6);
  }

  Serial.print("moisture=");
  Serial.print(moisture, 1);
  Serial.print(",temp=");
  Serial.print(temperature, 1);
  Serial.print(",ec=");
  Serial.print(ec, 0);
  Serial.print(",ph=");
  Serial.print(ph, 1);
  Serial.print(",n=");
  Serial.print(nitrogen, 0);
  Serial.print(",p=");
  Serial.print(phosphorus, 0);
  Serial.print(",k=");
  Serial.println(potassium, 0);
  delay(1000);
}`,

    handysense_real_bfarm_ammonia_rs485_test: `// Handysense real - Ammonia Sensor (RS485) Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster ANS_rs485;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  ANS_rs485.begin(1, Serial2);

  Serial.println("Handysense real Ammonia RS485 test ready");
}

void loop() {
  uint8_t result_ANSrs485 = ANS_rs485.readHoldingRegisters(0, 3);

  float ammonia = 0.0f;
  float ph = 0.0f;
  float temperature = 0.0f;

  if (result_ANSrs485 == ModbusMaster::ku8MBSuccess) {
    ammonia = ANS_rs485.getResponseBuffer(0) / 100.0f;
    ph = ANS_rs485.getResponseBuffer(1) / 100.0f;
    temperature = ANS_rs485.getResponseBuffer(2) / 10.0f;
  }

  Serial.print("ammonia=");
  Serial.print(ammonia, 2);
  Serial.print(",ph=");
  Serial.print(ph, 2);
  Serial.print(",temp=");
  Serial.println(temperature, 1);
  delay(1000);
}`,

    handysense_real_bfarm_soil_temp_multiread_rs485_test: `// Handysense real - Soil Temp/Moisture Sensor (RS485) Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster soilt_rs485;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  soilt_rs485.begin(1, Serial2);

  Serial.println("Handysense real SoilTemp MultiRead RS485 test ready");
}

void loop() {
  uint8_t result = soilt_rs485.readHoldingRegisters(0, 2);

  float soilMoisture = 0.0f;
  float soilTemperature = 0.0f;

  if (result == ModbusMaster::ku8MBSuccess) {
    soilMoisture = soilt_rs485.getResponseBuffer(0) / 10.0f;
    soilTemperature = soilt_rs485.getResponseBuffer(1) / 10.0f;
  }

  Serial.print("soil_moisture=");
  Serial.print(soilMoisture, 1);
  Serial.print(",soil_temp=");
  Serial.println(soilTemperature, 1);
  delay(1000);
}`,

    handysense_real_bfarm_sen55_air_i2c_test: `// Handysense real - SEN55 Air Sensor (I2C) Test
// Sensor wiring:
// VCC -> I2C1_VCC, GND -> I2C1_GND, SDA -> I2C1_SDA (GPIO21), SCL -> I2C1_SCL (GPIO22)

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <SensirionI2CSen5x.h>

SensirionI2CSen5x sen5x;
float pm1p0, pm2p5, pm4p0, pm10p0;
float ambientHumidity, ambientTemperature, vocIndex, noxIndex;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  sen5x.begin(Wire);
  sen5x.startMeasurement();
  Serial.println("Handysense real SEN55 I2C test ready");
}

void loop() {
  uint16_t sen55 = sen5x.readMeasuredValues(
    pm1p0, pm2p5, pm4p0, pm10p0,
    ambientHumidity, ambientTemperature, vocIndex, noxIndex
  );

  Serial.print("status=");
  Serial.print((int)sen55);
  Serial.print(",pm1=");
  Serial.print(pm1p0, 1);
  Serial.print(",pm25=");
  Serial.print(pm2p5, 1);
  Serial.print(",pm4=");
  Serial.print(pm4p0, 1);
  Serial.print(",pm10=");
  Serial.print(pm10p0, 1);
  Serial.print(",humidity=");
  Serial.print(ambientHumidity, 1);
  Serial.print(",temp=");
  Serial.print(ambientTemperature, 1);
  Serial.print(",voc=");
  Serial.print(vocIndex, 1);
  Serial.print(",nox=");
  Serial.println(noxIndex, 1);
  delay(1000);
}`,

    handysense_real_bfarm_ultrasonic_rs485_test: `// Handysense real - Ultrasonic Sensor (RS485) Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// The plugin generator passes register 256 to getResponseBuffer(), but that API
// expects a response-buffer index. Index 0 contains Modbus register 256 here.

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster Ultrars485;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  Ultrars485.begin(1, Serial2);

  Serial.println("Handysense real Ultrasonic RS485 test ready");
}

void loop() {
  uint8_t result = Ultrars485.readHoldingRegisters(256, 2);
  float distance = 0.0f;

  if (result == ModbusMaster::ku8MBSuccess) {
    distance = Ultrars485.getResponseBuffer(0) / 10.0f;
  }

  Serial.print("distance=");
  Serial.print(distance, 1);
  Serial.println(" cm");
  delay(1000);
}`,

    handysense_real_bfarm_turbidity_xm3318b_rs485_test: `// Handysense real - Turbidity Sensor XM3318B (RS485) Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// The plugin returns the raw value from holding register 0 without a scale conversion.

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster Turbidity_XM3318B_Rs485;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  Turbidity_XM3318B_Rs485.begin(1, Serial2);

  Serial.println("Handysense real Turbidity XM3318B RS485 test ready");
}

void loop() {
  uint8_t result = Turbidity_XM3318B_Rs485.readHoldingRegisters(0, 1);
  uint16_t turbidityRaw = 0;

  if (result == ModbusMaster::ku8MBSuccess) {
    turbidityRaw = Turbidity_XM3318B_Rs485.getResponseBuffer(0);
  }

  Serial.print("turbidity_raw=");
  Serial.println((int)turbidityRaw);
  delay(1000);
}`,

    handysense_real_bfarm_turbidity_xm8518_rs485_test: `// Handysense real - Turbidity Sensor XM8518 (RS485) Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// The plugin returns the raw value from holding register 0 without a scale conversion.
// The plugin generator has an XM3318 object-name typo; this corrected example uses XM8518 consistently.

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster Turbidity_XM8518_Rs485;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  Turbidity_XM8518_Rs485.begin(1, Serial2);

  Serial.println("Handysense real Turbidity XM8518 RS485 test ready");
}

void loop() {
  uint8_t result = Turbidity_XM8518_Rs485.readHoldingRegisters(0, 1);
  uint16_t turbidityRaw = 0;

  if (result == ModbusMaster::ku8MBSuccess) {
    turbidityRaw = Turbidity_XM8518_Rs485.getResponseBuffer(0);
  }

  Serial.print("turbidity_raw=");
  Serial.println((int)turbidityRaw);
  delay(1000);
}`,

    handysense_real_bfarm_nitrate_isfet_rs485_test: `// Handysense real - Nitrate ISFET Sensor (RS485) Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// The register addresses and scales match generators_NITRATE_ISFET_PLATFORM.js.

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster nitrate_isfet_rs485;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(115200, SERIAL_8N1, RXD, TXD);
  nitrate_isfet_rs485.begin(1, Serial2);

  Serial.println("Handysense real Nitrate ISFET RS485 test ready");
}

void loop() {
  uint8_t result = nitrate_isfet_rs485.readHoldingRegisters(0, 10);

  if (result == ModbusMaster::ku8MBSuccess) {
    float vout = nitrate_isfet_rs485.getResponseBuffer(0) / 10.0f;
    float voutTemperature = nitrate_isfet_rs485.getResponseBuffer(1) / 10.0f;
    float sampleValue = nitrate_isfet_rs485.getResponseBuffer(2) / 10.0f;
    float temperature = nitrate_isfet_rs485.getResponseBuffer(3) / 10.0f;
    float error = nitrate_isfet_rs485.getResponseBuffer(4) / 100.0f;
    float rSquare = nitrate_isfet_rs485.getResponseBuffer(5) / 1000.0f;
    float sensitivity = nitrate_isfet_rs485.getResponseBuffer(6) / 10.0f;
    float std1 = nitrate_isfet_rs485.getResponseBuffer(7) / 100.0f;
    float std2 = nitrate_isfet_rs485.getResponseBuffer(8) / 100.0f;
    float std3 = nitrate_isfet_rs485.getResponseBuffer(9) / 100.0f;

    Serial.print("vout=");
    Serial.print(vout, 1);
    Serial.print(",vout_temp=");
    Serial.print(voutTemperature, 1);
    Serial.print(",sample=");
    Serial.print(sampleValue, 1);
    Serial.print(",temp=");
    Serial.print(temperature, 1);
    Serial.print(",error=");
    Serial.print(error, 2);
    Serial.print(",r_square=");
    Serial.print(rSquare, 3);
    Serial.print(",sensitivity=");
    Serial.print(sensitivity, 1);
    Serial.print(",std1=");
    Serial.print(std1, 2);
    Serial.print(",std2=");
    Serial.print(std2, 2);
    Serial.print(",std3=");
    Serial.println(std3, 2);
  }

  delay(1000);
}`,

    handysense_real_bfarm_tmec_tensio_rs485_test: `// Handysense real - TMEC Tensio Sensor (RS485) Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// Register addresses and scales match generators_Tensio_Rs485.js.

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster TMEC_Tensio_rs485;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  TMEC_Tensio_rs485.begin(1, Serial2);

  Serial.println("Handysense real TMEC Tensio RS485 test ready");
}

void loop() {
  uint8_t result = TMEC_Tensio_rs485.readInputRegisters(0, 6);

  if (result == ModbusMaster::ku8MBSuccess) {
    float temperature = TMEC_Tensio_rs485.getResponseBuffer(1) / 10.0f;
    float humidity = TMEC_Tensio_rs485.getResponseBuffer(2) / 10.0f;
    float light = TMEC_Tensio_rs485.getResponseBuffer(3);
    float voltage = TMEC_Tensio_rs485.getResponseBuffer(5) / 1000.0f;

    Serial.print("temperature=");
    Serial.print(temperature, 1);
    Serial.print(",humidity=");
    Serial.print(humidity, 1);
    Serial.print(",light=");
    Serial.print(light, 0);
    Serial.print(",voltage=");
    Serial.println(voltage, 3);
  }

  delay(1000);
}`,

    handysense_real_bfarm_tmec_analog_test: `// Handysense real - TMEC Analog Sensor Test
// Sensor wiring:
// VCC -> A420_1_VCC, GND -> A420_1_GND, SIG -> A420_1_SIG
// Channel and mapping follow generators_TMEC_Sensor.js.
// Mock example: tmec_analog_uv=2500 maps to tmec_value=50.

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial.println("Handysense real TMEC Analog test ready");
}

void loop() {
  int rawUv = ReadAnalog_MPC3424(1);
  float tmecValue = ReadAnalog_from_MPC3424(1, 0, 5000, 0, 100);

  Serial.print("tmec_analog_uv=");
  Serial.print(rawUv);
  Serial.print(",tmec_value=");
  Serial.println(tmecValue, 2);

  delay(1000);
}`,

    handysense_real_bfarm_water_quality_suite_rs485_test: `// Handysense real - Water Quality Suite (RS485) Test
// Suite wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// The five plugin sensor objects share one RS485 bus and use test slave IDs 1..5.
// The plugin DO generator reads buffer index 5 after requesting only 5 registers;
// this example requests 6 registers so DO temperature is available.

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster Levelrs485;
ModbusMaster PHrs485;
ModbusMaster DOrs485;
ModbusMaster ECrs485;
ModbusMaster ANSrs485;

float wordsToFloat_BE(uint16_t hi, uint16_t lo) {
  uint32_t bits = ((uint32_t)hi << 16) | lo;
  float value;
  memcpy(&value, &bits, sizeof(value));
  return value;
}

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  Levelrs485.begin(1, Serial2);
  PHrs485.begin(2, Serial2);
  DOrs485.begin(3, Serial2);
  ECrs485.begin(4, Serial2);
  ANSrs485.begin(5, Serial2);

  Serial.println("Handysense real Water Quality Suite RS485 test ready");
}

void loop() {
  uint8_t resultLevel = Levelrs485.readHoldingRegisters(0, 5);
  uint8_t resultPh = PHrs485.readHoldingRegisters(0, 2);
  uint8_t resultDo = DOrs485.readHoldingRegisters(0, 6);
  uint8_t resultEc = ECrs485.readHoldingRegisters(0, 2);
  uint8_t resultAns = ANSrs485.readHoldingRegisters(0, 3);

  if (resultLevel == ModbusMaster::ku8MBSuccess &&
      resultPh == ModbusMaster::ku8MBSuccess &&
      resultDo == ModbusMaster::ku8MBSuccess &&
      resultEc == ModbusMaster::ku8MBSuccess &&
      resultAns == ModbusMaster::ku8MBSuccess) {
    float waterLevel = Levelrs485.getResponseBuffer(4) / 1.0f;
    float waterTemperature = PHrs485.getResponseBuffer(0) / 10.0f;
    float ph = PHrs485.getResponseBuffer(1) / 10.0f;
    float dissolvedOxygen = wordsToFloat_BE(
      DOrs485.getResponseBuffer(2),
      DOrs485.getResponseBuffer(3)
    );
    float doTemperature = wordsToFloat_BE(
      DOrs485.getResponseBuffer(4),
      DOrs485.getResponseBuffer(5)
    );
    float ec = ECrs485.getResponseBuffer(1) / 10.0f;
    float ammonia = ANSrs485.getResponseBuffer(0) / 100.0f;
    float ammoniaPh = ANSrs485.getResponseBuffer(1) / 100.0f;
    float ammoniaTemperature = ANSrs485.getResponseBuffer(2) / 10.0f;

    Serial.print("water_level=");
    Serial.print(waterLevel, 1);
    Serial.print(",water_temp=");
    Serial.print(waterTemperature, 1);
    Serial.print(",ph=");
    Serial.print(ph, 1);
    Serial.print(",do=");
    Serial.print(dissolvedOxygen, 2);
    Serial.print(",do_temp=");
    Serial.print(doTemperature, 1);
    Serial.print(",ec=");
    Serial.print(ec, 2);
    Serial.print(",ammonia=");
    Serial.print(ammonia, 2);
    Serial.print(",ans_ph=");
    Serial.print(ammoniaPh, 2);
    Serial.print(",ans_temp=");
    Serial.println(ammoniaTemperature, 1);
  }

  delay(1000);
}`,

    handysense_real_bfarm_tubular_soil_probe_rs485_test: `// Handysense real - Tubular Soil Probe (RS485) Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// Register map follows generators_Tubular_Soil.js: moisture/temperature pairs at 10..50 cm.

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster TubularSoilRs485;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  TubularSoilRs485.begin(1, Serial2);

  Serial.println("Handysense real Tubular Soil Probe RS485 test ready");
}

void loop() {
  uint8_t result = TubularSoilRs485.readHoldingRegisters(0, 10);

  if (result == ModbusMaster::ku8MBSuccess) {
    float moisture10 = TubularSoilRs485.getResponseBuffer(0) / 10.0f;
    float temperature10 = TubularSoilRs485.getResponseBuffer(1) / 10.0f;
    float moisture20 = TubularSoilRs485.getResponseBuffer(2) / 10.0f;
    float temperature20 = TubularSoilRs485.getResponseBuffer(3) / 10.0f;
    float moisture30 = TubularSoilRs485.getResponseBuffer(4) / 10.0f;
    float temperature30 = TubularSoilRs485.getResponseBuffer(5) / 10.0f;
    float moisture40 = TubularSoilRs485.getResponseBuffer(6) / 10.0f;
    float temperature40 = TubularSoilRs485.getResponseBuffer(7) / 10.0f;
    float moisture50 = TubularSoilRs485.getResponseBuffer(8) / 10.0f;
    float temperature50 = TubularSoilRs485.getResponseBuffer(9) / 10.0f;

    Serial.print("m10=");
    Serial.print(moisture10, 1);
    Serial.print(",t10=");
    Serial.print(temperature10, 1);
    Serial.print(",m20=");
    Serial.print(moisture20, 1);
    Serial.print(",t20=");
    Serial.print(temperature20, 1);
    Serial.print(",m30=");
    Serial.print(moisture30, 1);
    Serial.print(",t30=");
    Serial.print(temperature30, 1);
    Serial.print(",m40=");
    Serial.print(moisture40, 1);
    Serial.print(",t40=");
    Serial.print(temperature40, 1);
    Serial.print(",m50=");
    Serial.print(moisture50, 1);
    Serial.print(",t50=");
    Serial.println(temperature50, 1);
  }

  delay(1000);
}`,

    handysense_real_bfarm_air_velocity_sensor_sm3789_test: `// Handysense real - Air Velocity Sensor (SM3789) Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// Generator source: generators_AirVelocity_SM3789_RS485.js

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster AirVelocityRs485;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  AirVelocityRs485.begin(1, Serial2);

  Serial.println("Handysense real Air Velocity Sensor SM3789 test ready");
}

void loop() {
  delay(50);
  uint8_t result = AirVelocityRs485.readHoldingRegisters(0, 1);

  if (result == ModbusMaster::ku8MBSuccess) {
    float airVelocity = AirVelocityRs485.getResponseBuffer(0) / 1.0f;
    Serial.print("air_velocity=");
    Serial.println(airVelocity, 1);
  }

  delay(1000);
}`,

    handysense_real_bfarm_lux120k_rs485_test: `// Handysense real - Lux120k rs485 Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// Generator source: generators_LuxRs485.js

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster lux120k_rs485;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  lux120k_rs485.begin(1, Serial2);

  Serial.println("Handysense real Lux120k rs485 test ready");
}

void loop() {
  uint8_t result = lux120k_rs485.readHoldingRegisters(0, 5);

  if (result == ModbusMaster::ku8MBSuccess) {
    float lux120k = lux120k_rs485.getResponseBuffer(3);
    Serial.print("lux=");
    Serial.println(lux120k, 0);
  }

  delay(1000);
}`,

    handysense_real_bfarm_weather_sensor_test: `// Handysense real - Weather sensor Test
// Sensor wiring:
// VCC -> RS485_24V, GND -> RS485_GND, A+ -> RS485_A (TX2/GPIO17), B- -> RS485_B (RX2/GPIO16)
// Generator source: generators_WTS.js, holding registers 500..509.

#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>

const int RXD = 16;
const int TXD = 17;

ModbusMaster rs485_Weather_HTCo2PLx;

void setup() {
  Serial.begin(115200);
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();

  Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
  rs485_Weather_HTCo2PLx.begin(1, Serial2);

  Serial.println("Handysense real Weather sensor test ready");
}

void loop() {
  uint8_t result = rs485_Weather_HTCo2PLx.readHoldingRegisters(500, 10);

  if (result == ModbusMaster::ku8MBSuccess) {
    float humidity = rs485_Weather_HTCo2PLx.getResponseBuffer(0) / 10.0f;
    float temperature = rs485_Weather_HTCo2PLx.getResponseBuffer(1) / 10.0f;
    float noise = rs485_Weather_HTCo2PLx.getResponseBuffer(2) / 10.0f;
    float co2 = rs485_Weather_HTCo2PLx.getResponseBuffer(3);
    float pressure = rs485_Weather_HTCo2PLx.getResponseBuffer(5);
    float lux = rs485_Weather_HTCo2PLx.getResponseBuffer(7);

    Serial.print("humidity=");
    Serial.print(humidity, 1);
    Serial.print(",temperature=");
    Serial.print(temperature, 1);
    Serial.print(",noise=");
    Serial.print(noise, 1);
    Serial.print(",co2=");
    Serial.print(co2, 0);
    Serial.print(",pressure=");
    Serial.print(pressure, 0);
    Serial.print(",lux=");
    Serial.println(lux, 0);
  }

  delay(1000);
}`,

    handysense_real_sensor_weather_htco2plx_test: `// Handysense real - Weather HTCO2PLX (RS485) Test
// One component covers the Carbon dioxide and Pressure block categories.
#include <HandySense.h>
#include <Arduino.h>
#include <ModbusMaster.h>
ModbusMaster rs485_Weather_HTCo2PLx;
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  rs485_Weather_HTCo2PLx.begin(1, Serial2);
}
void loop() {
  if (rs485_Weather_HTCo2PLx.readHoldingRegisters(500, 10) == ModbusMaster::ku8MBSuccess) {
    float humidity = rs485_Weather_HTCo2PLx.getResponseBuffer(0) / 10.0f;
    float temperature = rs485_Weather_HTCo2PLx.getResponseBuffer(1) / 10.0f;
    float co2 = rs485_Weather_HTCo2PLx.getResponseBuffer(3);
    float pressure = rs485_Weather_HTCo2PLx.getResponseBuffer(5);
    Serial.print("humidity="); Serial.print(humidity, 1);
    Serial.print(",temperature="); Serial.print(temperature, 1);
    Serial.print(",co2="); Serial.print(co2, 0);
    Serial.print(",pressure="); Serial.println(pressure, 0);
  }
  delay(1000);
}`,

    handysense_real_sensor_ph_rs485_test: `// Handysense real - pH Sensor (RS485) Test
#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>
ModbusMaster PHrs485;
void setup() {
  Serial.begin(115200);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  PHrs485.begin(1, Serial2);
}
void loop() {
  if (PHrs485.readHoldingRegisters(0, 2) == ModbusMaster::ku8MBSuccess) {
    float temperature = PHrs485.getResponseBuffer(0) / 10.0f;
    float ph = PHrs485.getResponseBuffer(1) / 10.0f;
    Serial.print("temperature="); Serial.print(temperature, 1);
    Serial.print(",ph="); Serial.println(ph, 1);
  }
  delay(1000);
}`,

    handysense_real_sensor_rain_rs485_test: `// Handysense real - Rain Sensor (RS485) Test
#include <HandySense.h>
#include <Arduino.h>
#include <ModbusMaster.h>
ModbusMaster rs485_rain;
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  rs485_rain.begin(1, Serial2);
}
void loop() {
  if (rs485_rain.readHoldingRegisters(0, 2) == ModbusMaster::ku8MBSuccess) {
    float rain = rs485_rain.getResponseBuffer(0) / 10.0f;
    Serial.print("rain="); Serial.println(rain, 1);
  }
  delay(1000);
}`,

    handysense_real_sensor_wind_speed_rs485_test: `// Handysense real - Wind Speed Sensor (RS485) Test
#include <HandySense.h>
#include <Arduino.h>
#include <ModbusMaster.h>
ModbusMaster rs485_winds;
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  rs485_winds.begin(1, Serial2);
}
void loop() {
  if (rs485_winds.readHoldingRegisters(0, 2) == ModbusMaster::ku8MBSuccess) {
    float windSpeed = rs485_winds.getResponseBuffer(0) / 10.0f;
    Serial.print("wind_speed="); Serial.println(windSpeed, 1);
  }
  delay(1000);
}`,

    handysense_real_sensor_sht31_i2c_test: `// Handysense real - SHT31 Sensor (I2C) Test
#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <SHT31.h>
SHT31 sht31;
void setup() {
  Serial.begin(115200);
  Wire.begin();
  sht31.begin(0x44);
}
void loop() {
  sht31.read();
  Serial.print("temperature="); Serial.print(sht31.getTemperature(), 1);
  Serial.print(",humidity="); Serial.println(sht31.getHumidity(), 1);
  delay(1000);
}`,

    handysense_real_sensor_bh1750_i2c_test: `// Handysense real - BH1750 Sensor (I2C) Test
#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <BH1750.h>
BH1750 lightMeter;
void setup() {
  Serial.begin(115200);
  Wire.begin();
  lightMeter.begin();
}
void loop() {
  float lux = lightMeter.readLightLevel();
  Serial.print("lux="); Serial.println(lux, 1);
  delay(1000);
}`,

    handysense_real_sensor_sht31_rs485_test: `// Handysense real - SHT31 Sensor (RS485) Test
// Generator shape: rs485_sht31Meter.readHoldingRegisters(0, 2)
#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>
ModbusMaster rs485_sht31Meter;
void setup() {
  Serial.begin(115200);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  rs485_sht31Meter.begin(1, Serial2);
}
void loop() {
  if (rs485_sht31Meter.readHoldingRegisters(0, 2) == ModbusMaster::ku8MBSuccess) {
    float temperature = rs485_sht31Meter.getResponseBuffer(0) / 10.0f;
    float humidity = rs485_sht31Meter.getResponseBuffer(1) / 10.0f;
    Serial.print("temperature="); Serial.print(temperature, 1);
    Serial.print(",humidity="); Serial.println(humidity, 1);
  }
  delay(1000);
}`,

    handysense_real_sensor_weight_3kg_rs485_test: `// Handysense real - Weight Sensor 3 kg (RS485) Test
// Generator shape: rs485_weight.readHoldingRegisters(0, 2), value at buffer 1
#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>
ModbusMaster rs485_weight;
void setup() {
  Serial.begin(115200);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  rs485_weight.begin(1, Serial2);
}
void loop() {
  if (rs485_weight.readHoldingRegisters(0, 2) == ModbusMaster::ku8MBSuccess) {
    float weight = rs485_weight.getResponseBuffer(1) + 0;
    Serial.print("weight="); Serial.println(weight, 0);
  }
  delay(1000);
}`,

    handysense_real_sensor_wind_direction_rs485_test: `// Handysense real - Wind Direction Sensor (RS485) Test
// Generator shape: rs485_windd.readHoldingRegisters(0, 2)
#include <HandySense.h>
#include <Arduino.h>
#include <ModbusMaster.h>
ModbusMaster rs485_windd;
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  rs485_windd.begin(1, Serial2);
}
void loop() {
  if (rs485_windd.readHoldingRegisters(0, 2) == ModbusMaster::ku8MBSuccess) {
    float direction = rs485_windd.getResponseBuffer(0) / 10.0f;
    Serial.print("wind_direction="); Serial.println(direction, 1);
  }
  delay(1000);
}`,

    handysense_real_sensor_dt_par485_test: `// Handysense real - DT-Par485 Sensor Test
// Generator shape: rs485_pair.readHoldingRegisters(0, 2)
#include <HandySense.h>
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>
ModbusMaster rs485_pair;
void setup() {
  Serial.begin(115200);
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  rs485_pair.begin(1, Serial2);
}
void loop() {
  if (rs485_pair.readHoldingRegisters(0, 2) == ModbusMaster::ku8MBSuccess) {
    float par = rs485_pair.getResponseBuffer(0);
    Serial.print("par="); Serial.println(par, 0);
  }
  delay(1000);
}`,

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
};

function normalizeBfarmMacroCode(rawCode: string): string {
    if (!rawCode || !hasBfarmMacroMarkers(rawCode)) {
        return rawCode;
    }
    try {
        return convertBfarmMacroToCpp(rawCode);
    } catch (error) {
        console.warn('Failed to normalize BFarm macro code:', error);
        return rawCode;
    }
}

function isBrokenCachedHandysenseRealSixButtonCode(code: string): boolean {
    if (!code) return false;
    return (
        (
            code.includes('const int BUTTON_PINS[4] = {32, 33, 15, 39};')
            && code.includes('const int RELAY_PINS[4] = {25, 4, 12, 13};')
            && code.includes('const char* BUTTON_NAMES[4] = {"B0", "B1", "B2", "B3"};')
        ) || (
            code.includes('Handysense real 6-button test ready')
            && code.includes('lastBootPressed')
            && code.includes('lastButton0Pressed')
        ) || (
            code.includes('Handysense real 6-button test ready')
            && code.includes('digitalRead(BOOT_PIN)')
        ) || (
            code.includes('Handysense real 6-button test ready')
            && code.includes('const int BOOT_PIN = 0;')
            && code.includes('const int BUTTON0_PIN = 32;')
        )
    );
}

function repairCachedHandysenseRealSixButtonCodeIfNeeded(): void {
    const cachedCode = localStorage.getItem('hackCable-webExample-inputCode');
    if (!cachedCode || !isBrokenCachedHandysenseRealSixButtonCode(cachedCode)) return;

    const fixedCode = codeExamples['handysense_real_six_button_test'];

    localStorage.setItem('hackCable-webExample-inputCode', fixedCode);
    localStorage.setItem(EXAMPLE_SELECTION_STORAGE_KEY, 'handysense_real_six_button_test');
    if (codeInput instanceof HTMLTextAreaElement) {
        setCodeEditorValue(fixedCode);
    }
    console.log('Repaired stale cached code for handysense_real_six_button_test.');
}

const codeExamplesSelect = document.getElementById('code-examples') as HTMLSelectElement;
repairCachedHandysenseRealSixButtonCodeIfNeeded();

if (codeExamplesSelect && codeInput instanceof HTMLTextAreaElement) {
    codeExamplesSelect.addEventListener('change', () => {
        const selectedExample = codeExamplesSelect.value;
        if (selectedExample && codeExamples[selectedExample]) {
            setCodeEditorValue(codeExamples[selectedExample]);
            localStorage.setItem('hackCable-webExample-inputCode', getCodeEditorValue());
            localStorage.setItem(EXAMPLE_SELECTION_STORAGE_KEY, selectedExample);
            markCompileStale();
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
                case 'handysense_real_six_button_test':
                    setupHandysenseRealSixButtonTestCircuit();
                    break;
                case 'handysense_real_eight_led_test':
                    setupHandysenseRealEightLedTestCircuit();
                    break;
                case 'handysense_real_buttons_leds_test':
                    setupHandysenseRealButtonsLedsTestCircuit();
                    break;
                case 'handysense_real_bfarm_ph_misting':
                    setupHandysenseRealBfarmPhMistingCircuit();
                    break;
                case 'handysense_real_bfarm_soil_watering':
                    setupHandysenseRealBfarmSoilWateringCircuit();
                    break;
                case 'handysense_real_bfarm_sht31_fan':
                    setupHandysenseRealBfarmSht31FanCircuit();
                    break;
                case 'handysense_real_bfarm_7in1_soil_multiread_test':
                    setupHandysenseRealBfarm7in1SoilMultireadTestCircuit();
                    break;
                case 'handysense_real_bfarm_ammonia_rs485_test':
                    setupHandysenseRealBfarmAmmoniaRs485TestCircuit();
                    break;
                case 'handysense_real_bfarm_soil_temp_multiread_rs485_test':
                    setupHandysenseRealBfarmSoilTempMultireadRs485TestCircuit();
                    break;
                case 'handysense_real_bfarm_sen55_air_i2c_test':
                    setupHandysenseRealBfarmSen55AirI2cTestCircuit();
                    break;
                case 'handysense_real_bfarm_ultrasonic_rs485_test':
                    setupHandysenseRealBfarmUltrasonicRs485TestCircuit();
                    break;
                case 'handysense_real_bfarm_turbidity_xm3318b_rs485_test':
                    setupHandysenseRealBfarmTurbidityXm3318bRs485TestCircuit();
                    break;
                case 'handysense_real_bfarm_turbidity_xm8518_rs485_test':
                    setupHandysenseRealBfarmTurbidityXm8518Rs485TestCircuit();
                    break;
                case 'handysense_real_bfarm_nitrate_isfet_rs485_test':
                    setupHandysenseRealBfarmNitrateIsfetRs485TestCircuit();
                    break;
                case 'handysense_real_bfarm_tmec_tensio_rs485_test':
                    setupHandysenseRealBfarmTmecTensioRs485TestCircuit();
                    break;
                case 'handysense_real_bfarm_tmec_analog_test':
                    setupHandysenseRealBfarmTmecAnalogTestCircuit();
                    break;
                case 'handysense_real_bfarm_water_quality_suite_rs485_test':
                    setupHandysenseRealBfarmWaterQualitySuiteRs485TestCircuit();
                    break;
                case 'handysense_real_bfarm_tubular_soil_probe_rs485_test':
                    setupHandysenseRealBfarmTubularSoilProbeRs485TestCircuit();
                    break;
                case 'handysense_real_bfarm_air_velocity_sensor_sm3789_test':
                    setupHandysenseRealBfarmAirVelocitySensorSm3789TestCircuit();
                    break;
                case 'handysense_real_bfarm_lux120k_rs485_test':
                    setupHandysenseRealBfarmLux120kRs485TestCircuit();
                    break;
                case 'handysense_real_bfarm_weather_sensor_test':
                    setupHandysenseRealBfarmWeatherSensorTestCircuit();
                    break;
                case 'handysense_real_sensor_weather_htco2plx_test':
                    setupHandysenseRealSensorRs485TestCircuit(40, 'Weather HTCO2PLX');
                    break;
                case 'handysense_real_sensor_ph_rs485_test':
                    setupHandysenseRealSensorRs485TestCircuit(35, 'pH RS485');
                    break;
                case 'handysense_real_sensor_rain_rs485_test':
                    setupHandysenseRealSensorRs485TestCircuit(37, 'Rain RS485');
                    break;
                case 'handysense_real_sensor_wind_speed_rs485_test':
                    setupHandysenseRealSensorRs485TestCircuit(38, 'Wind Speed RS485');
                    break;
                case 'handysense_real_sensor_sht31_i2c_test':
                    setupHandysenseRealSensorI2cTestCircuit(41, 'SHT31 I2C');
                    break;
                case 'handysense_real_sensor_bh1750_i2c_test':
                    setupHandysenseRealSensorI2cTestCircuit(42, 'BH1750 I2C');
                    break;
                case 'handysense_real_sensor_sht31_rs485_test':
                    setupHandysenseRealSensorRs485TestCircuit(67, 'SHT31 RS485');
                    break;
                case 'handysense_real_sensor_weight_3kg_rs485_test':
                    setupHandysenseRealSensorRs485TestCircuit(68, 'Weight 3 kg RS485');
                    break;
                case 'handysense_real_sensor_wind_direction_rs485_test':
                    setupHandysenseRealSensorRs485TestCircuit(69, 'Wind Direction RS485');
                    break;
                case 'handysense_real_sensor_dt_par485_test':
                    setupHandysenseRealSensorRs485TestCircuit(70, 'DT-Par485');
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
            }
        }
    });
}


// language

const languageToggle = document.getElementById('language-toggle') as HTMLButtonElement | null;

function normalizeBoardSelection(board: string | null | undefined): 'arduino' | 'esp32' | 'custom-esp32' | 'handysense' | 'handysense-real' | 'handysense-pro' {
    switch (board) {
        case 'arduino':
        case 'esp32':
        case 'custom-esp32':
        case 'handysense':
        case 'handysense-real':
        case 'handysense-pro':
            return board;
        default:
            return 'handysense-real';
    }
}

function isHandysenseBoard(board: string | null | undefined): board is 'handysense' | 'handysense-real' | 'handysense-pro' {
    return board === 'handysense' || board === 'handysense-real' || board === 'handysense-pro';
}

function getHandysenseComponentId(board: string | null | undefined): number {
    if (board === 'handysense') return 50;
    if (board === 'handysense-real') return 51;
    return 28;
}

const updateLanguageToggleLabel = () => {
    if (!languageToggle) return;
    languageToggle.textContent = 'EN';
};

updateLanguageToggleLabel();

languageToggle?.addEventListener("click", async () => {
    await hackCable.changeLanguage('en_us');
    localStorage.setItem(languageStorageKey, 'en_us');
    updateLanguageToggleLabel();
    updateUITranslations();
});

// Board selection
const boardSelect = document.getElementById('board-select') as HTMLSelectElement;

if (boardSelect) {
    // Lock board selection to Handysense real for now.
    boardSelect.value = 'handysense-real';
    localStorage.setItem('hackCable-selectedBoard', 'handysense-real');

    boardSelect.addEventListener('change', () => {
        const selectedBoard = normalizeBoardSelection(boardSelect.value);
        if (selectedBoard !== 'handysense-real') {
            boardSelect.value = 'handysense-real';
            localStorage.setItem('hackCable-selectedBoard', 'handysense-real');
            return;
        }
        console.log(`Board changed to: ${selectedBoard}`);

        // Save selection to localStorage
        localStorage.setItem('hackCable-selectedBoard', selectedBoard);

        // Clear existing circuit
        if (confirm('Switching boards will clear your current circuit. Continue?')) {
            hackCable.editor.canvas.clear();
            localStorage.removeItem('savedEditor');

            // Setup new board
            setTimeout(() => {
                setupBoardForNewCircuit(selectedBoard, true);
                scheduleInitialViewportCenter();
            }, 100);
        } else {
            // Revert dropdown to previous value
            const currentBoard = normalizeBoardSelection(localStorage.getItem('hackCable-selectedBoard'));
            boardSelect.value = currentBoard;
        }
    });
}

// Auto-setup: Create ESP32 board with LED on pin 2
function setupESP32Circuit() {
    console.log("Setting up ESP32 with LED on pin D2...");

    // Create ESP32 (component id: 26)
    const esp32Figure = new ComponentFigure(wokwiComponentById[26]);
    hackCable.editor.canvas.add(esp32Figure.setX(900).setY(600));

    // Create LED (component id: 1)
    const ledFigure = new ComponentFigure(wokwiComponentById[1]);
    hackCable.editor.canvas.add(ledFigure.setX(500).setY(200));

    positionBoardForInitialViewport(esp32Figure, ({ x, y }) => {
        ledFigure.setX(x + 300).setY(y + 100);
    });

    // Wait for components to be fully rendered before wiring
    setTimeout(() => {
        try {
            // Connect LED anode to ESP32 pin D2 (GPIO2)
            const pin2Port = esp32Figure.getPortByName("D2");
            const ledAnodePort = ledFigure.getPortByName("A");

            if (pin2Port && ledAnodePort) {
                let connection1 = new draw2d.Connection();
                connection1.setRouter(new draw2d.layout.connection.InteractiveManhattanConnectionRouter());
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
                connection2.setRouter(new draw2d.layout.connection.InteractiveManhattanConnectionRouter());
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
    hackCable.editor.canvas.add(customESP32Figure.setX(900).setY(600));

    // Create LED (component id: 1)
    const ledFigure = new ComponentFigure(wokwiComponentById[1]);
    hackCable.editor.canvas.add(ledFigure.setX(500).setY(200));

    positionBoardForInitialViewport(customESP32Figure, ({ x, y }) => {
        ledFigure.setX(x + 300).setY(y + 100);
    });

    // Wait for components to be fully rendered before wiring
    setTimeout(() => {
        try {
            // Connect LED anode to Custom ESP32 pin D2
            const pin2Port = customESP32Figure.getPortByName("D2");
            const ledAnodePort = ledFigure.getPortByName("A");

            if (pin2Port && ledAnodePort) {
                let connection1 = new draw2d.Connection();
                connection1.setRouter(new draw2d.layout.connection.InteractiveManhattanConnectionRouter());
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
                connection2.setRouter(new draw2d.layout.connection.InteractiveManhattanConnectionRouter());
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

// Auto-setup: Create Handysense / Handysense real / Handysense pro board
function setupHandysenseCircuit(board: 'handysense' | 'handysense-real' | 'handysense-pro' = 'handysense') {
    const componentId = getHandysenseComponentId(board);
    const boardLabel = board === 'handysense'
        ? 'Handysense'
        : board === 'handysense-real'
            ? 'Handysense real'
            : 'Handysense pro';
    console.log(`Setting up ${boardLabel} board...`);

    const handysenseFigure = new ComponentFigure(wokwiComponentById[componentId]);
    hackCable.editor.canvas.add(handysenseFigure.setX(900).setY(600));
    positionBoardForInitialViewport(handysenseFigure);

    console.log(`${boardLabel} board added to circuit.`);
}

function selectBoardForExample(board: 'arduino' | 'esp32' | 'custom-esp32' | 'handysense' | 'handysense-real' | 'handysense-pro') {
    if (boardSelect) {
        boardSelect.value = board;
    }
    localStorage.setItem('hackCable-selectedBoard', board);
    updateCompilerVisibility();
    markCompileStale();
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
        connection.setRouter(new draw2d.layout.connection.InteractiveManhattanConnectionRouter());
        connection.setSource(sourcePort);
        connection.setTarget(targetPort);
        connection.installEditPolicy(new DisconnectableConnectionPolicy());
        hackCable.editor.canvas.add(connection);
        console.log(`Connected ${sourcePortName} to ${targetPortName}`);
    } else {
        console.error(`Could not find ports: ${sourcePortName} or ${targetPortName}`);
    }
}

type AutoCircuitKind =
    | 'buzzer'
    | 'fan'
    | 'water-pump'
    | 'misting-pump'
    | 'servo'
    | 'ultrasonic'
    | 'ky040'
    | 'ntc'
    | 'rgb-led'
    | 'neopixel'
    | 'led-ring'
    | 'lcd1602'
    | 'lcd2004'
    | 'ds1307'
    | 'rs485-ph'
    | 'soil-moisture'
    | 'sht31';

type AutoCircuitPlanItem = {
    kind: AutoCircuitKind;
    dedupeKey: string;
    pin?: number;
    pinA?: number;
    pinB?: number;
    pinC?: number;
};

type AutoCircuitPlan = {
    items: AutoCircuitPlanItem[];
    unsupported: string[];
    notes: string[];
};

type AutoCircuitBoardMode = 'esp32' | 'handysense-real';

const AUTO_CIRCUIT_COMPONENT_IDS: Record<AutoCircuitKind, number> = {
    'buzzer': 9,
    'fan': 33,
    'water-pump': 32,
    'misting-pump': 31,
    'servo': 21,
    'ultrasonic': 17,
    'ky040': 22,
    'ntc': 18,
    'rgb-led': 2,
    'neopixel': 4,
    'led-ring': 6,
    'lcd1602': 7,
    'lcd2004': 8,
    'ds1307': 25,
    'rs485-ph': 35,
    'soil-moisture': 44,
    'sht31': 41,
};

function pushAutoCircuitItem(plan: AutoCircuitPlan, item: AutoCircuitPlanItem): void {
    if (plan.items.some(existing => existing.dedupeKey === item.dedupeKey)) {
        return;
    }
    plan.items.push(item);
}

function pushAutoCircuitNotice(target: string[], message: string): void {
    if (!target.includes(message)) {
        target.push(message);
    }
}

function getAutoCircuitBoardMode(board: string | null | undefined): AutoCircuitBoardMode {
    return board === 'handysense-real' ? 'handysense-real' : 'esp32';
}

function getAutoCircuitBoardLabel(boardMode: AutoCircuitBoardMode): string {
    return boardMode === 'handysense-real' ? 'Handysense real' : 'ESP32';
}

function getAutoCircuitBoardComponentId(boardMode: AutoCircuitBoardMode): number {
    return boardMode === 'handysense-real' ? 51 : 26;
}

function getAutoCircuitSupportedKinds(boardMode: AutoCircuitBoardMode): Set<AutoCircuitKind> {
    if (boardMode === 'handysense-real') {
        return new Set<AutoCircuitKind>([
            'fan',
            'water-pump',
            'misting-pump',
            'lcd1602',
            'lcd2004',
            'ds1307',
            'rs485-ph',
            'soil-moisture',
            'sht31',
        ]);
    }
    return new Set<AutoCircuitKind>([
        'buzzer',
        'fan',
        'water-pump',
        'misting-pump',
        'servo',
        'ultrasonic',
        'ky040',
        'ntc',
        'rgb-led',
        'neopixel',
        'led-ring',
        'lcd1602',
        'lcd2004',
        'ds1307',
    ]);
}

function getAutoCircuitSelectedBoard(): ReturnType<typeof normalizeBoardSelection> {
    const boardValue = boardSelect?.value ?? localStorage.getItem('hackCable-selectedBoard');
    return normalizeBoardSelection(boardValue);
}

function filterAutoCircuitPlanForBoard(plan: AutoCircuitPlan, boardMode: AutoCircuitBoardMode): AutoCircuitPlan {
    const supportedKinds = getAutoCircuitSupportedKinds(boardMode);
    const filteredItems = plan.items.filter((item) => supportedKinds.has(item.kind));
    const droppedKinds = [...new Set(
        plan.items
            .filter((item) => !supportedKinds.has(item.kind))
            .map((item) => item.kind)
    )];

    const filteredPlan: AutoCircuitPlan = {
        items: filteredItems,
        unsupported: [...plan.unsupported],
        notes: [...plan.notes],
    };

    if (droppedKinds.length > 0) {
        pushAutoCircuitNotice(
            filteredPlan.notes,
            `${getAutoCircuitBoardLabel(boardMode)} auto-build does not wire ${droppedKinds.join(', ')} yet.`
        );
    }

    return filteredPlan;
}

function parseNamedPinConstants(source: string): Map<string, number> {
    const pinConstants = new Map<string, number>();
    const pinConstRegex = /(?:const\s+)?(?:static\s+)?(?:constexpr\s+)?(?:uint8_t|int|byte)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\d+)\s*;/g;
    let match: RegExpExecArray | null;
    while ((match = pinConstRegex.exec(source)) !== null) {
        pinConstants.set(match[1], Number.parseInt(match[2], 10));
    }
    return pinConstants;
}

function sourceUsesPinSymbol(source: string, symbol: string): boolean {
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b(?:pinMode|digitalWrite|digitalRead|analogRead|analogWrite)\\s*\\(\\s*${escaped}\\b`).test(source);
}

function resolvePinReference(token: string, pinConstants: Map<string, number>): number | null {
    if (/^\d+$/.test(token)) {
        return Number.parseInt(token, 10);
    }
    if (pinConstants.has(token)) {
        return pinConstants.get(token) ?? null;
    }
    return null;
}

function collectResolvedPinsFromCall(source: string, callRegex: RegExp, pinConstants: Map<string, number>): Set<number> {
    const resolvedPins = new Set<number>();
    let match: RegExpExecArray | null;
    while ((match = callRegex.exec(source)) !== null) {
        const pin = resolvePinReference(match[1], pinConstants);
        if (pin !== null) {
            resolvedPins.add(pin);
        }
    }
    return resolvedPins;
}

function hasDirectOutputWriteForPin(source: string, pin: number, pinConstants: Map<string, number>): boolean {
    const pinModeRegex = /pinMode\s*\(\s*([A-Za-z_][A-Za-z0-9_]*|\d+)\s*,\s*OUTPUT\s*\)/g;
    const digitalWriteRegex = /digitalWrite\s*\(\s*([A-Za-z_][A-Za-z0-9_]*|\d+)\s*,/g;
    const outputPins = collectResolvedPinsFromCall(source, pinModeRegex, pinConstants);
    const drivenPins = collectResolvedPinsFromCall(source, digitalWriteRegex, pinConstants);
    return outputPins.has(pin) && drivenPins.has(pin);
}

function hasSht31Context(source: string): boolean {
    const hasSht31Instance = /\bSHT31\s+[A-Za-z_][A-Za-z0-9_]*\b/.test(source) || /Handysense real - BFARM SHT31/.test(source);
    const hasSht31ReadUsage = /\b(?:getTemperature|getHumidity)\s*\(/.test(source);
    return hasSht31Instance && hasSht31ReadUsage;
}

function pushNamedActuatorItems(plan: AutoCircuitPlan, source: string): void {
    const pinConstants = parseNamedPinConstants(source);
    pinConstants.forEach((pin, symbol) => {
        if (!sourceUsesPinSymbol(source, symbol)) {
            return;
        }

        const upperSymbol = symbol.toUpperCase();
        if (upperSymbol.includes('MIST') && upperSymbol.includes('PUMP')) {
            pushAutoCircuitItem(plan, { kind: 'misting-pump', dedupeKey: `misting-pump:${pin}`, pin });
            return;
        }
        if (upperSymbol.includes('WATER') && upperSymbol.includes('PUMP')) {
            pushAutoCircuitItem(plan, { kind: 'water-pump', dedupeKey: `water-pump:${pin}`, pin });
            return;
        }
        if (upperSymbol.includes('FAN')) {
            pushAutoCircuitItem(plan, { kind: 'fan', dedupeKey: `fan:${pin}`, pin });
            return;
        }
        if (upperSymbol.includes('BUZZER')) {
            pushAutoCircuitItem(plan, { kind: 'buzzer', dedupeKey: `buzzer:${pin}`, pin });
        }
    });
}

function pushCommentMappedActuatorItems(plan: AutoCircuitPlan, source: string): void {
    const commentMappings: Array<{ regex: RegExp; kind: AutoCircuitKind }> = [
        { regex: /\/\/\s*Misting Pump SIG\s*->.*?\(GPIO\s*(\d+)\)/gi, kind: 'misting-pump' },
        { regex: /\/\/\s*Water Pump SIG\s*->.*?\(GPIO\s*(\d+)\)/gi, kind: 'water-pump' },
        { regex: /\/\/\s*Fan SIG\s*->.*?\(GPIO\s*(\d+)\)/gi, kind: 'fan' },
        { regex: /\/\/\s*Buzzer(?:\s+SIG)?\s*->.*?\(GPIO\s*(\d+)\)/gi, kind: 'buzzer' },
    ];

    commentMappings.forEach(({ regex, kind }) => {
        let match: RegExpExecArray | null;
        while ((match = regex.exec(source)) !== null) {
            const pin = Number.parseInt(match[1], 10);
            pushAutoCircuitItem(plan, { kind, dedupeKey: `${kind}:${pin}`, pin });
        }
    });
}

function parseAutoCircuitPlan(rawCode: string, selectedBoard: ReturnType<typeof normalizeBoardSelection>): AutoCircuitPlan {
    const source = normalizeBfarmMacroCode(rawCode);
    const boardMode = getAutoCircuitBoardMode(selectedBoard);
    const pinConstants = parseNamedPinConstants(source);
    const plan: AutoCircuitPlan = {
        items: [],
        unsupported: [],
        notes: [],
    };

    let match: RegExpExecArray | null;

    const servoRegex = /Servo\s+servo_pin(\d+)\s*;/g;
    while ((match = servoRegex.exec(source)) !== null) {
        const pin = Number.parseInt(match[1], 10);
        pushAutoCircuitItem(plan, { kind: 'servo', dedupeKey: `servo:${pin}`, pin });
    }

    const ultrasonicRegex = /pinMode\((\d+),\s*OUTPUT\);\s*pinMode\((\d+),\s*INPUT\);[\s\S]{0,240}?pulseIn\(\2,\s*HIGH\)/g;
    while ((match = ultrasonicRegex.exec(source)) !== null) {
        const trigPin = Number.parseInt(match[1], 10);
        const echoPin = Number.parseInt(match[2], 10);
        pushAutoCircuitItem(plan, {
            kind: 'ultrasonic',
            dedupeKey: `ultrasonic:${trigPin}:${echoPin}`,
            pinA: trigPin,
            pinB: echoPin,
        });
    }

    const ky040Regex = /ky040_counter_(\d+)[\s\S]{0,260}?pinMode\((\d+),\s*INPUT\);\s*pinMode\((\d+),\s*INPUT\);/g;
    while ((match = ky040Regex.exec(source)) !== null) {
        const clkPin = Number.parseInt(match[2], 10);
        const dtPin = Number.parseInt(match[3], 10);
        pushAutoCircuitItem(plan, {
            kind: 'ky040',
            dedupeKey: `ky040:${clkPin}:${dtPin}`,
            pinA: clkPin,
            pinB: dtPin,
        });
    }

    const ntcRegex = /NTC_BETA_(\d+)/g;
    while ((match = ntcRegex.exec(source)) !== null) {
        const pin = Number.parseInt(match[1], 10);
        pushAutoCircuitItem(plan, { kind: 'ntc', dedupeKey: `ntc:${pin}`, pin });
    }

    const rgbRegex = /analogWrite\((\d+),\s*[^;]+\);\s*analogWrite\((\d+),\s*[^;]+\);\s*analogWrite\((\d+),\s*[^;]+\);/g;
    while ((match = rgbRegex.exec(source)) !== null) {
        const rPin = Number.parseInt(match[1], 10);
        const gPin = Number.parseInt(match[2], 10);
        const bPin = Number.parseInt(match[3], 10);
        pushAutoCircuitItem(plan, {
            kind: 'rgb-led',
            dedupeKey: `rgb:${rPin}:${gPin}:${bPin}`,
            pinA: rPin,
            pinB: gPin,
            pinC: bPin,
        });
    }

    const neopixelRegex = /Adafruit_NeoPixel\s+neopixel_(\d+)\s*\(\s*\d+\s*,\s*(\d+)\s*,/g;
    while ((match = neopixelRegex.exec(source)) !== null) {
        const pin = Number.parseInt(match[2], 10);
        pushAutoCircuitItem(plan, { kind: 'neopixel', dedupeKey: `neopixel:${pin}`, pin });
    }

    const ledRingRegex = /Adafruit_NeoPixel\s+ledring_(\d+)\s*\(\s*\d+\s*,\s*(\d+)\s*,/g;
    while ((match = ledRingRegex.exec(source)) !== null) {
        const pin = Number.parseInt(match[2], 10);
        pushAutoCircuitItem(plan, { kind: 'led-ring', dedupeKey: `led-ring:${pin}`, pin });
    }

    const lcdRegex = /LiquidCrystal_I2C\s+lcd_i2c\s*\(\s*0x27\s*,\s*(16|20)\s*,\s*(2|4)\s*\)/g;
    while ((match = lcdRegex.exec(source)) !== null) {
        const cols = Number.parseInt(match[1], 10);
        const rows = Number.parseInt(match[2], 10);
        const kind: AutoCircuitKind = cols === 20 || rows === 4 ? 'lcd2004' : 'lcd1602';
        pushAutoCircuitItem(plan, { kind, dedupeKey: kind });
    }

    if (/RTC_DS1307\s+rtc_ds1307\b/.test(source)) {
        pushAutoCircuitItem(plan, { kind: 'ds1307', dedupeKey: 'ds1307' });
    }

    pushNamedActuatorItems(plan, source);
    pushCommentMappedActuatorItems(plan, source);

    if (/ModbusMaster\s+phSensor\b/.test(source) || /Handysense real - BFARM RS485 pH/.test(source)) {
        pushAutoCircuitItem(plan, { kind: 'rs485-ph', dedupeKey: 'rs485-ph' });
    }

    if (/soilPercent\s*=\s*map\(/.test(source) || /Handysense real - BFARM Soil Moisture/.test(source)) {
        pushAutoCircuitItem(plan, { kind: 'soil-moisture', dedupeKey: 'soil-moisture' });
    }

    if (hasSht31Context(source)) {
        pushAutoCircuitItem(plan, { kind: 'sht31', dedupeKey: 'sht31' });
    }

    if (
        boardMode === 'handysense-real'
        && !plan.items.some((item) => item.kind === 'misting-pump')
        && /pinMode\(\s*25\s*,\s*OUTPUT\s*\)/.test(source)
        && /digitalWrite\(\s*25\s*,/.test(source)
    ) {
        pushAutoCircuitItem(plan, { kind: 'misting-pump', dedupeKey: 'misting-pump:25', pin: 25 });
    }

    if (
        boardMode === 'handysense-real'
        && hasSht31Context(source)
        && hasDirectOutputWriteForPin(source, 4, pinConstants)
    ) {
        pushAutoCircuitItem(plan, { kind: 'fan', dedupeKey: 'fan:4', pin: 4 });
    }

    if (/MCP23008\b/.test(source)) {
        pushAutoCircuitNotice(plan.unsupported, 'MCP23008 LED expander blocks are not mapped to a canvas component yet.');
    }
    if (/Grove_LED_Bar\b/.test(source)) {
        pushAutoCircuitNotice(plan.unsupported, 'Grove LED Bar blocks are not mapped yet because the canvas only has the raw LED bar display.');
    }
    if (/TM1637Display\b/.test(source)) {
        pushAutoCircuitNotice(plan.unsupported, 'TM1637 seven-segment blocks are not mapped yet because the canvas does not have the TM1637 module component.');
    }
    if (/sw_onboard\[|const_relay_pin\[/.test(source)) {
        if (boardMode === 'handysense-real') {
            pushAutoCircuitNotice(
                plan.notes,
                'Handysense real relay helpers were detected. Relay channels can be recognized, but unlabeled external loads on GPIO4/GPIO12/GPIO13 may still need manual placement.'
            );
        } else {
            pushAutoCircuitNotice(plan.unsupported, 'Board-specific sw_onboard/relay helper blocks still need a dedicated HandySense auto-builder.');
        }
    }
    if (/analogRead\(|digitalRead\(/.test(source)) {
        const note = boardMode === 'handysense-real'
            ? 'Handysense real can infer some fixed sensor and relay channels, but plain analogRead/digitalRead code may still need manual component placement.'
            : 'Plain analogRead/digitalRead/digitalWrite blocks are ambiguous in text code, so generic inputs and outputs may still need manual placement.';
        pushAutoCircuitNotice(plan.notes, note);
    } else if (plan.items.length === 0 && /digitalWrite\(/.test(source)) {
        const note = boardMode === 'handysense-real'
            ? 'Handysense real digital outputs on GPIO4/GPIO12/GPIO13 are still ambiguous from plain text code, so some external loads may need manual placement.'
            : 'Plain digital output blocks are ambiguous in text code, so actuators like buzzer, fan, and pumps may still need manual placement.';
        pushAutoCircuitNotice(plan.notes, note);
    }

    return plan;
}

function getEsp32PortNameForPin(pin: number): string | null {
    switch (pin) {
        case 1: return 'TX0';
        case 2: return 'D2';
        case 3: return 'RX0';
        case 4: return 'D4';
        case 5: return 'D5';
        case 12: return 'D12';
        case 13: return 'D13';
        case 14: return 'D14';
        case 15: return 'D15';
        case 16: return 'RX2';
        case 17: return 'TX2';
        case 18: return 'D18';
        case 19: return 'D19';
        case 21: return 'D21';
        case 22: return 'D22';
        case 23: return 'D23';
        case 25: return 'D25';
        case 26: return 'D26';
        case 27: return 'D27';
        case 32: return 'D32';
        case 33: return 'D33';
        case 34: return 'D34';
        case 35: return 'D35';
        case 36: return 'VP';
        case 39: return 'VN';
        default: return null;
    }
}

function nextAutoCircuitPosition(index: number): { x: number; y: number } {
    const column = index % 2;
    const row = Math.floor(index / 2);
    return {
        x: 520 + column * 240,
        y: 70 + row * 150,
    };
}

function showPlainStatus(message: string, type: 'info' | 'success' | 'error', autoHideMs = 0): void {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    if (autoHideMs > 0) {
        setTimeout(() => {
            if (statusMessage.textContent === message) {
                statusMessage.textContent = '';
                statusMessage.className = 'status-message';
            }
        }, autoHideMs);
    }
}

function autoWireCircuitPlanItem(
    boardMode: AutoCircuitBoardMode,
    boardFigure: ComponentFigure,
    componentFigure: ComponentFigure,
    item: AutoCircuitPlanItem,
    warnings: string[],
): void {
    if (boardMode === 'handysense-real') {
        switch (item.kind) {
            case 'misting-pump':
                connectPorts(componentFigure, 'VCC', boardFigure, 'RELAY5V_VIN');
                connectPorts(componentFigure, 'GND', boardFigure, 'RELAY5V_GND');
                connectPorts(componentFigure, 'SIG', boardFigure, 'LEDR_0');
                return;
            case 'fan':
            case 'water-pump':
                connectPorts(componentFigure, 'VCC', boardFigure, 'RELAY5V_VIN');
                connectPorts(componentFigure, 'GND', boardFigure, 'RELAY5V_GND');
                connectPorts(componentFigure, 'SIG', boardFigure, 'LEDR_1');
                return;
            case 'lcd1602':
            case 'lcd2004':
                connectPorts(componentFigure, 'VCC', boardFigure, 'I2C1_VCC');
                connectPorts(componentFigure, 'GND', boardFigure, 'I2C1_GND');
                connectPorts(componentFigure, 'SDA', boardFigure, 'I2C1_SDA');
                connectPorts(componentFigure, 'SCL', boardFigure, 'I2C1_SCL');
                return;
            case 'ds1307':
                connectPorts(componentFigure, '5V', boardFigure, 'I2C1_VCC');
                connectPorts(componentFigure, 'GND', boardFigure, 'I2C1_GND');
                connectPorts(componentFigure, 'SDA', boardFigure, 'I2C1_SDA');
                connectPorts(componentFigure, 'SCL', boardFigure, 'I2C1_SCL');
                return;
            case 'rs485-ph':
                connectPorts(componentFigure, 'VCC', boardFigure, 'RS485_24V');
                connectPorts(componentFigure, 'GND', boardFigure, 'RS485_GND');
                connectPorts(componentFigure, 'A+', boardFigure, 'RS485_A');
                connectPorts(componentFigure, 'B-', boardFigure, 'RS485_B');
                return;
            case 'soil-moisture':
                connectPorts(componentFigure, 'VCC', boardFigure, 'A05_1_VCC');
                connectPorts(componentFigure, 'GND', boardFigure, 'A05_1_GND');
                connectPorts(componentFigure, 'AO', boardFigure, 'A05_1_SIG');
                return;
            case 'sht31':
                connectPorts(componentFigure, 'VCC', boardFigure, 'I2C1_VCC');
                connectPorts(componentFigure, 'GND', boardFigure, 'I2C1_GND');
                connectPorts(componentFigure, 'SDA', boardFigure, 'I2C1_SDA');
                connectPorts(componentFigure, 'SCL', boardFigure, 'I2C1_SCL');
                return;
            default:
                pushAutoCircuitNotice(warnings, `${getAutoCircuitBoardLabel(boardMode)} auto-build cannot wire ${item.kind} yet.`);
                return;
        }
    }

    const connectBoardPin = (componentPortName: string, pin: number | undefined): void => {
        if (pin === undefined) return;
        const boardPortName = getEsp32PortNameForPin(pin);
        if (!boardPortName) {
            pushAutoCircuitNotice(warnings, `GPIO ${pin} is not available on the ESP32 DevKit auto-builder.`);
            return;
        }
        connectPorts(componentFigure, componentPortName, boardFigure, boardPortName);
    };

    switch (item.kind) {
        case 'buzzer':
            connectBoardPin('1', item.pin);
            connectPorts(componentFigure, '2', boardFigure, 'GND.1');
            return;
        case 'fan':
        case 'water-pump':
        case 'misting-pump':
            connectPorts(componentFigure, 'VCC', boardFigure, 'VIN');
            connectPorts(componentFigure, 'GND', boardFigure, 'GND.1');
            connectBoardPin('SIG', item.pin);
            return;
        case 'servo':
            connectPorts(componentFigure, 'V+', boardFigure, 'VIN');
            connectPorts(componentFigure, 'GND', boardFigure, 'GND.1');
            connectBoardPin('PWM', item.pin);
            return;
        case 'ultrasonic':
            connectPorts(componentFigure, 'VCC', boardFigure, 'VIN');
            connectPorts(componentFigure, 'GND', boardFigure, 'GND.1');
            connectBoardPin('TRIG', item.pinA);
            connectBoardPin('ECHO', item.pinB);
            return;
        case 'ky040':
            connectPorts(componentFigure, 'VCC', boardFigure, '3V3');
            connectPorts(componentFigure, 'GND', boardFigure, 'GND.1');
            connectBoardPin('CLK', item.pinA);
            connectBoardPin('DT', item.pinB);
            return;
        case 'ntc':
            connectPorts(componentFigure, 'VCC', boardFigure, '3V3');
            connectPorts(componentFigure, 'GND', boardFigure, 'GND.1');
            connectBoardPin('OUT', item.pin);
            return;
        case 'rgb-led':
            connectPorts(componentFigure, 'COM', boardFigure, 'GND.1');
            connectBoardPin('R', item.pinA);
            connectBoardPin('G', item.pinB);
            connectBoardPin('B', item.pinC);
            return;
        case 'neopixel':
            connectPorts(componentFigure, 'VDD', boardFigure, 'VIN');
            connectPorts(componentFigure, 'VSS', boardFigure, 'GND.1');
            connectBoardPin('DIN', item.pin);
            return;
        case 'led-ring':
            connectPorts(componentFigure, 'VCC', boardFigure, 'VIN');
            connectPorts(componentFigure, 'GND', boardFigure, 'GND.1');
            connectBoardPin('DIN', item.pin);
            return;
        case 'lcd1602':
        case 'lcd2004':
            connectPorts(componentFigure, 'VCC', boardFigure, 'VIN');
            connectPorts(componentFigure, 'GND', boardFigure, 'GND.1');
            connectPorts(componentFigure, 'SDA', boardFigure, 'D21');
            connectPorts(componentFigure, 'SCL', boardFigure, 'D22');
            return;
        case 'ds1307':
            connectPorts(componentFigure, '5V', boardFigure, 'VIN');
            connectPorts(componentFigure, 'GND', boardFigure, 'GND.1');
            connectPorts(componentFigure, 'SDA', boardFigure, 'D21');
            connectPorts(componentFigure, 'SCL', boardFigure, 'D22');
            return;
        case 'rs485-ph':
        case 'soil-moisture':
        case 'sht31':
            pushAutoCircuitNotice(warnings, `${item.kind} auto-build is only wired on the Handysense real board.`);
            return;
    }
}

function buildCircuitFromCurrentCode(): void {
    const rawCode = getCodeEditorValue().trim();
    if (!rawCode) {
        showPlainStatus('No code found. Add code first, then click Auto.', 'error');
        return;
    }

    const selectedBoard = getAutoCircuitSelectedBoard();
    const boardMode = getAutoCircuitBoardMode(selectedBoard);
    const plan = filterAutoCircuitPlanForBoard(parseAutoCircuitPlan(rawCode, selectedBoard), boardMode);
    if (plan.items.length === 0) {
        const detail = plan.unsupported[0] ?? plan.notes[0] ?? 'No supported circuit patterns were detected in the current code.';
        showPlainStatus(detail, 'error');
        return;
    }

    selectBoardForExample(boardMode === 'handysense-real' ? 'handysense-real' : 'esp32');
    hackCable.editor.canvas.clear();
    const boardFigure = new ComponentFigure(wokwiComponentById[getAutoCircuitBoardComponentId(boardMode)]);
    const boardPosition = boardMode === 'handysense-real'
        ? { x: 180, y: 40 }
        : { x: 200, y: 100 };
    hackCable.editor.canvas.add(boardFigure.setX(boardPosition.x).setY(boardPosition.y));

    const placed: Array<{ item: AutoCircuitPlanItem; figure: ComponentFigure }> = [];
    plan.items.forEach((item, index) => {
        const componentId = AUTO_CIRCUIT_COMPONENT_IDS[item.kind];
        const position = nextAutoCircuitPosition(index);
        const figure = new ComponentFigure(wokwiComponentById[componentId]);
        hackCable.editor.canvas.add(figure.setX(position.x).setY(position.y));
        placed.push({ item, figure });
    });

    setTimeout(() => {
        const warnings = [...plan.unsupported];
        placed.forEach(({ item, figure }) => autoWireCircuitPlanItem(boardMode, boardFigure, figure, item, warnings));

        let message = `Built ${placed.length} component${placed.length === 1 ? '' : 's'} from code on the ${getAutoCircuitBoardLabel(boardMode)} canvas.`;
        if (warnings.length > 0) {
            message += ` ${warnings[0]}`;
        } else if (plan.notes.length > 0) {
            message += ` ${plan.notes[0]}`;
        }
        showPlainStatus(message, warnings.length > 0 ? 'info' : 'success', 4000);
    }, 250);
}

// ============================================
// Handysense Pro Smart Farm Circuit Setup Functions
// ============================================

function setupHandysenseRealSixButtonTestCircuit() {
    console.log("Setting up Handysense real 6-button test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();
    setupHandysenseCircuit('handysense-real');
}

function setupHandysenseRealEightLedTestCircuit() {
    console.log("Setting up Handysense real 8-LED test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();
    setupHandysenseCircuit('handysense-real');
}

function setupHandysenseRealButtonsLedsTestCircuit() {
    console.log("Setting up Handysense real buttons + LEDs test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();
    setupHandysenseCircuit('handysense-real');
}

function setupHandysenseRealBfarmPhMistingCircuit() {
    console.log("Setting up Handysense real BFARM RS485 pH + Misting Pump circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const phSensorFigure = new ComponentFigure(wokwiComponentById[35]);
    hackCable.editor.canvas.add(phSensorFigure.setX(500).setY(60));

    const mistPumpFigure = new ComponentFigure(wokwiComponentById[31]);
    hackCable.editor.canvas.add(mistPumpFigure.setX(500).setY(210));

    setTimeout(() => {
        try {
            connectPorts(phSensorFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(phSensorFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(phSensorFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(phSensorFigure, 'B-', boardFigure, 'RS485_B');

            connectPorts(mistPumpFigure, 'VCC', boardFigure, 'RELAY5V_VIN');
            connectPorts(mistPumpFigure, 'GND', boardFigure, 'RELAY5V_GND');
            connectPorts(mistPumpFigure, 'SIG', boardFigure, 'LEDR_0');

            console.log("Handysense real BFARM RS485 pH + Misting Pump setup complete!");
        } catch (error) {
            console.error("Error during Handysense real BFARM RS485 pH + Misting Pump wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmSoilWateringCircuit() {
    console.log("Setting up Handysense real BFARM Soil Moisture + Water Pump circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const soilSensorFigure = new ComponentFigure(wokwiComponentById[44]);
    hackCable.editor.canvas.add(soilSensorFigure.setX(40).setY(60));

    const waterPumpFigure = new ComponentFigure(wokwiComponentById[32]);
    hackCable.editor.canvas.add(waterPumpFigure.setX(500).setY(210));

    setTimeout(() => {
        try {
            connectPorts(soilSensorFigure, 'VCC', boardFigure, 'A05_1_VCC');
            connectPorts(soilSensorFigure, 'GND', boardFigure, 'A05_1_GND');
            connectPorts(soilSensorFigure, 'AO', boardFigure, 'A05_1_SIG');

            connectPorts(waterPumpFigure, 'VCC', boardFigure, 'RELAY5V_VIN');
            connectPorts(waterPumpFigure, 'GND', boardFigure, 'RELAY5V_GND');
            connectPorts(waterPumpFigure, 'SIG', boardFigure, 'LEDR_1');

            console.log("Handysense real BFARM Soil Moisture + Water Pump setup complete!");
        } catch (error) {
            console.error("Error during Handysense real BFARM Soil Moisture + Water Pump wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmSht31FanCircuit() {
    console.log("Setting up Handysense real BFARM SHT31 + Fan circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const sht31Figure = new ComponentFigure(wokwiComponentById[41]);
    hackCable.editor.canvas.add(sht31Figure.setX(500).setY(60));

    const fanFigure = new ComponentFigure(wokwiComponentById[33]);
    hackCable.editor.canvas.add(fanFigure.setX(500).setY(210));

    setTimeout(() => {
        try {
            connectPorts(sht31Figure, 'VCC', boardFigure, 'I2C1_VCC');
            connectPorts(sht31Figure, 'GND', boardFigure, 'I2C1_GND');
            connectPorts(sht31Figure, 'SDA', boardFigure, 'I2C1_SDA');
            connectPorts(sht31Figure, 'SCL', boardFigure, 'I2C1_SCL');

            connectPorts(fanFigure, 'VCC', boardFigure, 'RELAY5V_VIN');
            connectPorts(fanFigure, 'GND', boardFigure, 'RELAY5V_GND');
            connectPorts(fanFigure, 'SIG', boardFigure, 'LEDR_1');

            console.log("Handysense real BFARM SHT31 + Fan setup complete!");
        } catch (error) {
            console.error("Error during Handysense real BFARM SHT31 + Fan wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarm7in1SoilMultireadTestCircuit() {
    console.log("Setting up Handysense real 7in1Soil MultiRead test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const soil7in1Figure = new ComponentFigure(wokwiComponentById[52]);
    hackCable.editor.canvas.add(soil7in1Figure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(soil7in1Figure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(soil7in1Figure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(soil7in1Figure, 'A+', boardFigure, 'RS485_A');
            connectPorts(soil7in1Figure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real 7in1Soil MultiRead test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real 7in1Soil MultiRead test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmAmmoniaRs485TestCircuit() {
    console.log("Setting up Handysense real Ammonia RS485 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const ammoniaFigure = new ComponentFigure(wokwiComponentById[53]);
    hackCable.editor.canvas.add(ammoniaFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(ammoniaFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(ammoniaFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(ammoniaFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(ammoniaFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real Ammonia RS485 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real Ammonia RS485 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmSoilTempMultireadRs485TestCircuit() {
    console.log("Setting up Handysense real SoilTemp MultiRead RS485 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const soilTempFigure = new ComponentFigure(wokwiComponentById[54]);
    hackCable.editor.canvas.add(soilTempFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(soilTempFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(soilTempFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(soilTempFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(soilTempFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real SoilTemp MultiRead RS485 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real SoilTemp MultiRead RS485 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmSen55AirI2cTestCircuit() {
    console.log("Setting up Handysense real SEN55 I2C test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const sen55Figure = new ComponentFigure(wokwiComponentById[55]);
    hackCable.editor.canvas.add(sen55Figure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(sen55Figure, 'VCC', boardFigure, 'I2C1_VCC');
            connectPorts(sen55Figure, 'GND', boardFigure, 'I2C1_GND');
            connectPorts(sen55Figure, 'SDA', boardFigure, 'I2C1_SDA');
            connectPorts(sen55Figure, 'SCL', boardFigure, 'I2C1_SCL');

            console.log("Handysense real SEN55 I2C test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real SEN55 I2C test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmUltrasonicRs485TestCircuit() {
    console.log("Setting up Handysense real Ultrasonic RS485 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const ultrasonicFigure = new ComponentFigure(wokwiComponentById[56]);
    hackCable.editor.canvas.add(ultrasonicFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(ultrasonicFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(ultrasonicFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(ultrasonicFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(ultrasonicFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real Ultrasonic RS485 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real Ultrasonic RS485 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmTurbidityXm3318bRs485TestCircuit() {
    console.log("Setting up Handysense real Turbidity XM3318B RS485 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const turbidityFigure = new ComponentFigure(wokwiComponentById[57]);
    hackCable.editor.canvas.add(turbidityFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(turbidityFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(turbidityFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(turbidityFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(turbidityFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real Turbidity XM3318B RS485 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real Turbidity XM3318B RS485 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmTurbidityXm8518Rs485TestCircuit() {
    console.log("Setting up Handysense real Turbidity XM8518 RS485 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const turbidityFigure = new ComponentFigure(wokwiComponentById[58]);
    hackCable.editor.canvas.add(turbidityFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(turbidityFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(turbidityFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(turbidityFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(turbidityFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real Turbidity XM8518 RS485 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real Turbidity XM8518 RS485 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmNitrateIsfetRs485TestCircuit() {
    console.log("Setting up Handysense real Nitrate ISFET RS485 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const nitrateFigure = new ComponentFigure(wokwiComponentById[59]);
    hackCable.editor.canvas.add(nitrateFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(nitrateFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(nitrateFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(nitrateFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(nitrateFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real Nitrate ISFET RS485 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real Nitrate ISFET RS485 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmTmecTensioRs485TestCircuit() {
    console.log("Setting up Handysense real TMEC Tensio RS485 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const tensioFigure = new ComponentFigure(wokwiComponentById[60]);
    hackCable.editor.canvas.add(tensioFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(tensioFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(tensioFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(tensioFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(tensioFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real TMEC Tensio RS485 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real TMEC Tensio RS485 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmTmecAnalogTestCircuit() {
    console.log("Setting up Handysense real TMEC Analog test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const sensorFigure = new ComponentFigure(wokwiComponentById[61]);
    hackCable.editor.canvas.add(sensorFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, 'A420_1_VCC');
            connectPorts(sensorFigure, 'GND', boardFigure, 'A420_1_GND');
            connectPorts(sensorFigure, 'SIG', boardFigure, 'A420_1_SIG');

            console.log("Handysense real TMEC Analog test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real TMEC Analog test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmWaterQualitySuiteRs485TestCircuit() {
    console.log("Setting up Handysense real Water Quality Suite RS485 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const sensorFigure = new ComponentFigure(wokwiComponentById[62]);
    hackCable.editor.canvas.add(sensorFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(sensorFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(sensorFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(sensorFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real Water Quality Suite RS485 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real Water Quality Suite RS485 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmTubularSoilProbeRs485TestCircuit() {
    console.log("Setting up Handysense real Tubular Soil Probe RS485 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const sensorFigure = new ComponentFigure(wokwiComponentById[63]);
    hackCable.editor.canvas.add(sensorFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(sensorFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(sensorFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(sensorFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real Tubular Soil Probe RS485 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real Tubular Soil Probe RS485 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmAirVelocitySensorSm3789TestCircuit() {
    console.log("Setting up Handysense real Air Velocity Sensor SM3789 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const sensorFigure = new ComponentFigure(wokwiComponentById[64]);
    hackCable.editor.canvas.add(sensorFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(sensorFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(sensorFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(sensorFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real Air Velocity Sensor SM3789 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real Air Velocity Sensor SM3789 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmLux120kRs485TestCircuit() {
    console.log("Setting up Handysense real Lux120k rs485 test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const sensorFigure = new ComponentFigure(wokwiComponentById[65]);
    hackCable.editor.canvas.add(sensorFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(sensorFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(sensorFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(sensorFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real Lux120k rs485 test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real Lux120k rs485 test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealBfarmWeatherSensorTestCircuit() {
    console.log("Setting up Handysense real Weather sensor test circuit...");
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const sensorFigure = new ComponentFigure(wokwiComponentById[66]);
    hackCable.editor.canvas.add(sensorFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(sensorFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(sensorFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(sensorFigure, 'B-', boardFigure, 'RS485_B');

            console.log("Handysense real Weather sensor test setup complete!");
        } catch (error) {
            console.error("Error during Handysense real Weather sensor test wiring:", error);
        }
    }, 500);
}

function setupHandysenseRealSensorRs485TestCircuit(componentId: number, displayName: string) {
    console.log(`Setting up Handysense real ${displayName} test circuit...`);
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const sensorFigure = new ComponentFigure(wokwiComponentById[componentId]);
    hackCable.editor.canvas.add(sensorFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, 'RS485_24V');
            connectPorts(sensorFigure, 'GND', boardFigure, 'RS485_GND');
            connectPorts(sensorFigure, 'A+', boardFigure, 'RS485_A');
            connectPorts(sensorFigure, 'B-', boardFigure, 'RS485_B');
            console.log(`Handysense real ${displayName} test setup complete!`);
        } catch (error) {
            console.error(`Error during Handysense real ${displayName} test wiring:`, error);
        }
    }, 500);
}

function setupHandysenseRealSensorI2cTestCircuit(componentId: number, displayName: string) {
    console.log(`Setting up Handysense real ${displayName} test circuit...`);
    selectBoardForExample('handysense-real');
    hackCable.editor.canvas.clear();

    const boardFigure = new ComponentFigure(wokwiComponentById[51]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

    const sensorFigure = new ComponentFigure(wokwiComponentById[componentId]);
    hackCable.editor.canvas.add(sensorFigure.setX(500).setY(60));

    setTimeout(() => {
        try {
            connectPorts(sensorFigure, 'VCC', boardFigure, 'I2C1_VCC');
            connectPorts(sensorFigure, 'GND', boardFigure, 'I2C1_GND');
            connectPorts(sensorFigure, 'SDA', boardFigure, 'I2C1_SDA');
            connectPorts(sensorFigure, 'SCL', boardFigure, 'I2C1_SCL');
            console.log(`Handysense real ${displayName} test setup complete!`);
        } catch (error) {
            console.error(`Error during Handysense real ${displayName} test wiring:`, error);
        }
    }, 500);
}

// Example 1: pH Misting Control Circuit Setup (1 sensor + 1 actuator)
function setupPhMistingCircuit() {
    console.log("Setting up pH Misting Control circuit...");
    hackCable.editor.canvas.clear();

    // Create Handysense Pro board (component id: 28)
    const boardFigure = new ComponentFigure(wokwiComponentById[28]);
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
    hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));
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
// postMessage listener: receive code from BFarm and handle shell resize
window.addEventListener('message', (e: MessageEvent) => {
    if (!e.data) return;
    if (e.data.source === 'bfarm' && e.data.type === 'code-sync' && typeof e.data.code === 'string') {
        if (codeInput instanceof HTMLTextAreaElement) {
            setCodeEditorValue(e.data.code);
            localStorage.setItem('hackCable-webExample-inputCode', e.data.code);
            markCompileStale();
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
    if (e.data.source === 'shell' && e.data.type === 'toggle-controlbar') {
        toggleControlBarVisibility();
    }
    if (e.data.source === 'shell' && e.data.type === 'get-controlbar-state') {
        if (controlBarElement) {
            const isHidden = controlBarElement.classList.contains('hidden');
            window.parent.postMessage({ source: 'hackcable', type: 'controlbar-state', hidden: isHidden }, '*');
        }
    }
    if (e.data.source === 'shell' && e.data.type === 'get-canvas-view-state') {
        postCanvasViewState();
    }
    if (e.data.source === 'shell' && e.data.type === 'toggle-canvas-dark-mode') {
        hackCable.editor.canvas.setDarkMode(!hackCable.editor.canvas.isDarkMode());
        postCanvasViewState();
    }
    if (e.data.source === 'shell' && e.data.type === 'toggle-canvas-grid-visible') {
        hackCable.editor.canvas.setGridVisible(!hackCable.editor.canvas.isGridVisible());
        postCanvasViewState();
    }
});

// Transfer code to Blocks page
const transferToBlocksBtn = document.getElementById('transfer-to-blocks');
const autoSyncBlocksCheckbox = document.getElementById('auto-sync-blocks') as HTMLInputElement | null;

function transferToBlocks() {
    if (codeInput instanceof HTMLTextAreaElement) {
        window.parent.postMessage({ source: 'hackcable', type: 'code-sync', code: getCodeEditorValue() }, '*');
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
