import {
    AnalogJoystickElement, ArduinoMegaElement,
    ArduinoNanoElement,
    ArduinoUnoElement,
    BigSoundSensorElement,
    BuzzerElement,
    Dht22Element, DipSwitch8Element,
    Ds1307Element,
    ESP32DevkitV1Element, FlameSensorElement,
    FranzininhoElement, GasSensorElement,
    HCSR04Element,
    HeartBeatSensorElement,
    ILI9341Element,
    IRReceiverElement, IRRemoteElement,
    KY040Element,
    LCD1602Element, LCD2004Element, LedBarGraphElement, LEDElement,
    LEDRingElement, MembraneKeypadElement,
    MicrosdCardElement, MPU6050Element,
    NanoRP2040ConnectElement,
    NeoPixelElement,
    NeopixelMatrixElement, NTCTemperatureSensorElement, PhotoresistorSensorElement,
    PIRMotionSensorElement,
    PotentiometerElement,
    PushbuttonElement,
    ResistorElement, RGBLedElement,
    RotaryDialerElement,
    ServoElement, SevenSegmentElement, SlidePotentiometerElement,
    SlideSwitchElement,
    SmallSoundSensorElement, SSD1306Element,
    TiltSwitchElement
} from "@wokwi/elements";
import i18next from "i18next";
import { CustomESP32BoardElement } from "../components/custom-esp32-board";
import { HandysenseBoardElement } from "../components/handysense-board";
import { HandysenseRealBoardElement } from "../components/handysense-real-board";
import { HandysenseProBoardElement } from "../components/handysense-pro-board";
import { PhSensorElement } from "../components/ph-sensor-element";
import { AirHumiditySensorElement } from "../components/air-humidity-sensor-element";
import { MistingPumpElement } from "../components/misting-pump-element";
import { WaterPumpElement } from "../components/water-pump-element";
import { FanElement } from "../components/fan-element";
import { RelayElement } from "../components/relay-element";
import { Rs485PhSensorElement } from "../components/rs485-ph-sensor-element";
import { Rs485LightSensorElement } from "../components/rs485-light-sensor-element";
import { Rs485RainSensorElement } from "../components/rs485-rain-sensor-element";
import { Rs485WindSpeedSensorElement } from "../components/rs485-wind-speed-sensor-element";
import { Rs485ParSensorElement } from "../components/rs485-par-sensor-element";
import { WeatherSensorHtco2plxElement } from "../components/weather-sensor-htco2plx-element";
import { Sht31SensorElement } from "../components/sht31-sensor-element";
import { Bh1750SensorElement } from "../components/bh1750-sensor-element";
import { CurrentLoop420mAElement } from "../components/current-loop-420ma-element";
import { SoilMoistureSensorElement } from "../components/soil-moisture-sensor-element";
import { FourChannelRelayElement } from "../components/four-channel-relay-element";
import { FertilizerPhSensorElement } from "../components/fertilizer-ph-sensor-element";
import { EcSensorElement } from "../components/ec-sensor-element";
import { FertilizerTempSensorElement } from "../components/fertilizer-temp-sensor-element";
import { FourChannelButtonElement } from "../components/four-channel-button-element";
import { Bfarm7in1SoilMultireadElement } from "../components/bfarm-7in1-soil-multiread-element";
import { BfarmAmmoniaRs485Element } from "../components/bfarm-ammonia-rs485-element";
import { BfarmSoilTempMultireadRs485Element } from "../components/bfarm-soil-temp-multiread-rs485-element";
import { BfarmSen55AirI2cElement } from "../components/bfarm-sen55-air-i2c-element";
import { BfarmUltrasonicRs485Element } from "../components/bfarm-ultrasonic-rs485-element";
import { BfarmTurbidityXm3318bRs485Element } from "../components/bfarm-turbidity-xm3318b-rs485-element";
import { BfarmTurbidityXm8518Rs485Element } from "../components/bfarm-turbidity-xm8518-rs485-element";
import { BfarmNitrateIsfetRs485Element } from "../components/bfarm-nitrate-isfet-rs485-element";
import { BfarmTmecTensioRs485Element } from "../components/bfarm-tmec-tensio-rs485-element";
import { BfarmTmecAnalogElement } from "../components/bfarm-tmec-analog-element";
import { BfarmWaterQualitySuiteRs485Element } from "../components/bfarm-water-quality-suite-rs485-element";
import { BfarmTubularSoilProbeRs485Element } from "../components/bfarm-tubular-soil-probe-rs485-element";
import { BfarmAirVelocitySensorSm3789Element } from "../components/bfarm-air-velocity-sensor-sm3789-element";
import { BfarmLux120kRs485Element } from "../components/bfarm-lux120k-rs485-element";
import { BfarmWeatherSensorRs485Element } from "../components/bfarm-weather-sensor-rs485-element";
import { Sht31Rs485SensorElement } from "../components/sht31-rs485-sensor-element";
import { Weight3kgRs485SensorElement } from "../components/weight-3kg-rs485-sensor-element";
import { WindDirectionRs485SensorElement } from "../components/wind-direction-rs485-sensor-element";
import { DtPar485SensorElement } from "../components/dt-par485-sensor-element";

export declare type WokwiComponent = SevenSegmentElement | ArduinoUnoElement | LCD1602Element | LEDElement | NeoPixelElement | PushbuttonElement | ResistorElement | MembraneKeypadElement | PotentiometerElement | NeopixelMatrixElement | SSD1306Element | BuzzerElement | RotaryDialerElement | ServoElement | Dht22Element | ArduinoMegaElement | ArduinoNanoElement | Ds1307Element | LEDRingElement | SlideSwitchElement | HCSR04Element | LCD2004Element | AnalogJoystickElement | SlidePotentiometerElement | IRReceiverElement | IRRemoteElement | PIRMotionSensorElement | NTCTemperatureSensorElement | HeartBeatSensorElement | TiltSwitchElement | FlameSensorElement | GasSensorElement | FranzininhoElement | NanoRP2040ConnectElement | SmallSoundSensorElement | BigSoundSensorElement | MPU6050Element | ESP32DevkitV1Element | KY040Element | PhotoresistorSensorElement | RGBLedElement | ILI9341Element | LedBarGraphElement | MicrosdCardElement | DipSwitch8Element | CustomESP32BoardElement | HandysenseBoardElement | HandysenseRealBoardElement | HandysenseProBoardElement | PhSensorElement | AirHumiditySensorElement | MistingPumpElement | WaterPumpElement | FanElement | RelayElement | Rs485PhSensorElement | Rs485LightSensorElement | Rs485RainSensorElement | Rs485WindSpeedSensorElement | Rs485ParSensorElement | WeatherSensorHtco2plxElement | Sht31SensorElement | Bh1750SensorElement | CurrentLoop420mAElement | SoilMoistureSensorElement | FourChannelRelayElement | FertilizerPhSensorElement | EcSensorElement | FertilizerTempSensorElement | FourChannelButtonElement | Bfarm7in1SoilMultireadElement | BfarmAmmoniaRs485Element | BfarmSoilTempMultireadRs485Element | BfarmSen55AirI2cElement | BfarmUltrasonicRs485Element | BfarmTurbidityXm3318bRs485Element | BfarmTurbidityXm8518Rs485Element | BfarmNitrateIsfetRs485Element | BfarmTmecTensioRs485Element | BfarmTmecAnalogElement | BfarmWaterQualitySuiteRs485Element | BfarmTubularSoilProbeRs485Element | BfarmAirVelocitySensorSm3789Element | BfarmLux120kRs485Element | BfarmWeatherSensorRs485Element | Sht31Rs485SensorElement | Weight3kgRs485SensorElement | WindDirectionRs485SensorElement | DtPar485SensorElement

export declare type WokwiClass = typeof Dht22Element;

export const wokwiComponentClasses = [SevenSegmentElement, ArduinoUnoElement, LCD1602Element, LEDElement, NeoPixelElement, PushbuttonElement, ResistorElement, MembraneKeypadElement, PotentiometerElement, NeopixelMatrixElement, SSD1306Element, BuzzerElement, RotaryDialerElement, ServoElement, Dht22Element, ArduinoMegaElement, ArduinoNanoElement, Ds1307Element, LEDRingElement, SlideSwitchElement, HCSR04Element, LCD2004Element, AnalogJoystickElement, SlidePotentiometerElement, IRReceiverElement, IRRemoteElement,  PIRMotionSensorElement, NTCTemperatureSensorElement, HeartBeatSensorElement, TiltSwitchElement, FlameSensorElement, GasSensorElement, FranzininhoElement, NanoRP2040ConnectElement, SmallSoundSensorElement, BigSoundSensorElement, MPU6050Element, ESP32DevkitV1Element, KY040Element, PhotoresistorSensorElement, RGBLedElement, ILI9341Element, LedBarGraphElement, MicrosdCardElement, DipSwitch8Element, CustomESP32BoardElement, HandysenseBoardElement, HandysenseRealBoardElement, HandysenseProBoardElement, PhSensorElement, AirHumiditySensorElement, MistingPumpElement, WaterPumpElement, FanElement, RelayElement, Rs485PhSensorElement, Rs485LightSensorElement, Rs485RainSensorElement, Rs485WindSpeedSensorElement, Rs485ParSensorElement, WeatherSensorHtco2plxElement, Sht31SensorElement, Bh1750SensorElement, CurrentLoop420mAElement, SoilMoistureSensorElement, FourChannelRelayElement, FertilizerPhSensorElement, EcSensorElement, FertilizerTempSensorElement, FourChannelButtonElement, Bfarm7in1SoilMultireadElement, BfarmAmmoniaRs485Element, BfarmSoilTempMultireadRs485Element, BfarmSen55AirI2cElement, BfarmUltrasonicRs485Element, BfarmTurbidityXm3318bRs485Element, BfarmTurbidityXm8518Rs485Element, BfarmNitrateIsfetRs485Element, BfarmTmecTensioRs485Element, BfarmTmecAnalogElement, BfarmWaterQualitySuiteRs485Element, BfarmTubularSoilProbeRs485Element, BfarmAirVelocitySensorSm3789Element, BfarmLux120kRs485Element, BfarmWeatherSensorRs485Element, Sht31Rs485SensorElement, Weight3kgRs485SensorElement, WindDirectionRs485SensorElement, DtPar485SensorElement]

export declare type WokwiComponentInfo = {id: number, clasz: WokwiClass, name: string, description: string, type: ComponentType}
export declare type WokwiComponents = WokwiComponentInfo[]
export declare type WokwiComponentById = {[id: number]: WokwiComponentInfo}
export declare type WokwiComponentByClass = {[clasz: string]: WokwiComponentInfo}

export enum ComponentType {
    LED,
    MOTOR,
    TRANSMITTER,
    BUTTON,
    SENSOR,
    OTHER,
    CARD,
    CUSTOM,
    BFARM,
    BFARM_SENSOR
}

export const wokwiComponents = (): WokwiComponents => [
    {
        id: 0,
        clasz: ArduinoUnoElement,
        name: "Arduino Uno",
        description: i18next.t("wokwiComponents.arduinoUno.description"),
        type: ComponentType.CARD
    },{
        id: 26,
        clasz: ESP32DevkitV1Element,
        name: "ESP32",
        description: i18next.t("wokwiComponents.esp32.description"),
        type: ComponentType.CARD
    },{
        id: 27,
        clasz: CustomESP32BoardElement,
        name: "Custom ESP32",
        description: "Custom ESP32 board with modified design",
        type: ComponentType.CARD
    },{
        id: 50,
        clasz: HandysenseBoardElement,
        name: "Handysense",
        description: "Handysense board layout matched to the hardware map",
        type: ComponentType.CARD
    },{
        id: 51,
        clasz: HandysenseRealBoardElement,
        name: "Handysense real",
        description: "Handysense board layout aligned to the real board photo",
        type: ComponentType.CARD
    },{
        id: 28,
        clasz: HandysenseProBoardElement,
        name: "Handysense pro",
        description: "Handysense pro board with ESP32-WROOM-32D",
        type: ComponentType.CARD
    },{
        id: 1,
        clasz: LEDElement,
        name: "LED",
        description: i18next.t("wokwiComponents.led.description"),
        type: ComponentType.LED
    },{
        id: 2,
        clasz: RGBLedElement,
        name: "LED RGB",
        description: i18next.t("wokwiComponents.rgbLed.description"),
        type: ComponentType.LED
    },{
        id: 3,
        clasz: LedBarGraphElement,
        name: "LED Bar",
        description: i18next.t("wokwiComponents.ledBar.description"),
        type: ComponentType.LED
    },{
        id: 4,
        clasz: NeoPixelElement,
        name: "Pixel",
        description: i18next.t("wokwiComponents.led.description"),
        type: ComponentType.LED
    },{
        id: 5,
        clasz: SevenSegmentElement,
        name: "Numitrons",
        description: "Peut afficher un chiffre ou une lettre",
        type: ComponentType.LED
    },{
        id: 6,
        clasz: LEDRingElement,
        name: "LED Ring",
        description: "Anneau de Leds",
        type: ComponentType.LED
    },{
        id: 7,
        clasz: LCD1602Element,
        name: "Écran 2*16 caractères",
        description: "Peut afficher du texte (Jusqu'à 32 caractères sur 2 lignes)",
        type: ComponentType.LED
    },{
        id: 8,
        clasz: LCD2004Element,
        name: "Écran 4*20 caractères",
        description: "Peut afficher du texte (Jusqu'à 80 caractères sur 4 lignes)",
        type: ComponentType.LED
    },{
        id: 9,
        clasz: BuzzerElement,
        name: "Buzzer",
        description: "Haut parleur",
        type: ComponentType.TRANSMITTER
    },{
        id: 10,
        clasz: PushbuttonElement,
        name: "Bouton poussoir",
        description: "",
        type: ComponentType.BUTTON
    },{
        id: 11,
        clasz: PotentiometerElement,
        name: "Potentiomètre",
        description: "Résistance variable",
        type: ComponentType.BUTTON
    },{
        id: 12,
        clasz: SlideSwitchElement,
        name: "Slide switch",
        description: "Interrupteur",
        type: ComponentType.BUTTON
    },{
        id: 13,
        clasz: AnalogJoystickElement,
        name: "Joystick",
        description: "",
        type: ComponentType.BUTTON
    },{
        id: 14,
        clasz: SlidePotentiometerElement,
        name: "Potentiomètre",
        description: "Résistance variable",
        type: ComponentType.BUTTON
    },{
        id: 15,
        clasz: DipSwitch8Element,
        name: "DipSwitch8",
        description: "Barre de 8 interrupteurs",
        type: ComponentType.BUTTON
    },{
        id: 16,
        clasz: Dht22Element,
        name: "DHT22 (T° et φ)",
        description: "Capteur de température et d'humidité",
        type: ComponentType.SENSOR
    },{
        id: 17,
        clasz: HCSR04Element,
        name: "HCSR04",
        description: "Détecteur de proximité",
        type: ComponentType.SENSOR
    },{
        id: 18,
        clasz: NTCTemperatureSensorElement,
        name: "Temperature sensor",
        description: "",
        type: ComponentType.SENSOR
    },{
        id: 19,
        clasz: SmallSoundSensorElement,
        name: "Détecteur de son faible",
        description: "",
        type: ComponentType.SENSOR
    },{
        id: 20,
        clasz: BigSoundSensorElement,
        name: "Détecteur de son fort",
        description: "",
        type: ComponentType.SENSOR
    },{
        id: 21,
        clasz: ServoElement,
        name: "Servo moteur",
        description: "Moteur de précision (angle de rotation controllable)",
        type: ComponentType.MOTOR
    },{
        id: 22,
        clasz: KY040Element,
        name: "Potentiometre KY040",
        description: "Résistance variable",
        type: ComponentType.BUTTON
    },{
        id: 23,
        clasz: PhotoresistorSensorElement,
        name: "Photoresistance",
        description: "Capteur de lumière",
        type: ComponentType.SENSOR
    },{
        id: 24,
        clasz: ResistorElement,
        name: "Résistance",
        description: "",
        type: ComponentType.OTHER
    },{
        id: 25,
        clasz: Ds1307Element,
        name: "Ds1307 (Horloge)",
        description: "",
        type: ComponentType.OTHER
    },{
        id: 29,
        clasz: PhSensorElement,
        name: i18next.t("wokwiComponents.phSensor.name"),
        description: i18next.t("wokwiComponents.phSensor.description"),
        type: ComponentType.CUSTOM
    },{
        id: 30,
        clasz: AirHumiditySensorElement,
        name: i18next.t("wokwiComponents.airHumiditySensor.name"),
        description: i18next.t("wokwiComponents.airHumiditySensor.description"),
        type: ComponentType.CUSTOM
    },{
        id: 31,
        clasz: MistingPumpElement,
        name: i18next.t("wokwiComponents.mistingPump.name"),
        description: i18next.t("wokwiComponents.mistingPump.description"),
        type: ComponentType.CUSTOM
    },{
        id: 32,
        clasz: WaterPumpElement,
        name: i18next.t("wokwiComponents.waterPump.name"),
        description: i18next.t("wokwiComponents.waterPump.description"),
        type: ComponentType.CUSTOM
    },{
        id: 33,
        clasz: FanElement,
        name: i18next.t("wokwiComponents.fan.name"),
        description: i18next.t("wokwiComponents.fan.description"),
        type: ComponentType.CUSTOM
    },{
        id: 34,
        clasz: RelayElement,
        name: i18next.t("wokwiComponents.relay.name"),
        description: i18next.t("wokwiComponents.relay.description"),
        type: ComponentType.CUSTOM
    },{
        id: 35,
        clasz: Rs485PhSensorElement,
        name: i18next.t("wokwiComponents.rs485PhSensor.name"),
        description: i18next.t("wokwiComponents.rs485PhSensor.description"),
        type: ComponentType.BFARM
    },{
        id: 36,
        clasz: Rs485LightSensorElement,
        name: i18next.t("wokwiComponents.rs485LightSensor.name"),
        description: i18next.t("wokwiComponents.rs485LightSensor.description"),
        type: ComponentType.BFARM
    },{
        id: 37,
        clasz: Rs485RainSensorElement,
        name: i18next.t("wokwiComponents.rs485RainSensor.name"),
        description: i18next.t("wokwiComponents.rs485RainSensor.description"),
        type: ComponentType.BFARM
    },{
        id: 38,
        clasz: Rs485WindSpeedSensorElement,
        name: i18next.t("wokwiComponents.rs485WindSpeedSensor.name"),
        description: i18next.t("wokwiComponents.rs485WindSpeedSensor.description"),
        type: ComponentType.BFARM
    },{
        id: 39,
        clasz: Rs485ParSensorElement,
        name: i18next.t("wokwiComponents.rs485ParSensor.name"),
        description: i18next.t("wokwiComponents.rs485ParSensor.description"),
        type: ComponentType.BFARM
    },{
        id: 40,
        clasz: WeatherSensorHtco2plxElement,
        name: i18next.t("wokwiComponents.weatherSensorHtco2plx.name"),
        description: i18next.t("wokwiComponents.weatherSensorHtco2plx.description"),
        type: ComponentType.BFARM
    },{
        id: 41,
        clasz: Sht31SensorElement,
        name: i18next.t("wokwiComponents.sht31Sensor.name"),
        description: i18next.t("wokwiComponents.sht31Sensor.description"),
        type: ComponentType.BFARM
    },{
        id: 42,
        clasz: Bh1750SensorElement,
        name: i18next.t("wokwiComponents.bh1750Sensor.name"),
        description: i18next.t("wokwiComponents.bh1750Sensor.description"),
        type: ComponentType.BFARM
    },{
        id: 43,
        clasz: CurrentLoop420mAElement,
        name: i18next.t("wokwiComponents.currentLoop420mA.name"),
        description: i18next.t("wokwiComponents.currentLoop420mA.description"),
        type: ComponentType.BFARM
    },{
        id: 44,
        clasz: SoilMoistureSensorElement,
        name: i18next.t("wokwiComponents.soilMoistureSensor.name"),
        description: i18next.t("wokwiComponents.soilMoistureSensor.description"),
        type: ComponentType.BFARM
    },{
        id: 45,
        clasz: FourChannelRelayElement,
        name: i18next.t("wokwiComponents.fourChannelRelay.name"),
        description: i18next.t("wokwiComponents.fourChannelRelay.description"),
        type: ComponentType.BFARM
    },{
        id: 46,
        clasz: FertilizerPhSensorElement,
        name: i18next.t("wokwiComponents.fertilizerPhSensor.name"),
        description: i18next.t("wokwiComponents.fertilizerPhSensor.description"),
        type: ComponentType.BFARM
    },{
        id: 47,
        clasz: EcSensorElement,
        name: i18next.t("wokwiComponents.ecSensor.name"),
        description: i18next.t("wokwiComponents.ecSensor.description"),
        type: ComponentType.BFARM
    },{
        id: 48,
        clasz: FertilizerTempSensorElement,
        name: i18next.t("wokwiComponents.fertilizerTempSensor.name"),
        description: i18next.t("wokwiComponents.fertilizerTempSensor.description"),
        type: ComponentType.BFARM
    },{
        id: 49,
        clasz: FourChannelButtonElement,
        name: i18next.t("wokwiComponents.fourChannelButton.name"),
        description: i18next.t("wokwiComponents.fourChannelButton.description"),
        type: ComponentType.BFARM
    },{
        id: 52,
        clasz: Bfarm7in1SoilMultireadElement,
        name: i18next.t("wokwiComponents.bfarm7in1SoilMultiread.name"),
        description: i18next.t("wokwiComponents.bfarm7in1SoilMultiread.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 53,
        clasz: BfarmAmmoniaRs485Element,
        name: i18next.t("wokwiComponents.bfarmAmmoniaRs485.name"),
        description: i18next.t("wokwiComponents.bfarmAmmoniaRs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 54,
        clasz: BfarmSoilTempMultireadRs485Element,
        name: i18next.t("wokwiComponents.bfarmSoilTempMultireadRs485.name"),
        description: i18next.t("wokwiComponents.bfarmSoilTempMultireadRs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 55,
        clasz: BfarmSen55AirI2cElement,
        name: i18next.t("wokwiComponents.bfarmSen55AirI2c.name"),
        description: i18next.t("wokwiComponents.bfarmSen55AirI2c.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 56,
        clasz: BfarmUltrasonicRs485Element,
        name: i18next.t("wokwiComponents.bfarmUltrasonicRs485.name"),
        description: i18next.t("wokwiComponents.bfarmUltrasonicRs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 57,
        clasz: BfarmTurbidityXm3318bRs485Element,
        name: i18next.t("wokwiComponents.bfarmTurbidityXm3318bRs485.name"),
        description: i18next.t("wokwiComponents.bfarmTurbidityXm3318bRs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 58,
        clasz: BfarmTurbidityXm8518Rs485Element,
        name: i18next.t("wokwiComponents.bfarmTurbidityXm8518Rs485.name"),
        description: i18next.t("wokwiComponents.bfarmTurbidityXm8518Rs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 59,
        clasz: BfarmNitrateIsfetRs485Element,
        name: i18next.t("wokwiComponents.bfarmNitrateIsfetRs485.name"),
        description: i18next.t("wokwiComponents.bfarmNitrateIsfetRs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 60,
        clasz: BfarmTmecTensioRs485Element,
        name: i18next.t("wokwiComponents.bfarmTmecTensioRs485.name"),
        description: i18next.t("wokwiComponents.bfarmTmecTensioRs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 61,
        clasz: BfarmTmecAnalogElement,
        name: i18next.t("wokwiComponents.bfarmTmecAnalog.name"),
        description: i18next.t("wokwiComponents.bfarmTmecAnalog.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 62,
        clasz: BfarmWaterQualitySuiteRs485Element,
        name: i18next.t("wokwiComponents.bfarmWaterQualitySuiteRs485.name"),
        description: i18next.t("wokwiComponents.bfarmWaterQualitySuiteRs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 63,
        clasz: BfarmTubularSoilProbeRs485Element,
        name: i18next.t("wokwiComponents.bfarmTubularSoilProbeRs485.name"),
        description: i18next.t("wokwiComponents.bfarmTubularSoilProbeRs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 64,
        clasz: BfarmAirVelocitySensorSm3789Element,
        name: i18next.t("wokwiComponents.bfarmAirVelocitySensorSm3789.name"),
        description: i18next.t("wokwiComponents.bfarmAirVelocitySensorSm3789.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 65,
        clasz: BfarmLux120kRs485Element,
        name: i18next.t("wokwiComponents.bfarmLux120kRs485.name"),
        description: i18next.t("wokwiComponents.bfarmLux120kRs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 66,
        clasz: BfarmWeatherSensorRs485Element,
        name: i18next.t("wokwiComponents.bfarmWeatherSensorRs485.name"),
        description: i18next.t("wokwiComponents.bfarmWeatherSensorRs485.description"),
        type: ComponentType.BFARM_SENSOR
    },{
        id: 67,
        clasz: Sht31Rs485SensorElement,
        name: i18next.t("wokwiComponents.sht31Rs485Sensor.name"),
        description: i18next.t("wokwiComponents.sht31Rs485Sensor.description"),
        type: ComponentType.BFARM
    },{
        id: 68,
        clasz: Weight3kgRs485SensorElement,
        name: i18next.t("wokwiComponents.weight3kgRs485Sensor.name"),
        description: i18next.t("wokwiComponents.weight3kgRs485Sensor.description"),
        type: ComponentType.BFARM
    },{
        id: 69,
        clasz: WindDirectionRs485SensorElement,
        name: i18next.t("wokwiComponents.windDirectionRs485Sensor.name"),
        description: i18next.t("wokwiComponents.windDirectionRs485Sensor.description"),
        type: ComponentType.BFARM
    },{
        id: 70,
        clasz: DtPar485SensorElement,
        name: i18next.t("wokwiComponents.dtPar485Sensor.name"),
        description: i18next.t("wokwiComponents.dtPar485Sensor.description"),
        type: ComponentType.BFARM
    }]

export let wokwiComponentById: WokwiComponentById = {};
export let wokwiComponentByClass: WokwiComponentByClass = {};
for(let component of wokwiComponents()){
    wokwiComponentById[component.id] = component;
    wokwiComponentByClass[component.clasz.name] = component;
}


export class ComponentElement {

    public readonly componentId: number;
    public readonly wokwiComponent: WokwiComponent
    public readonly name: string
    public readonly description: string
    public readonly type: ComponentType

    constructor(component: WokwiComponentInfo) {
        this.componentId = component.id;
        this.wokwiComponent = new component.clasz();
        this.name = component.name;
        this.description = component.description;
        this.type = component.type
    }

}
