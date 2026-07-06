export type WiringValidationSeverity = 'error' | 'warning';

export interface WiringValidationIssue {
    severity: WiringValidationSeverity;
    code: 'board-missing' | 'component-missing' | 'port-missing' | 'wire-missing' | 'wire-mismatch' | 'unsupported-pin' | 'unverified-code';
    message: string;
    component?: string;
    port?: string;
    expected?: string;
    actual?: string;
}

export interface WiringValidationResult {
    canExecute: boolean;
    errors: WiringValidationIssue[];
    warnings: WiringValidationIssue[];
}

type RequiredPortMap = Record<string, string>;

interface StaticWiringProfile {
    key: string;
    label: string;
    className: string | string[];
    patterns: RegExp[];
    ports: RequiredPortMap;
}

interface WiringRequirement {
    key: string;
    label: string;
    className: string | string[];
    ports: RequiredPortMap;
}

interface PinConstants {
    get(name: string): number | undefined;
}

const RS485_PORTS: RequiredPortMap = {
    VCC: 'RS485_24V',
    GND: 'RS485_GND',
    'A+': 'RS485_A',
    'B-': 'RS485_B',
};

const I2C_PORTS: RequiredPortMap = {
    VCC: 'I2C1_VCC',
    GND: 'I2C1_GND',
    SDA: 'I2C1_SDA',
    SCL: 'I2C1_SCL',
};

const STATIC_PROFILES: StaticWiringProfile[] = [
    {
        key: 'rs485-ph', label: 'RS485 pH Sensor', className: 'Rs485PhSensorElement',
        patterns: [/Handysense real - BFARM RS485 pH/i, /\bModbusMaster\s+phSensor\b/, /\bModbusMaster\s+PHrs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'soil-moisture', label: 'Soil Moisture Sensor', className: 'SoilMoistureSensorElement',
        patterns: [/Handysense real - BFARM Soil Moisture/i, /\bsoilPercent\s*=\s*map\s*\(/, /\banalogRead\s*\(\s*SOIL_PIN\s*\)/],
        ports: { VCC: 'A05_1_VCC', GND: 'A05_1_GND', AO: 'A05_1_SIG' },
    },
    {
        key: 'sht31-i2c', label: 'SHT31 Sensor', className: 'Sht31SensorElement',
        patterns: [/\bSHT31\s+[A-Za-z_]\w*\b/, /Handysense real - BFARM SHT31/i], ports: I2C_PORTS,
    },
    {
        key: 'bh1750-i2c', label: 'BH1750 Sensor', className: 'Bh1750SensorElement',
        patterns: [/\bBH1750\s+[A-Za-z_]\w*\b/, /#include\s*[<"]BH1750\.h[>"]/], ports: I2C_PORTS,
    },
    {
        key: 'sen55-i2c', label: 'SEN55 Air Sensor', className: 'BfarmSen55AirI2cElement',
        patterns: [/\bSensirionI2CSen5x\b/, /\bsen5x\b/i], ports: I2C_PORTS,
    },
    {
        key: 'bfarm-7in1', label: '7in1 Soil MultiRead', className: 'Bfarm7in1SoilMultireadElement',
        patterns: [/7in1Soil MultiRead/i, /\bModbusMaster\s+rs485_npk\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-ammonia', label: 'Ammonia RS485 Sensor', className: 'BfarmAmmoniaRs485Element',
        patterns: [/Ammonia Sensor \(RS485\)/i, /\bModbusMaster\s+ANS_rs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-soil-temp', label: 'Soil Temperature RS485 Sensor', className: 'BfarmSoilTempMultireadRs485Element',
        patterns: [/Soil Temp\/Moisture Sensor \(RS485\)/i, /\bModbusMaster\s+soilt_rs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-ultrasonic', label: 'Ultrasonic RS485 Sensor', className: 'BfarmUltrasonicRs485Element',
        patterns: [/Ultrasonic Sensor \(RS485\)/i, /\bModbusMaster\s+Ultrars485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-turbidity-3318', label: 'Turbidity XM3318B Sensor', className: 'BfarmTurbidityXm3318bRs485Element',
        patterns: [/XM3318B/i, /\bModbusMaster\s+Turbidity_XM3318B_Rs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-turbidity-8518', label: 'Turbidity XM8518 Sensor', className: 'BfarmTurbidityXm8518Rs485Element',
        patterns: [/XM8518/i, /\bModbusMaster\s+Turbidity_XM8518_Rs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-nitrate', label: 'Nitrate ISFET Sensor', className: 'BfarmNitrateIsfetRs485Element',
        patterns: [/Nitrate ISFET/i, /\bModbusMaster\s+nitrate_isfet_rs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-tmec-tensio', label: 'TMEC Tensio Sensor', className: 'BfarmTmecTensioRs485Element',
        patterns: [/TMEC Tensio/i, /\bModbusMaster\s+TMEC_Tensio_rs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-tmec-analog', label: 'TMEC Analog Sensor', className: 'BfarmTmecAnalogElement',
        patterns: [/TMEC Analog/i, /ReadAnalog_(?:from_)?MPC3424\s*\(/],
        ports: { VCC: 'A420_1_VCC', GND: 'A420_1_GND', SIG: 'A420_1_SIG' },
    },
    {
        key: 'bfarm-water-quality', label: 'Water Quality Suite', className: 'BfarmWaterQualitySuiteRs485Element',
        patterns: [/Water Quality Suite/i, /\bModbusMaster\s+Levelrs485\b[\s\S]*\bModbusMaster\s+DOrs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-tubular-soil', label: 'Tubular Soil Probe', className: 'BfarmTubularSoilProbeRs485Element',
        patterns: [/Tubular Soil Probe/i, /\bModbusMaster\s+TubularSoilRs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-air-velocity', label: 'Air Velocity Sensor', className: 'BfarmAirVelocitySensorSm3789Element',
        patterns: [/Air Velocity Sensor/i, /\bModbusMaster\s+AirVelocityRs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-lux120k', label: 'Lux120k Sensor', className: 'BfarmLux120kRs485Element',
        patterns: [/Lux120k/i, /\bModbusMaster\s+lux120k_rs485\b/], ports: RS485_PORTS,
    },
    {
        key: 'bfarm-weather', label: 'BFarm Weather Sensor', className: 'BfarmWeatherSensorRs485Element',
        patterns: [/Handysense real - Weather sensor Test/i], ports: RS485_PORTS,
    },
    {
        key: 'weather-htco2plx', label: 'Weather HTCO2PLX Sensor', className: 'WeatherSensorHtco2plxElement',
        patterns: [/Weather HTCO2PLX \(RS485\)/i], ports: RS485_PORTS,
    },
    {
        key: 'sht31-rs485', label: 'SHT31 RS485 Sensor', className: 'Sht31Rs485SensorElement',
        patterns: [/SHT31 Sensor \(RS485\)/i, /\bModbusMaster\s+rs485_sht31Meter\b/], ports: RS485_PORTS,
    },
    {
        key: 'weight-rs485', label: 'Weight Sensor', className: 'Weight3kgRs485SensorElement',
        patterns: [/Weight Sensor 3 kg/i, /\bModbusMaster\s+rs485_weight\b/], ports: RS485_PORTS,
    },
    {
        key: 'wind-direction', label: 'Wind Direction Sensor', className: 'WindDirectionRs485SensorElement',
        patterns: [/Wind Direction Sensor/i, /\bModbusMaster\s+rs485_windd\b/], ports: RS485_PORTS,
    },
    {
        key: 'wind-speed', label: 'Wind Speed Sensor', className: 'Rs485WindSpeedSensorElement',
        patterns: [/Wind Speed Sensor/i, /\bModbusMaster\s+rs485_winds\b/], ports: RS485_PORTS,
    },
    {
        key: 'dt-par485', label: 'DT-Par485 Sensor', className: ['DtPar485SensorElement', 'Rs485LightSensorElement'],
        patterns: [/DT-Par485 Sensor Test/i, /\bModbusMaster\s+rs485_pair\b/], ports: RS485_PORTS,
    },
];

const ONBOARD_INPUT_PINS = new Set([0, 15, 32, 33, 39]);
const ONBOARD_LED_PINS = new Set([2, 5, 18, 19, 21, 22, 23, 27]);
const ONBOARD_RELAY_PINS = new Set([25, 4, 12, 13]);
const ONBOARD_MCP23008_PINS = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
const ACTUATOR_BOARD_PORTS: Record<number, string> = { 25: 'LEDR_0', 4: 'LEDR_1', 12: 'LEDR_2', 13: 'LEDR_3' };

function hasSamePorts(actual: RequiredPortMap, expected: RequiredPortMap): boolean {
    const actualEntries = Object.entries(actual);
    const expectedEntries = Object.entries(expected);
    return actualEntries.length === expectedEntries.length
        && actualEntries.every(([port, boardPort]) => expected[port] === boardPort);
}

function isRs485Requirement(requirement: WiringRequirement): boolean {
    return hasSamePorts(requirement.ports, RS485_PORTS);
}

export function getHandysenseRealCanonicalPorts(kind: string, pin?: number): Readonly<Record<string, string>> | null {
    switch (kind) {
        case 'misting-pump':
        case 'water-pump':
        case 'fan': {
            const defaultPin = kind === 'misting-pump' ? 25 : 4;
            const signalPort = ACTUATOR_BOARD_PORTS[pin ?? defaultPin];
            return signalPort
                ? { VCC: 'RELAY5V_VIN', GND: 'RELAY5V_GND', SIG: signalPort }
                : null;
        }
        case 'rs485-ph':
            return RS485_PORTS;
        case 'soil-moisture':
            return { VCC: 'A05_1_VCC', GND: 'A05_1_GND', AO: 'A05_1_SIG' };
        case 'sht31':
            return I2C_PORTS;
        default:
            return null;
    }
}

function parsePinConstants(source: string): Map<string, number> {
    const constants = new Map<string, number>();
    const declaration = /(?:const\s+)?(?:static\s+)?(?:constexpr\s+)?(?:uint8_t|uint16_t|int|byte)\s+([A-Za-z_]\w*)\s*=\s*(\d+)\s*;/g;
    const define = /^\s*#define\s+([A-Za-z_]\w*)\s+(\d+)\b/gm;
    let match: RegExpExecArray | null;
    while ((match = declaration.exec(source)) !== null) constants.set(match[1], Number.parseInt(match[2], 10));
    while ((match = define.exec(source)) !== null) constants.set(match[1], Number.parseInt(match[2], 10));
    return constants;
}

function parseMcp23008Instances(source: string): Set<string> {
    const instances = new Set<string>();
    const declaration = /\bMCP23008\s+([A-Za-z_]\w*)\s*(?:\([^;]*\))?\s*;/g;
    let match: RegExpExecArray | null;
    while ((match = declaration.exec(source)) !== null) instances.add(match[1]);
    return instances;
}

function resolvePinReference(token: string, constants: PinConstants): number | undefined {
    return /^\d+$/.test(token) ? Number.parseInt(token, 10) : constants.get(token);
}

function collectHardwarePinUsage(source: string, constants: PinConstants, mcp23008Instances: Set<string>): { espPins: Set<number>; mcpPins: Set<number> } {
    const espPins = new Set<number>();
    const mcpPins = new Set<number>();
    const call = /\b(?:([A-Za-z_]\w*)\s*\.\s*)?(digitalRead|digitalWrite|analogRead|analogWrite|pinMode)\s*\(\s*([A-Za-z_]\w*|\d+)/g;
    let match: RegExpExecArray | null;
    while ((match = call.exec(source)) !== null) {
        const pin = resolvePinReference(match[3], constants);
        if (pin === undefined) continue;
        if (match[1] && mcp23008Instances.has(match[1]) && (match[2] === 'digitalRead' || match[2] === 'digitalWrite')) {
            mcpPins.add(pin);
            continue;
        }
        espPins.add(pin);
    }
    return { espPins, mcpPins };
}

function sourceUsesPin(source: string, symbol: string): boolean {
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b(?:pinMode|digitalWrite|digitalRead|analogRead|analogWrite)\\s*\\(\\s*${escaped}\\b`).test(source);
}

function addActuatorRequirements(source: string, constants: PinConstants, requirements: WiringRequirement[], errors: WiringValidationIssue[]): void {
    const actuatorKinds: Array<{ test: (name: string) => boolean; className: string; label: string; key: string }> = [
        { test: name => name.includes('MIST') && name.includes('PUMP'), className: 'MistingPumpElement', label: 'Misting Pump', key: 'misting-pump' },
        { test: name => name.includes('WATER') && name.includes('PUMP'), className: 'WaterPumpElement', label: 'Water Pump', key: 'water-pump' },
        { test: name => name === 'PUMP_PIN' && /soil|irrigation|water/i.test(source), className: 'WaterPumpElement', label: 'Water Pump', key: 'water-pump' },
        { test: name => name.includes('FAN'), className: 'FanElement', label: 'Fan', key: 'fan' },
    ];

    const seen = new Set<string>();
    const knownConstants = constants as Map<string, number>;
    knownConstants.forEach((pin, symbol) => {
        if (!sourceUsesPin(source, symbol)) return;
        const upper = symbol.toUpperCase();
        const kind = actuatorKinds.find(candidate => candidate.test(upper));
        if (!kind || seen.has(kind.key)) return;
        seen.add(kind.key);
        const ports = getHandysenseRealCanonicalPorts(kind.key, pin);
        if (!ports) {
            errors.push({
                severity: 'error', code: 'unsupported-pin', component: kind.label, port: 'SIG',
                expected: `Handysense real actuator GPIO (25, 4, 12 or 13)`, actual: `GPIO${pin}`,
                message: `${kind.label}.SIG: GPIO${pin} ไม่มี terminal actuator ที่รองรับบน Handysense real`,
            });
            return;
        }
        requirements.push({
            key: kind.key, label: kind.label, className: kind.className,
            ports: { ...ports },
        });
    });
}

function extractRequirements(source: string): { requirements: WiringRequirement[]; errors: WiringValidationIssue[]; warnings: WiringValidationIssue[] } {
    const requirements: WiringRequirement[] = [];
    const errors: WiringValidationIssue[] = [];
    const warnings: WiringValidationIssue[] = [];
    const seen = new Set<string>();

    for (const profile of STATIC_PROFILES) {
        if (!profile.patterns.some(pattern => pattern.test(source)) || seen.has(profile.key)) continue;
        seen.add(profile.key);
        requirements.push({ key: profile.key, label: profile.label, className: profile.className, ports: profile.ports });
    }

    const constants = parsePinConstants(source);
    const mcp23008Instances = parseMcp23008Instances(source);
    addActuatorRequirements(source, constants, requirements, errors);

    if (/\bModbusMaster\b/.test(source) && !requirements.some(isRs485Requirement)) {
        requirements.push({
            key: 'generic-rs485',
            label: 'RS485 Sensor',
            className: [],
            ports: RS485_PORTS,
        });
    }

    const hardwareUsage = /\b(?:digitalRead|digitalWrite|analogRead|analogWrite|Wire\.begin|Serial2\.begin|ModbusMaster)\b/.test(source);
    const hardwarePins = collectHardwarePinUsage(source, constants, mcp23008Instances);
    const onlyOnboardEspPins = [...hardwarePins.espPins].every(pin =>
        ONBOARD_INPUT_PINS.has(pin) || ONBOARD_LED_PINS.has(pin) || ONBOARD_RELAY_PINS.has(pin)
    );
    const onlyOnboardMcpPins = [...hardwarePins.mcpPins].every(pin => ONBOARD_MCP23008_PINS.has(pin));
    const usesHandySenseHelpers = /\b(?:setPin_Relay|setPin_SW|setPin_ErrorSensor|setup_HandySense|loop_HandySense|Open_relay|Close_relay)\b/.test(source);
    const onlyOnboardPins = (hardwarePins.espPins.size > 0 || hardwarePins.mcpPins.size > 0) && onlyOnboardEspPins && onlyOnboardMcpPins;
    const onlyBuiltInHandySenseHardware =
        !/\bModbusMaster\b/.test(source) &&
        (usesHandySenseHelpers || mcp23008Instances.size > 0) &&
        onlyOnboardEspPins &&
        onlyOnboardMcpPins;
    if (hardwareUsage && requirements.length === 0 && errors.length === 0 && !onlyOnboardPins && !onlyBuiltInHandySenseHardware) {
        warnings.push({
            severity: 'warning', code: 'unverified-code',
            message: 'ตรวจพบโค้ด hardware ที่ยังระบุชนิดอุปกรณ์หรือ wiring profile ไม่ได้ จึงอนุญาตให้ Execute ต่อ',
        });
    }

    return { requirements, errors, warnings };
}

function getPortName(port: any): string {
    return port?.getLocator?.().portId ?? port?.getName?.() ?? '';
}

function getConnectedBoardPorts(componentPort: any): string[] {
    const names = new Set<string>();
    const connections: any[] = componentPort?.getConnections?.().data ?? [];
    for (const connection of connections) {
        const otherPort = connection.sourcePort === componentPort ? connection.targetPort : connection.sourcePort;
        const otherElement = otherPort?.getParent?.()?.componentElement;
        if (otherElement?.constructor?.name !== 'HandysenseRealBoardElement') continue;
        const name = getPortName(otherPort);
        if (name) names.add(name);
    }
    return [...names];
}

function getRequirementClassNames(requirement: WiringRequirement): string[] {
    return Array.isArray(requirement.className) ? requirement.className : [requirement.className];
}

function scoreFigure(figure: any, ports: RequiredPortMap): number {
    return Object.entries(ports).reduce((score, [componentPort, boardPort]) => {
        const port = figure?.getPortByName?.(componentPort);
        return score + (getConnectedBoardPorts(port).includes(boardPort) ? 1 : 0);
    }, 0);
}

function figureHasPorts(figure: any, ports: RequiredPortMap): boolean {
    return Object.keys(ports).every((portName) => Boolean(figure?.getPortByName?.(portName)));
}

function getRequirementCandidates(requirement: WiringRequirement, figures: any[]): any[] {
    const acceptedClassNames = new Set(getRequirementClassNames(requirement));
    const exactMatches = figures.filter(figure => acceptedClassNames.has(figure?.componentElement?.constructor?.name ?? ''));
    if (exactMatches.length > 0) return exactMatches;
    if (!isRs485Requirement(requirement)) return exactMatches;
    return figures.filter((figure) =>
        figure?.componentElement?.constructor?.name !== 'HandysenseRealBoardElement'
        && figureHasPorts(figure, RS485_PORTS)
    );
}

function validateRequirement(requirement: WiringRequirement, figures: any[], errors: WiringValidationIssue[]): void {
    const candidates = getRequirementCandidates(requirement, figures);
    if (candidates.length === 0) {
        errors.push({
            severity: 'error', code: 'component-missing', component: requirement.label,
            message: `ไม่พบ ${requirement.label} ที่โค้ดใช้งานบน Canvas`,
        });
        return;
    }

    const figure = [...candidates].sort((a, b) => scoreFigure(b, requirement.ports) - scoreFigure(a, requirement.ports))[0];
    for (const [componentPortName, expectedBoardPort] of Object.entries(requirement.ports)) {
        const componentPort = figure?.getPortByName?.(componentPortName);
        if (!componentPort) {
            errors.push({
                severity: 'error', code: 'port-missing', component: requirement.label, port: componentPortName,
                expected: expectedBoardPort,
                message: `${requirement.label}: ไม่พบขา ${componentPortName} บน component`,
            });
            continue;
        }

        const actualBoardPorts = getConnectedBoardPorts(componentPort);
        if (actualBoardPorts.includes(expectedBoardPort)) continue;
        if (actualBoardPorts.length === 0) {
            errors.push({
                severity: 'error', code: 'wire-missing', component: requirement.label, port: componentPortName,
                expected: expectedBoardPort, actual: 'ไม่ได้ต่อสาย',
                message: `${requirement.label}.${componentPortName}: ต้องต่อ ${expectedBoardPort} แต่ยังไม่ได้ต่อสาย`,
            });
            continue;
        }
        errors.push({
            severity: 'error', code: 'wire-mismatch', component: requirement.label, port: componentPortName,
            expected: expectedBoardPort, actual: actualBoardPorts.join(', '),
            message: `${requirement.label}.${componentPortName}: ต้องต่อ ${expectedBoardPort} แต่พบ ${actualBoardPorts.join(', ')}`,
        });
    }
}

export function validateHandysenseRealWiring(source: string, canvas: any): WiringValidationResult {
    const extracted = extractRequirements(source);
    const errors = [...extracted.errors];
    const warnings = [...extracted.warnings];
    const figures: any[] = canvas?.getAllFigures?.() ?? [];
    const hasBoard = figures.some(figure => figure?.componentElement?.constructor?.name === 'HandysenseRealBoardElement');

    if (!hasBoard) {
        errors.unshift({
            severity: 'error', code: 'board-missing', component: 'Handysense real',
            message: 'ไม่พบบอร์ด Handysense real บน Canvas',
        });
    } else {
        for (const requirement of extracted.requirements) validateRequirement(requirement, figures, errors);
    }

    return { canExecute: errors.length === 0, errors, warnings };
}
