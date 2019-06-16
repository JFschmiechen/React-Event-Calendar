import moment from 'moment';
import {
    MULTI_DAY_TYPE,
    PLACEHOLDER_TYPE,
    wrappingTiles,
    defaultConfig
} from "../values/strings";



const parseEvent = (event, args, config) => {
    const { numDays, numDaysInMonth, numDaysInLastMonth, offset, month, year, numTiles } = args;
    let monthOffsetLast = offset === 0 ? 0 : 1;
    let monthOffsetNext = numTiles - numDays - offset === 0 ? 0 : 1;

    const beginning = moment(`
        ${month === 1 ? year - 1 : year} - 
        ${(month - monthOffsetLast) >= 1 ? month - monthOffsetLast : 12} - 
        ${offset === 0 ? 1 : numDaysInLastMonth - offset + 1}`, 'YYYY-M-D');

    const end = moment(`
        ${month === 12 ? year + 1 : year} - 
        ${month + monthOffsetNext >= 12 ? 1 : month + monthOffsetNext} - 
        ${monthOffsetNext === 0 ? numDays : numTiles - numDays - offset}`, 'YYYY-M-D');

    const startDateString = moment(event.start, config.dateFormat);

    const endDateString = moment(event.end, config.dateFormat);

    let parsedMonth = startDateString.month() + 1;
    let parsedMonthEnd = endDateString.month() + 1;
    let parsedDay = startDateString.date();
    let parsedEnd = endDateString.date();

    let numDaysInParsedMonth = numDaysInMonth[parsedMonth + 1 < 12 ? parsedMonth + 1 : 1];

    let isBelowEventRange = !startDateString.isBetween(beginning, end, 'days', '[]');
    let isAboveEventRange = !endDateString.isBetween(beginning, end, 'days', '[]');

    if (isBelowEventRange && !isAboveEventRange) {
        parsedDay = numDaysInMonth[month - 2 >= 0 ? month - 2 : 11] - offset + 1;
    }

    if (parsedMonth !== parsedMonthEnd && parsedMonth === (month - 1 >= 1 ? month - 1 : 12) && parsedDay >= beginning.date() ) {
        parsedEnd = numDaysInLastMonth + parsedEnd;
    }

    if (parsedMonth !== parsedMonthEnd && parsedMonthEnd === (month + 1 <= 12 ? month + 1 : 1)) {
        parsedEnd = numDaysInParsedMonth + parsedEnd - 1;
    }

    return {
        parsedDay,
        parsedEnd,
        parsedMonth,
        parsedMonthEnd,
        startDateString,
        endDateString,
        isBelowEventRange,
        isAboveEventRange,
    };
};

const reorderEvents = (args) => {
    const { calendarList, numTiles, config } = args;
    let tileOverflowOffset = numTiles > 35 ? 1 : 0;
    let overflowLength = 3 - tileOverflowOffset;
    let multiEventPositions = [];
    let difference = 0;

    calendarList.map((eventArray, index) => {
        // A nono position is a spot in the eventArray that is reserved by a multi-day event in a previous tile.
        // We need to keep track of these positions so that they are not overrided when sorting.
        let nonoPositions = [];

        // Loop through previous tile and store multi-day event positions so that we can keep track of them when
        // determining the order of placeholder events.
        if (index !== 0) {
            calendarList[index - 1].map((previousEvent, previousArrayIndex) => {
                let { parsedDay, parsedEnd } = parseEvent(previousEvent, args, config);

                if (previousEvent.type === MULTI_DAY_TYPE) {
                    difference = parsedEnd - parsedDay;
                    multiEventPositions = multiEventPositions.concat([[previousArrayIndex, difference, index - 1]]);
                }

                // If multi-day event is going to overflow, show that event continues over multiple days in overflow count.
                if (calendarList[index - 1].length >= overflowLength) {
                    if (previousEvent.type === MULTI_DAY_TYPE && calendarList[index - 1].indexOf(previousEvent) >= 3 - tileOverflowOffset) {
                        for (let z = index - 1 ; z < index - 1 + (parsedEnd - parsedDay) ; z++) {
                            if (z < numTiles && calendarList.length === overflowLength) {
                                calendarList[z].length = calendarList[z].length + 1;
                            }
                        }
                    }
                }

                return 0; // Get rid of warning
            })
        }

        // If we have navigated through one row, reset multiEventPositions.
        if (wrappingTiles.includes(index - 1)) {
            multiEventPositions = [];
            return 0;
        }

        // NoNo positions
        multiEventPositions.map(position => {
           if (Math.abs((index + 1) - position[1]) <= position[2]) {
               nonoPositions.push(position[0]);
           }
           return 0;
        });

        eventArray.map((event, arrayIndex) => {
           if (event.type !== PLACEHOLDER_TYPE && nonoPositions.includes(arrayIndex)) {

               // Search for position to swap.
               for (let z = 0 ; z < calendarList[index].length ; z++) {
                   if (calendarList[index][z].type === PLACEHOLDER_TYPE && !nonoPositions.includes(z) && z !== arrayIndex) {
                       let temp = calendarList[index][z];
                       calendarList[index][z] = calendarList[index][arrayIndex];
                       calendarList[index][arrayIndex] = temp;
                   }
               }
           }
           return 0;
        });

        // Reorder tile so that placeholders are in the same array position as their multi-day event parents.


        return 0; // Get rid of warning
    })
};

const determineIndex = (parsedDay, args) => {
    const {parsedMonth, month, offset, numDaysInLastMonth, numDays } = args;
    switch(true) {
        // Event belongs to 'this' month
        case parsedMonth === month:
            return parsedDay + offset - 1;

        // Event belongs to previous month
        case parsedMonth === (month - 1 >= 1 ? month - 1 : 12):
            return parsedDay - numDaysInLastMonth + offset - 1;

        // Event belongs to next month
        default:
            return numDays + parsedDay + offset - 1
    }
};

const wrapLongEvent = (event, ranOnce, calendarList, parts, i, config) => {
    const { parsedDay, parsedEnd, offset, numTiles, month, numDaysInLastMonth, numDays } = parts;

    let endMonth = moment(event.end).month() + 1;

    let startMonth = moment(event.start).month() + 1;

    let start = 0, end = 0;

    start = determineIndex(parsedDay, { parsedMonth: startMonth, month, offset, numDays, numDaysInLastMonth });
    end = determineIndex(parsedEnd, { parsedMonth: startMonth, month, offset, numDays, numDaysInLastMonth });

    wrappingTiles.map((tileNum) => {

        if (start < tileNum + 1 && end > tileNum + 1 && i !== numTiles - 1 && !ranOnce && tileNum !== numTiles - 1) {

            // If a multi-day event takes place over one of the wrapping tiles, it will need to be
            // split into two events to prevent styles from overflowing past calendar border.
            // e.g. 2019-05-19 - 2019-05-22 -> 2019-05-19 - 2019-05-20 && 2019-05-21 - 2019-05-22 where day 20 is on the edge
            let original = calendarList[i].shift();

            // Create deep copies. Fairly slow, but easiest way to make a deep copy since JS does not
            // natively support deep copies.
            let firstEvent = JSON.parse(JSON.stringify(original));
            let secondEvent = JSON.parse(JSON.stringify(original));

            let firstEnd = moment(firstEvent.end);

            if (firstEnd.month() !== month) {
                firstEnd.set('month', month - 1);
            }

            firstEnd.set('date', tileNum - offset + 2);

            firstEvent.end = firstEnd.format(config.dateFormat);

            calendarList[i].unshift(firstEvent);

            let secondStart = moment(secondEvent.start);

            if (secondStart.month() !== month) {
                secondStart.set('month', month - 1);
            }

            secondStart.set('date', tileNum - offset + 2);

            secondEvent.start = secondStart.format(config.dateFormat);

            let newParts = {
                parsedDay: tileNum - offset + 2,
                parsedEnd: startMonth !== endMonth ? parsedEnd - numDays : parsedEnd,
                numTiles,
                offset,
                month,
            };

            if (calendarList[tileNum + 1]) {
                calendarList[tileNum + 1].unshift(secondEvent);
            }

            wrapLongEvent(secondEvent, ranOnce, calendarList, newParts, tileNum + 1, event, config);

            ranOnce = true;

        }
        return 0; // Get rid of warning
    })
};

const computeDifferences = (firstDateCreated, secondDateCreated, firstEvent, secondEvent, args) => {
    const { firstDateStart, firstDateEnd, secondDateStart, secondDateEnd, month, numDaysInMonth } = args;
    let numDays = numDaysInMonth[month - 1];

    switch(true) {
        // sort single day events by the date they were created
        case firstDateStart.date() === firstDateEnd.date() - 1 && secondDateStart.date() === secondDateEnd.date() - 1:
            return secondDateCreated.diff(firstDateCreated);

        case firstDateStart.date() === firstDateEnd.date() - 1:
            return -1;

        case secondDateStart.date() === secondDateEnd.date() - 1:
            return 1;

        case firstDateStart.month() !== firstDateEnd.month():
            return Math.abs((numDays - firstDateStart.date()) - firstDateEnd.date()) - Math.abs(secondDateStart.date() - secondDateEnd.date());

        case secondDateStart.month() !== secondDateEnd.month():
            return Math.abs(firstDateStart.date() - firstDateEnd.date()) - Math.abs((numDays - secondDateStart.date()) - secondDateEnd.date());

        default:
            return Math.abs(firstDateStart.date() - firstDateEnd.date()) - Math.abs(secondDateStart.date() - secondDateEnd.date()) === 0
                ? secondDateCreated.diff(firstDateCreated)
                : Math.abs(firstDateStart.date() - firstDateEnd.date()) - Math.abs(secondDateStart.date() - secondDateEnd.date());

    }
};

const parseConfig = (config) => {

    for (let key in defaultConfig) {
        if (!config.hasOwnProperty(key)) {
            config[key] = defaultConfig[key];
        }
    }

};

export { parseEvent, reorderEvents, parseConfig, wrapLongEvent, computeDifferences };