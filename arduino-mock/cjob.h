#ifndef CJOB_H
#define CJOB_H

#include "Arduino.h"
#include <time.h>

// cjob / TaskScheduler cron-job stub for simulator compilation.
// Supports interval-style expressions (*/N seconds, 0 */M minutes) and
// daily fixed-time expressions such as "0 40 17 * * *".

typedef int CronID_t;

enum _CronMode {
    _CRON_INTERVAL,
    _CRON_DAILY_FIXED
};

struct _CronField {
    bool any;
    int every;
    int value;
};

struct _CronEntry {
    void (*cb)();
    _CronMode mode;
    unsigned long intervalMs;
    unsigned long lastMs;
    bool first;
    bool once;
    bool enabled;
    bool completed;
    int second;
    int minute;
    int hour;
    int lastSecondOfDay;
};

static _CronEntry _cron_entries[16] = {};
static int _cron_n = 0;

static int _cronLocalSecondOfDay() {
    time_t now = time(NULL);
    struct tm* local = localtime(&now);
    if (!local) return 0;
    return local->tm_hour * 3600 + local->tm_min * 60 + local->tm_sec;
}

static const char* _cronSkipSpaces(const char* p) {
    while (p && *p == ' ') p++;
    return p;
}

static bool _cronIsDigit(char c) {
    return c >= '0' && c <= '9';
}

static const char* _cronReadField(const char* p, _CronField& field) {
    field.any = false;
    field.every = 0;
    field.value = -1;
    p = _cronSkipSpaces(p);
    if (!p || !*p) return p;

    if (*p == '*') {
        field.any = true;
        p++;
        if (*p == '/') {
            p++;
            int n = 0;
            while (_cronIsDigit(*p)) {
                n = n * 10 + (*p - '0');
                p++;
            }
            field.every = n > 0 ? n : 0;
        }
    } else if (_cronIsDigit(*p)) {
        int n = 0;
        while (_cronIsDigit(*p)) {
            n = n * 10 + (*p - '0');
            p++;
        }
        field.value = n;
    }

    while (*p && *p != ' ') p++;
    return p;
}

static bool _cronMatchesEvery(const _CronField& field) {
    return field.any && field.every > 0;
}

static bool _cronMatchesAny(const _CronField& field) {
    return field.any && field.every == 0;
}

static unsigned long _cronIntervalMsFromFields(const _CronField& sec, const _CronField& min) {
    if (_cronMatchesAny(sec)) return 1000UL;
    if (_cronMatchesEvery(sec)) return (unsigned long)sec.every * 1000UL;
    if (sec.value == 0 && _cronMatchesEvery(min)) return (unsigned long)min.every * 60000UL;
    return 60000UL;
}

static bool _cronParse(const char* expr, _CronEntry& entry) {
    if (!expr) return false;

    _CronField sec, min, hour, day, month, weekday;
    const char* p = expr;
    p = _cronReadField(p, sec);
    p = _cronReadField(p, min);
    p = _cronReadField(p, hour);
    p = _cronReadField(p, day);
    p = _cronReadField(p, month);
    _cronReadField(p, weekday);

    if (sec.value >= 0 && min.value >= 0 && hour.value >= 0) {
        entry.mode = _CRON_DAILY_FIXED;
        entry.second = sec.value;
        entry.minute = min.value;
        entry.hour = hour.value;
        entry.intervalMs = 0;
        entry.lastSecondOfDay = _cronLocalSecondOfDay();
        return true;
    }

    entry.mode = _CRON_INTERVAL;
    entry.intervalMs = _cronIntervalMsFromFields(sec, min);
    return true;
}

static bool _cronCrossedTarget(int previous, int current, int target) {
    if (previous < 0) return current == target;
    if (previous == current) return false;
    if (previous < current) return previous < target && target <= current;
    return target > previous || target <= current;
}

class CronClass {
public:
    CronID_t create(const char* expr, void (*cb)(), bool once) {
        if (_cron_n < 16 && cb) {
            _CronEntry e;
            e.cb = cb;
            e.mode = _CRON_INTERVAL;
            e.intervalMs = 60000UL;
            e.lastMs = 0;
            e.first = true;
            e.once = once;
            e.enabled = true;
            e.completed = false;
            e.second = 0;
            e.minute = 0;
            e.hour = 0;
            e.lastSecondOfDay = -1;
            _cronParse(expr, e);
            _cron_entries[_cron_n++] = e;
        }
        return _cron_n - 1;
    }

    void enable(CronID_t id) {
        if (id >= 0 && id < _cron_n) _cron_entries[id].enabled = true;
    }

    void disable(CronID_t id) {
        if (id >= 0 && id < _cron_n) _cron_entries[id].enabled = false;
    }

    void free(CronID_t id) {
        if (id >= 0 && id < _cron_n) _cron_entries[id].completed = true;
    }

    void delay() {
        ::delay(10);
        unsigned long nowMs = millis();
        int nowSecondOfDay = _cronLocalSecondOfDay();

        for (int i = 0; i < _cron_n; i++) {
            _CronEntry& e = _cron_entries[i];
            if (!e.enabled || e.completed) continue;

            bool shouldRun = false;
            if (e.mode == _CRON_DAILY_FIXED) {
                int target = e.hour * 3600 + e.minute * 60 + e.second;
                shouldRun = _cronCrossedTarget(e.lastSecondOfDay, nowSecondOfDay, target);
                e.lastSecondOfDay = nowSecondOfDay;
            } else if (e.first || nowMs - e.lastMs >= e.intervalMs) {
                shouldRun = true;
                e.first = false;
                e.lastMs = nowMs;
            }

            if (shouldRun && e.cb) {
                e.cb();
                if (e.once) e.completed = true;
            }
        }
    }
};

static CronClass Cron;

#endif
