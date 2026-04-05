#ifndef WIFI_H
#define WIFI_H

// WiFi stub for Emscripten compilation

#define WL_IDLE_STATUS   0
#define WL_NO_SSID_AVAIL 1
#define WL_CONNECTED     3
#define WL_CONNECT_FAILED 4
#define WL_DISCONNECTED  6

class WiFiClass {
public:
    void        begin(const char* ssid, const char* pass = nullptr) {}
    int         status()     { return WL_CONNECTED; }
    const char* localIP()    { return "192.168.1.100"; }
    void        disconnect() {}
    int         RSSI()       { return -50; }
};

static WiFiClass WiFi;

#endif
