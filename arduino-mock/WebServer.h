#ifndef WEBSERVER_H
#define WEBSERVER_H

#include <functional>
#include "Arduino.h"

// WebServer stub for Emscripten compilation

class WebServer {
public:
    explicit WebServer(int port) {}
    void on(const char* uri, std::function<void()> handler) {}
    void begin()         {}
    void handleClient()  {}
    void send(int code, const char* contentType, const char* body)   { _serial_print_str(body, 1); }
    void send(int code, const char* contentType, const String& body) { _serial_print_str(body.c_str(), 1); }
    String arg(const char* name)       { return String(""); }
    String header(const char* name)    { return String(""); }
    void sendHeader(const char* name, const char* value) {}
};

#endif
