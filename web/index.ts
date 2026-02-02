import "./css/main.styl"
import {CompileResult, EmulatorManager, HackCable} from "../src/main";
import {wokwiComponentById} from "../src/panels/component";
import {ComponentFigure} from "../src/editor/component-figure";
import * as draw2d from "draw2d";

console.log("Running HackCable web interface")

const mountingDiv = document.getElementById('hackCable');
if(!mountingDiv) throw new DOMException("Mounting div not found")

const lang = localStorage.getItem('hackCable-webExample-language');
let hackCable = new HackCable(mountingDiv, lang ? lang : 'en_us');

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

    // Only auto-setup if there's no saved circuit
    if (!savedCircuit || (savedCircuit && JSON.parse(savedCircuit).components?.length === 0)) {
        if (selectedBoard === 'esp32') {
            setupESP32Circuit();
        } else if (selectedBoard === 'custom-esp32') {
            setupCustomESP32Circuit();
        } else if (selectedBoard === 'handysense-pro') {
            setupHandysenseProCircuit();
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

    // Generate initial code for the default setup
    setTimeout(() => {
        const initialCode = hackCable.editor.canvas.generateCode();
        if (codeInput instanceof HTMLTextAreaElement && !codeInput.value.trim()) {
            codeInput.value = initialCode;
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

if(compileButton && executeButton && stopButton && pauseButton && codeInput instanceof HTMLTextAreaElement && hexInput instanceof HTMLTextAreaElement){

    const code = localStorage.getItem('hackCable-webExample-inputCode');
    if(code) codeInput.value = code;
    const hex = localStorage.getItem('hackCable-webExample-inputHex');
    if(hex) hexInput.value = hex;

    compileButton.addEventListener("click", () => compile());
    executeButton.addEventListener("click", () => execute());
    stopButton.addEventListener("click", () => hackCable.emulatorManager.stop());
    pauseButton.addEventListener("click", () => {
        hackCable.emulatorManager.setPaused(!hackCable.emulatorManager.isPosed())
    });

    function compile(){
        if(codeInput instanceof HTMLTextAreaElement && hexInput instanceof HTMLTextAreaElement){
            // Detect board type
            const boardType = hackCable.editor.canvas.getBoardType();
            console.log("Detected board type:", boardType);

            if (boardType) {
                hackCable.emulatorManager.setBoardType(boardType);
            }

            console.log("Compiling...")
            showStatus('ui.status.compiling', 'info');
            localStorage.setItem('hackCable-webExample-inputCode', codeInput.value);
            hackCable.emulatorManager.compileAndLoadCode(codeInput.value).then(() => {})

            if (boardType === 'esp32') {
                // For ESP32, we don't compile to hex
                console.log("ESP32 detected - skipping hex compilation");
                hexInput.value = '// ESP32 uses MicroPython - no hex compilation needed';
                showStatus('ui.status.compileComplete', 'success');
            } else {
                // For Arduino, compile to hex
                EmulatorManager.compileCode(codeInput.value).then((data: CompileResult) => {
                    if(data){
                        console.log("done")
                        hexInput.value = data.hex
                        localStorage.setItem('hackCable-webExample-inputHex', data.hex);
                        showStatus('ui.status.compileComplete', 'success');
                    } else {
                        showStatus('ui.status.compileFailed', 'error');
                    }
                }).catch(() => {
                    showStatus('ui.status.compileFailed', 'error');
                })
            }
        }

    }
    function execute(){
        hackCable.emulatorManager.stop()

        // Detect board type
        const boardType = hackCable.editor.canvas.getBoardType();
        console.log("Executing on board type:", boardType);

        if (boardType) {
            hackCable.emulatorManager.setBoardType(boardType);
        }

        if(hexInput instanceof HTMLTextAreaElement && codeInput instanceof HTMLTextAreaElement){
            showStatus('ui.status.executing', 'info');

            if (boardType === 'esp32') {
                // For ESP32, pass the code directly
                console.log("Running MicroPython code on ESP32");
                hackCable.emulatorManager.run(codeInput.value);
            } else {
                // For Arduino, load hex and run
                localStorage.setItem('hackCable-webExample-inputHex', hexInput.value);
                hackCable.emulatorManager.loadCode(hexInput.value);
                hackCable.emulatorManager.run();
            }
        }
    }
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
        connection.setRouter(new draw2d.layout.connection.VertexRouter());
        connection.setSource(sourcePort);
        connection.setTarget(targetPort);
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

            // Fan
            connectPorts(fanFigure, "VCC", boardFigure, "VIN_2");
            connectPorts(fanFigure, "GND", boardFigure, "GND_6");

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

            // Fan
            connectPorts(fanFigure, "VCC", boardFigure, "VIN_2");
            connectPorts(fanFigure, "GND", boardFigure, "GND_6");

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

            console.log("Dual Sensor Fan Control circuit setup complete!");
        } catch (error) {
            console.error("Error during wiring:", error);
        }
    }, 500);
}


