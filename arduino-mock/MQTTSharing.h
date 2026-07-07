#ifndef MQTT_SHARING_H
#define MQTT_SHARING_H

#include "Arduino.h"
#include "WiFi.h"

class _NetpieClient {
public:
    void setServer(const char* /*server*/, int /*port*/) {}
    template<typename Handler> void setCallback(Handler /*handler*/) {}
    bool connected() { return true; }
    bool connect(const char* /*clientId*/) { return true; }
    bool connect(const char* /*clientId*/, const char* /*username*/, const char* /*password*/) { return true; }
    bool subscribe(const char* /*topic*/) { return true; }
    int state() { return 0; }
    void loop() {}
};

static _NetpieClient Netpieclient;
static _NetpieClient client;
static const char* Netpiemqtt_server = "broker.netpie.io";
static const int Netpiemqtt_port = 1883;
static const char* Netpiemqtt_Client = "hackcable";
static const char* Netpiemqtt_Token = "";
static const char* Netpiemqtt_Secret = "";

inline void setupMQTT() {}
inline void connectWifiIfNotConnected() {}
inline void publishMessage(const char* /*payload*/) {}
inline void pub_topic(const char* /*topic*/, float /*value*/) {}
inline void pub_topic(const char* /*topic*/, int /*value*/) {}
inline void pub_topic(const char* /*topic*/, const char* /*value*/) {}
inline void pub_topic(const char* /*topic*/, const String& /*value*/) {}

#endif
