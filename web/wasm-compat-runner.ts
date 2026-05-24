import { ArduinoWasmShim } from './arduino-wasm-shim';
import { getArduinoHeaders } from './arduino-headers';
import { ClangWasmRunner } from './clang-runner';

export type WasmCompatSnippet = {
    id: string;
    source: string;
    tags: string[];
};

export type WasmCompatResult = {
    id: string;
    ok: boolean;
    stage: 'compile' | 'execute';
    message: string;
    serial: string;
};

const snippetShell = (body: string): string => body.trim();

export const WASM_COMPAT_SNIPPETS: WasmCompatSnippet[] = [
    {
        id: 'gpio-analog-serial-pulse',
        tags: ['gpio', 'analog', 'serial'],
        source: snippetShell(`
#include <Arduino.h>
void setup() {
  Serial.begin(115200);
  pinMode(4, OUTPUT);
  pinMode(36, INPUT_PULLUP);
  analogReadResolution(12);
  analogWriteResolution(8);
}
void loop() {
  digitalWrite(4, HIGH);
  analogWrite(4, 128);
  dacWrite(25, 64);
  shiftOut(18, 19, MSBFIRST, 0x55);
  Serial.print("raw=");
  Serial.print(analogRead(36));
  Serial.print(",shift=");
  Serial.print(shiftIn(18, 19, LSBFIRST));
  Serial.print(",pulse=");
  Serial.println(pulseIn(36, HIGH, 1000));
}
        `),
    },
    {
        id: 'serial-overloads',
        tags: ['serial'],
        source: snippetShell(`
#include <Arduino.h>
void setup() {
  Serial.begin(115200);
  Serial.print("float=");
  Serial.print(25.75f, 1);
  Serial.print(",double=");
  Serial.println(60.25, 2);
}
void loop() {}
        `),
    },
    {
        id: 'wire-i2c-sensors',
        tags: ['wire', 'sensor'],
        source: snippetShell(`
#include <Arduino.h>
#include <Wire.h>
#include <SHT31.h>
#include <BH1750.h>
#include "MCP23008.h"
SHT31 sht;
BH1750 lightMeter;
MCP23008 MCP(0x24);
void setup() {
  Wire.begin();
  Wire.setClock(10000);
  sht.begin(0x44);
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);
  MCP.begin();
  MCP.pinMode8(0x00);
}
void loop() {
  sht.read();
  MCP.digitalWrite(0, sht.getTemperature() > 30 ? HIGH : LOW);
  Serial.println(lightMeter.readLightLevel(), 1);
}
        `),
    },
    {
        id: 'handysense-sht31-direct-gpio4-fan',
        tags: ['handysense', 'wire', 'sensor', 'gpio'],
        source: snippetShell(`
#include <HandySense.h>
#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include "time.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "SHT31.h"

SHT31 sht;
void setup() {
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
  Wire.begin();
  Wire.setClock(10000);
  sht.begin(0x44);
  pinMode(4, OUTPUT);

  Serial.begin(115200);

}

void loop() {
  sht.read();
  if ((sht.getTemperature()) > 30) {

    digitalWrite(4, HIGH);
  } else {

    digitalWrite(4, LOW);
  }

}
        `),
    },
    {
        id: 'displays-actuators',
        tags: ['display', 'actuator'],
        source: snippetShell(`
#include <Arduino.h>
#include <Servo.h>
#include "Grove_LED_Bar.h"
#include <TM1637Display.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_NeoPixel.h>
#include <Wire.h>
Servo servo;
Grove_LED_Bar ledBar(2, 4, 0);
TM1637Display display(18, 19);
LiquidCrystal_I2C lcd(0x27, 16, 2);
Adafruit_NeoPixel strip(8, 5, NEO_GRB + NEO_KHZ800);
void setup() {
  servo.attach(13);
  ledBar.begin();
  display.setBrightness(7);
  lcd.init();
  lcd.backlight();
  strip.begin();
}
void loop() {
  servo.write(90);
  ledBar.setLevel(5);
  display.showNumberDec(1234);
  lcd.setCursor(0, 0);
  lcd.print("OK");
  strip.setPixelColor(0, strip.Color(1, 2, 3));
  strip.show();
}
        `),
    },
    {
        id: 'esp32-wifi-webserver',
        tags: ['wifi', 'webserver'],
        source: snippetShell(`
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <getchip.h>
uint32_t chip_id = 0;
WebServer server(80);
void setup() {
  WiFi.begin("FarmSSID", "FarmPass");
  while (WiFi.status() != WL_CONNECTED) { delay(1); }
  WiFi.softAP("FarmAP", "12345678");
  setup_chipid("compat");
  server.on("/status", []() {
    String payload = String("ip=") + WiFi.localIP().toString() + String(",ap=") + WiFi.softAPIP().toString();
    server.send(200, "text/plain", payload);
  });
  server.begin();
}
void loop() {
  loop_chipid("compat");
  server.handleClient();
}
        `),
    },
    {
        id: 'time-rtc-cron',
        tags: ['time', 'rtc', 'cron'],
        source: snippetShell(`
#include <Arduino.h>
#include <RTClib.h>
#include "time_utility.h"
#include "rtc_ds1388.h"
#include "RTC2.h"
#include "cjob.h"
#include "BFarmTime.h"
RTC_DS1307 rtc;
BFarmTime bfarmtime;
CronID_t id_tick;
void tick() { Serial.println(bfarmtime.getSecond()); }
void setup() {
  rtc.begin();
  rtc.adjust(DateTime(2026, 1, 1, 0, 0, 0));
  set_system_time(rtc.now().year(), rtc.now().month(), rtc.now().day(), rtc.now().hour(), rtc.now().minute(), rtc.now().second());
  bfarmtime.sync();
  id_tick = Cron.create("* * * * * *", tick, false);
  Cron.enable(id_tick);
}
void loop() {
  char timestamp[20];
  sprintf(timestamp, "%04d-%02d-%02d", rtc.now().year(), rtc.now().month(), rtc.now().day());
  Serial.println(timestamp);
  Serial.println(get_rtc_weekday());
  Cron.delay();
  Cron.disable(id_tick);
}
        `),
    },
    {
        id: 'modbus-bfarm-sensors',
        tags: ['modbus', 'sensor'],
        source: snippetShell(`
#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>
ModbusMaster rs485;
void setup() {
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  Wire.begin();
  rs485.begin(1, Serial2);
}
void loop() {
  uint8_t result = rs485.readHoldingRegisters(0x0000, 2);
  if (result == ModbusMaster::ku8MBSuccess) {
    Serial.println(rs485.getResponseBuffer(0));
  }
}
        `),
    },
    {
        id: 'handysense-core',
        tags: ['handysense'],
        source: snippetShell(`
#include <Arduino.h>
#include <HandySense.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  setup_HandySense();
  setPin_Relay(32, 33, 25, 26);
  setPin_SW(36, 39, 34, 35);
  setPin_ErrorSensor(19, 18, 5);
}
void loop() {
  RelayStatus[0] = 1;
  Open_relay(0);
  Close_relay(0);
  loop_HandySense(analog_to_percent(analogRead(36)), 0, 0, 0);
}
        `),
    },
    {
        id: 'bfarm-task-event',
        tags: ['event', 'task'],
        source: snippetShell(`
#include <Arduino.h>
#include "BFarmEvent.h"
BFarmEvent bfarmevt;
void setup() {
  bfarmevt.attach("tick", BFarmEventType::EVERY, [](){ Serial.println("tick"); }, 1000, 0);
  bfarmevt.attach("", BFarmEventType::ONCE, [](){ vTaskDelete(NULL); }, 0, 0);
}
void loop() {
  bfarmevt.detach("tick");
  bfarmevt.detach(4);
}
        `),
    },
    {
        id: 'fertilizer-preferences',
        tags: ['fertilizer', 'preferences'],
        source: snippetShell(`
#include <Arduino.h>
#include <Preferences.h>
#include <fertilizer.h>
void setup() {
  preferences.begin("bfarm", false);
  load_preferences();
}
void loop() {
  float ph = PHcompute(analogRead(36));
  int ec = ECcompute(analogRead(39), analogRead(34));
  control_pH(ph);
  control_EC(ec);
  preferences.putFloat("ph", ph);
  clear_preferences();
  print_config();
}
        `),
    },
    {
        id: 'cloud-netpie-thingspeak',
        tags: ['cloud', 'netpie', 'thingspeak'],
        source: snippetShell(`
#include <Arduino.h>
#include <WiFi.h>
#include <mqtt_client.h>
#include <pub_topic.h>
#include <ThingSpeakWriter_asukiaaa.h>
#include <getchip.h>
uint32_t chip_id = 0;
const char* Netpiemqtt_server = "broker.netpie.io";
const int Netpiemqtt_port = 1883;
const char* Netpiemqtt_Client = "compat";
ThingSpeakWriter_asukiaaa channelWriter("WRITE_KEY");
void Netpiecallback(String topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) { message = message + (char)payload[i]; }
  Serial.println(topic);
}
void setup() {
  setupMQTT();
  Netpieclient.setServer(Netpiemqtt_server, Netpiemqtt_port);
  Netpieclient.setCallback(Netpiecallback);
  Netpieclient.connect(Netpiemqtt_Client, "user", "pass");
  Netpieclient.subscribe("@private/#");
  channelWriter.setField(1, String(analogRead(36)));
  publishMessage((String("#N,temp:") + String(25.0f) + String(",$") + String(chip_id)).c_str());
}
void loop() {
  pub_topic("@shadow/data/update", 25.0f);
  channelWriter.writeFields();
  Netpieclient.loop();
}
        `),
    },
    {
        id: 'cloud-magellan',
        tags: ['cloud', 'magellan'],
        source: snippetShell(`
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <MAGELLAN_MQTT.h>
#include <MAGELLAN_WiFi_SETTING.h>
#include <getchip.h>
uint32_t chip_id = 0;
WiFiClient WiFi_client;
MAGELLAN_MQTT magel(WiFi_client);
void setup() {
  WiFiSetting.SSID = String("FarmSSID");
  WiFiSetting.PASS = String("FarmPass");
  connectWiFi(WiFiSetting);
  setting.endpoint = String("magellan.ais.co.th");
  setting.ThingIdentifier = String("thing");
  setting.ThingSecret = String("secret");
  setting.clientBufferSize = defaultOTABuffer;
  magel.begin(setting);
  magel.subscribes([](){
    magel.subscribe.serverConfig(PLAINTEXT);
    magel.subscribe.control(PLAINTEXT);
    magel.subscribe.report.response();
  });
}
void loop() {
  reconnectWiFi(magel);
  magel.interval(1000, [](){ magel.sensor.add("temp", 25.0f); });
  magel.getControl([](String key, String value){ magel.control.ACK(key, value); });
  magel.getServerConfig([](String key, String value){ Serial.println(key + value); });
  magel.sensor.report();
  magel.clientConfig.add("mode", "auto");
  magel.clientConfig.save();
  magel.control.request("pump");
  magel.serverConfig.request("interval");
  magel.loop();
}
        `),
    },
    {
        id: 'bluetooth',
        tags: ['bluetooth'],
        source: snippetShell(`
#include <Arduino.h>
#include "BluetoothSerial.h"
BluetoothSerial SerialBT;
void setup() {
  SerialBT.begin("bfarm");
}
void loop() {
  while (SerialBT.available()) {
    SerialBT.print(SerialBT.readStringUntil('\\n'));
    SerialBT.println(SerialBT.read());
  }
}
        `),
    },
];

export async function runWasmCompatibilityCorpus(
    onProgress?: (message: string) => void,
): Promise<WasmCompatResult[]> {
    const runner = new ClangWasmRunner();
    const results: WasmCompatResult[] = [];

    try {
        onProgress?.('Loading Clang/LLVM WASM assets...');
        let lastLoadLabel = '';
        await runner.load((_loaded, _total, label) => {
            if (label && label !== lastLoadLabel) {
                lastLoadLabel = label;
                onProgress?.(`Loading ${label}...`);
            }
        });

        for (const snippet of WASM_COMPAT_SNIPPETS) {
            onProgress?.(`Compiling ${snippet.id}...`);
            let serial = '';
            let stage: WasmCompatResult['stage'] = 'compile';
            try {
                const compiled = await runner.compile(snippet.source, getArduinoHeaders());
                const shim = new ArduinoWasmShim(
                    () => {},
                    (text) => { serial += text; },
                    () => 0,
                    () => 25,
                    () => 60,
                    () => 500,
                );
                shim.setAnalogPin(34, 1900);
                shim.setAnalogPin(36, 2100);
                shim.setAnalogPin(39, 1800);

                onProgress?.(`Executing ${snippet.id}...`);
                stage = 'execute';
                const { instance } = await WebAssembly.instantiate(compiled.wasmBytes, shim.buildImports());
                const exports = instance.exports as Record<string, unknown>;
                const memory = exports.memory;
                if (memory instanceof WebAssembly.Memory) shim.setWasmMemory(memory);
                if (typeof exports.setup === 'function') (exports.setup as () => void)();
                if (typeof exports.loop === 'function') (exports.loop as () => void)();

                results.push({
                    id: snippet.id,
                    ok: true,
                    stage: 'execute',
                    message: 'ok',
                    serial,
                });
            } catch (error) {
                results.push({
                    id: snippet.id,
                    ok: false,
                    stage,
                    message: error instanceof Error ? error.message : String(error),
                    serial,
                });
            }
        }
    } finally {
        runner.dispose();
    }

    return results;
}

export function installWasmCompatHarness(): void {
    const globalTarget = window as typeof window & {
        hackCableRunWasmCompat?: typeof runWasmCompatibilityCorpus;
    };
    globalTarget.hackCableRunWasmCompat = runWasmCompatibilityCorpus;

    const params = new URLSearchParams(window.location.search);
    if (params.get('wasm-compat') !== '1') return;

    void runWasmCompatibilityCorpus((message) => console.info('[wasm-compat]', message))
        .then((results) => {
            const failed = results.filter((result) => !result.ok);
            console.table(results.map((result) => ({
                id: result.id,
                ok: result.ok,
                stage: result.stage,
                message: result.message.slice(0, 160),
                serial: result.serial.slice(0, 80),
            })));
            if (failed.length > 0) {
                console.error(`[wasm-compat] ${failed.length}/${results.length} snippets failed`, failed);
                return;
            }
            console.info(`[wasm-compat] ${results.length}/${results.length} snippets passed`);
        })
        .catch((error) => {
            console.error('[wasm-compat] runner failed', error);
        });
}
