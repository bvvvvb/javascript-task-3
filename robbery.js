'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var HOURS_IN_DAY = 24;
var MINUTES_IN_HOUR = 60;
var MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
var ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];
var OFFSET = { 'ВС': -1, 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3 };

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var needTimeZone = parseInt(workingHours.from.slice(5), 10);
    var busySchedule = createBusySchedule(needTimeZone, schedule);
    var freeSchedule = createFreeSchedule(busySchedule, workingHours);
    var appropriateMoment = findAppropriateMoment(freeSchedule, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(freeSchedule.length) || (appropriateMoment !== undefined);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!appropriateMoment) {
                return '';
            }

            return template
                .replace('%DD', appropriateMoment.weekday)
                .replace('%HH', appropriateMoment.hours)
                .replace('%MM', appropriateMoment.minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!freeSchedule.length) {
                return false;
            }

            freeSchedule[0].from = freeSchedule[0].from + 30;

            var nextAppropriateMoment = findAppropriateMoment(freeSchedule, duration);

            if (nextAppropriateMoment) {
                appropriateMoment = nextAppropriateMoment;
            }

            return Boolean(freeSchedule.length);
        }
    };
};

function convertToTimeZone(needTimeZone, time) {
    var weekday = time.slice(0, 2);
    var timeZone = parseInt(time.slice(8), 10);
    var hours = parseInt(time.slice(3, 5), 10) - timeZone + needTimeZone;
    var minutes = parseInt(time.slice(6, 8), 10);

    return hours * MINUTES_IN_HOUR + OFFSET[weekday] * MINUTES_IN_DAY + minutes;
}

function addToBusySchedule(needTimeZone, busySchedule, personSchedule) {
    personSchedule.forEach(function (interval) {
        busySchedule.push({
            from: convertToTimeZone(needTimeZone, interval.from),
            to: convertToTimeZone(needTimeZone, interval.to)
        });
    });
}

function createBusySchedule(needTimeZone, schedule) {
    var busySchedule = [];

    Object.keys(schedule)
        .forEach(function (key) {
            addToBusySchedule(needTimeZone, busySchedule, schedule[key]);
        });

    return busySchedule;
}

function createFreeSchedule(busySchedule, workingHours) {
    var freeSchedule = [];

    var workingFrom = parseInt(workingHours.from.slice(0, 2), 10) * MINUTES_IN_HOUR +
        parseInt(workingHours.from.slice(3, 5), 10);
    var workingTo = parseInt(workingHours.to.slice(0, 2), 10) * MINUTES_IN_HOUR +
        parseInt(workingHours.to.slice(3, 5), 10);

    for (var i = 0; i < ROBBERY_DAYS.length; i++) {
        freeSchedule.push({
            from: i * MINUTES_IN_DAY + workingFrom,
            to: i * MINUTES_IN_DAY + workingTo
        });
    }

    busySchedule.forEach(function (interval) {
        correctFreeSchedule(freeSchedule, interval.from, interval.to);
    });

    return freeSchedule;
}

function correctFreeSchedule(freeSchedule, from, to) {
    freeSchedule.forEach(function (interval, i) {
        var fromFree = interval.from;
        var toFree = interval.to;

        // 'Cвободный интервал' целиком лежит в 'занятом': (from {fromFree toFree} to)
        // ==> Удаляем интервал (fromFree toFree) из свободного расписания
        if (fromFree > from && toFree < to) {
            freeSchedule.splice(i, 1);
        }

        // 'Занятый интервал' целиком лежит в 'свободном': {fromFree (from to) toFree}
        // ==> Делим интервал (fromFree toFree) на два: (fromFree from), (to toFree)
        if (fromFree < from && toFree > to) {
            interval.to = from;
            freeSchedule.splice(i + 1, 0, { from: to, to: toFree });
        }

        // Правая часть 'свободного интервала' лежит в 'занятом': {fromFree (from toFree} to)
        // ==> Оставляем только левую часть (fromFree from)
        if (fromFree < from && toFree > from && toFree <= to) {
            interval.to = from;
        }

        // Левая часть 'свободного интервала' лежит в 'занятом': (from {fromFree to) toFree}
        // ==> Оставляем только правую часть (to toFree)
        if (fromFree < to && toFree > to && from <= fromFree) {
            interval.from = to;
        }
    });
}

function findAppropriateMoment(freeSchedule, duration) {
    while (freeSchedule.length && (freeSchedule[0].to - freeSchedule[0].from) < duration) {
        freeSchedule.splice(0, 1);
    }

    if (freeSchedule.length) {
        return parseTime(freeSchedule[0].from);
    }
}

function parseTime(time) {
    var hours = Math.floor(time / MINUTES_IN_HOUR);
    var minutes = time % MINUTES_IN_HOUR;
    var day = Math.floor(hours / HOURS_IN_DAY);

    return {
        hours: toTwoDigits(hours - HOURS_IN_DAY * day),
        minutes: toTwoDigits(minutes),
        weekday: ROBBERY_DAYS[day]
    };
}

function toTwoDigits(number) {
    return (number < 10) ? '0' + number : number.toString();
}
