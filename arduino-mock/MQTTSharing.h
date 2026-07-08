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

inline void setupMQTT() {}
template<typename... Args>
inline void connectWifiIfNotConnected(Args... /*args*/) {}
inline void publishMessage(const char* /*payload*/) {}
inline void pub_topic(const char* /*topic*/, float /*value*/) {}
inline void pub_topic(const char* /*topic*/, int /*value*/) {}
inline void pub_topic(const char* /*topic*/, const char* /*value*/) {}
inline void pub_topic(const char* /*topic*/, const String& /*value*/) {}
inline void Pub_topic(const char* topic, float value) { pub_topic(topic, value); }
inline void Pub_topic(const char* topic, int value) { pub_topic(topic, value); }
inline void Pub_topic(const char* topic, const char* value) { pub_topic(topic, value); }
inline void Pub_topic(const char* topic, const String& value) { pub_topic(topic, value); }
inline void Pub_topic(const String& topic, float value) { pub_topic(topic.c_str(), value); }
inline void Pub_topic(const String& topic, int value) { pub_topic(topic.c_str(), value); }
inline void Pub_topic(const String& topic, const char* value) { pub_topic(topic.c_str(), value); }
inline void Pub_topic(const String& topic, const String& value) { pub_topic(topic.c_str(), value); }

#endif
