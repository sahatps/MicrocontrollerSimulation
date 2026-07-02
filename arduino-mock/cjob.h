#ifndef CJOB_H
#define CJOB_H

#include "Arduino.h"

// cjob / TaskScheduler cron-job stub for Emscripten compilation
// Parses the seconds (and minutes) field of the cron expression to derive
// a real interval; each callback fires after its own interval elapses.

typedef int CronID_t;

struct _CronEntry {
    void         (*cb)();
    unsigned long intervalMs;
    unsigned long lastMs;
    bool          first;
};

static _CronEntry _cron_entries[16] = {};
static int        _cron_n           = 0;

// Parse "*/N ..." → N seconds.  "0 */M ..." → M minutes.  Default 60 s.
static unsigned long _cronIntervalMs(const char* expr) {
    if (!expr) return 60000UL;
    const char* p = expr;
    // skip leading whitespace
    while (*p == ' ') p++;
    // seconds field: */N
    if (p[0] == '*' && p[1] == '/') {
        int n = atoi(p + 2);
        if (n > 0) return (unsigned long)n * 1000UL;
    }
    // seconds field: fixed value (e.g. "0") → look at minutes field
    // advance past first field
    while (*p && *p != ' ') p++;
    while (*p == ' ') p++;
    if (*p == '*' && *(p+1) == '/') {
        int m = atoi(p + 2);
        if (m > 0) return (unsigned long)m * 60000UL;
    }
    return 60000UL; // default: 1 minute
}

class CronClass {
public:
    CronID_t create(const char* expr, void (*cb)(), bool /*once*/) {
        if (_cron_n < 16 && cb) {
            _CronEntry e;
            e.cb         = cb;
            e.intervalMs = _cronIntervalMs(expr);
            e.lastMs     = 0;
            e.first      = true;
            _cron_entries[_cron_n++] = e;
        }
        return _cron_n - 1;
    }
    void delay() {
        ::delay(10);
        unsigned long now = millis();
        for (int i = 0; i < _cron_n; i++) {
            _CronEntry& e = _cron_entries[i];
            if (e.first || now - e.lastMs >= e.intervalMs) {
                e.first  = false;
                e.lastMs = now;
                if (e.cb) e.cb();
            }
        }
    }
};

static CronClass Cron;
#endif
