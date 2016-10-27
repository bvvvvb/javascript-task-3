'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var needTimeZone = parseInt(workingHours.from.slice(5, 7));

    var busySchedule = [];

    var workingHoursMonday = {
        from: parseInt(workingHours.from.slice(0, 2) + workingHours.from.slice(3, 5)),
        to: parseInt(workingHours.to.slice(0, 2) + workingHours.to.slice(3, 5))
    };

    var freeSchedule = [
        workingHoursMonday,
        { from: workingHoursMonday.from + 2400, to: workingHoursMonday.to + 2400 },
        { from: workingHoursMonday.from + 4800, to: workingHoursMonday.to + 4800 }
    ];

    var appropriateMoment;

    makeBusySchedule(busySchedule, needTimeZone, schedule);
    changeFreeSchedule(busySchedule, freeSchedule);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            while (freeSchedule.length && getIntervalLength(freeSchedule[0]) < duration) {
                freeSchedule.splice(0, 1);
            }

            if (freeSchedule.length) {
                appropriateMoment = parseTime(freeSchedule[0].from);
            }

            return Boolean(freeSchedule.length);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            this.exists();

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
            if (freeSchedule.length) {
                this.exists();

                freeSchedule[0].from = addHalfHour(freeSchedule[0].from);
            }

            return this.exists();
        }
    };
};

function convertToTimeZone(needTimeZone, time) {
    var offset = { 'ВС': -24, 'ПН': 0, 'ВТ': 24, 'СР': 48, 'ЧТ': 72 };
    var weekday = time.slice(0, 2);
    var timeZone = parseInt(time.slice(8, 10));
    var hours = parseInt(time.slice(3, 5)) - timeZone + needTimeZone + offset[weekday];
    var minutes = parseInt(time.slice(6, 8));

    return hours * 100 + minutes;
}

function addToBusySchedule(busySchedule, needTimeZone, array) {
    for (var i = 0; i < array.length; i++) {
        busySchedule.push({
            from: convertToTimeZone(needTimeZone, array[i].from),
            to: convertToTimeZone(needTimeZone, array[i].to)
        });
    }
}

function makeBusySchedule(busySchedule, needTimeZone, schedule) {
    addToBusySchedule(busySchedule, needTimeZone, schedule.Danny);
    addToBusySchedule(busySchedule, needTimeZone, schedule.Rusty);
    addToBusySchedule(busySchedule, needTimeZone, schedule.Linus);
}

function changeFreeSchedule(busySchedule, freeSchedule) {
    for (var i = 0; i < busySchedule.length; i++) {
        changeInterval(freeSchedule, busySchedule[i].from, busySchedule[i].to);
    }
}

function changeInterval(freeSchedule, from, to) {
    for (var i = 0; i < freeSchedule.length; i++) {
        var fromFree = freeSchedule[i].from;
        var toFree = freeSchedule[i].to;

        if (fromFree > from && toFree < to) {
            freeSchedule.splice(i, 1);
        }

        if (fromFree < from && toFree > to) {
            freeSchedule[i].to = from;
            freeSchedule.splice(i + 1, 0, { from: to, to: toFree });
        }

        if (fromFree < from && toFree > from && toFree <= to) {
            freeSchedule[i].to = from;
        }

        if (fromFree < to && toFree > to && from <= fromFree) {
            freeSchedule[i].from = to;
        }
    }
}

function getIntervalLength(interval) {
    var fromHours = Math.floor(interval.from / 100);
    var fromMinutes = interval.from % 100;
    var toHours = Math.floor(interval.to / 100);
    var toMinutes = interval.to % 100;

    return (toHours - fromHours) * 60 - fromMinutes + toMinutes;
}

function parseTime(time) {
    var hours = Math.floor(time / 100);
    var day = Math.floor(hours / 24);

    return {
        hours: toTwoDigits(hours - 24 * day),
        minutes: toTwoDigits(time % 100),
        weekday: ['ПН', 'ВТ', 'СР'][day]
    };
}

function toTwoDigits(number) {
    if (number < 10) {
        return '0' + number;
    }

    return String(number);
}

function addHalfHour(time) {
    var hours = Math.floor(time / 100);
    var minutes = time % 100 + 30;

    if (minutes <= 59) {
        return hours * 100 + minutes;
    }

    return (hours + 1) * 100 + minutes - 60;
}
