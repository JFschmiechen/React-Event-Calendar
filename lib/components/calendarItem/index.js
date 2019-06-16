import React from 'react';
import Card from '@material-ui/core/Card';
import moment from 'moment';

import Event from '../event';
import MiniEvent from '../miniEvent';
import {
    MULTI_DAY_TYPE,
    SINGLE_DAY_TYPE
} from '../../resources/values/strings';
import './style.css';
import { parseEvent } from "../../resources/utilities";

const CalendarItem = props => {
    const { eventArray, tileIndex, month, year, numTiles, config } = props;
    const { isToday, number, notPrimary } = displayCalendarNumber(month, year, tileIndex, config);

    const { primaryColor, secondaryColor } = config.colors;
    const { isMobile } = config;

    // Tiles with the week day names need to be longer so that they have the same room as other
    // tiles. + 2 is the increased height, and the longer formula below maintains a consistent
    // calendar height despite the alternating number of tiles in each month.
    let tileHeight = tileIndex < 7
        ? (100 / (numTiles / 7)) + 2 + '%'
        : (100 / (numTiles / 7)) - (2 / ((numTiles / 7) - 1)) + '%';

    return (
        <Card
            elevation={0}
            square
            id={`tile-${tileIndex}`}
            className='calendar-tile'
            onClick={(e) => { config.onTileClick(e, eventArray) }}
            style={{
                height: tileHeight,
                width: (100 / 7) + '%',
                boxShadow: isToday ? `0 -2px 0 ${primaryColor}` : null,
                outline: !isMobile ? '0.5px solid lightgray' : null,
            }}
        >
            {/* Display week days and tile number at the top of the calendar. */}
            <div style={{ color: isToday ? primaryColor : null }}>
                <p className='week-day-headers' style={{ color: secondaryColor }}>
                    {tileIndex < 7
                        ? <span>
                            {!isMobile
                            ? moment(tileIndex, 'e').format('dddd')
                            : moment(tileIndex, 'e').format('ddd')}
                        </span>
                        : null}
                </p>
                <div style={{ color: notPrimary ? secondaryColor : null }}>
                    {!isMobile
                        ? number === 1
                            ? `${renderMonthWithTileIndex(month, year, tileIndex, config)} ${number}`
                            : number
                        : number}
                </div>

            </div>
            {!isMobile
            ? eventArray.map((event, index) => {
                    return index < 4 ? (
                         displayEventsWithLengths(event, month, year, number, tileIndex, index, eventArray, config)
                    ) : null;
                })
            : <MiniEvent color={primaryColor} eventCount={eventArray.length} />}
        </Card>
    )
};

export default CalendarItem;

function renderMonthWithTileIndex(month, year, tileIndex, config) {
    let currentMonth = moment(`${year}-${month}-01`, 'YYYY-M-DD');
    let numDays = config.numDaysInMonth[month - 1 > 0 ? 11 : month - 1];
    let offset = getMonthStartOffset(month, year);

    if (tileIndex < numDays - offset) {
        return currentMonth.format('MMM');
    } else {
        return moment(`${year}-${month + 1 > 12 ? 1 : month + 1}-01`, 'YYYY-M-DD').format('MMM');
    }
}

function getMonthStartOffset(month, year) {
    return moment(`${year}-${month}-01`, "YYYY-M-DD").day();
}

function renderEventWithProps(event, eventType, props) {
    return (
        <Event
            key={props.id}
            eventType={eventType}
            text={event.text}
            start={event.start}
            end={event.end}
            location={event.location}
            { ...props }
        />
    )
}

function displayCalendarNumber(month, year, tileIndex, config) {
    let offset = getMonthStartOffset(month, year);
    let numDays = config.numDaysInMonth[month - 1];
    let numDaysInLastMonth = config.numDaysInMonth[month - 2 > 0 ? month - 2 : 0];

    let today = new Date().getDate();
    let thisMonth = new Date().getMonth() + 1;
    let thisYear = new Date().getFullYear();

    let difference = numDaysInLastMonth - offset + tileIndex + 1;

    if (difference < numDaysInLastMonth + 1) {
        return {
            notPrimary: true,
            isToday: false,
            number: difference
        };
    } else {
        if (tileIndex - offset + 1 > numDays) {
            return {
                notPrimary: true,
                isToday: false,
                number: tileIndex - offset + 1 - numDays
            };
        } else {
            return {
                notPrimary: false,
                isToday: tileIndex - offset + 1 === today && month === thisMonth && year === thisYear,
                number: tileIndex - offset + 1
            };
        }

    }
}

function displayEventsWithLengths(event, month, year, calendarNumber, tileIndex, index, eventArray, config) {
    let offset = getMonthStartOffset(month, year);
    let numTiles = offset + config.numDaysInMonth[month - 1] > 35 ? 35 + 7 : 35;
    let tileOverflowOffset = numTiles > 35 ? 1 : 0;

    if (index < 4 - tileOverflowOffset) {
        let numDaysInLastMonth = config.numDaysInMonth[month - 2 >= 0 ? month - 2 : 11];
        let numDaysInNextMonth = config.numDaysInMonth[month <= 11 ? month : 0];
        let numDays = config.numDaysInMonth[month - 1];

        let argsObject = { numDays,
            numDaysInMonth: config.numDaysInMonth,
            numDaysInLastMonth,
            numDaysInNextMonth,
            offset,
            month,
            year,
            numTiles
        };

        const {
            parsedDay,
            parsedEnd,
            isBelowEventRange,
            isAboveEventRange
        } = parseEvent(event, argsObject, config);

        let difference = Math.abs(parsedEnd - parsedDay);

        // If multi-day event has no room to display itself, we will have to hide placeholder events too.
        let cutOff = event.type !== SINGLE_DAY_TYPE ? 4 - tileOverflowOffset : 5 - tileOverflowOffset;

        let styleObj = {
            width: tileIndex === numTiles - 1
                ? (100) - 10 + '%'
                : (100) * difference - 10 + '%',
            height: (100 / (numTiles / 7)),
            color: event.color ? event.color : config.colors.primaryColor,
        };

        let eventProps = {
            id: `${calendarNumber}${index}`,
            onClick: (e) => {
                e.stopPropagation();
                config.onEventClick(e, event, eventArray)
            },
            styleObj,
            tileIndex,
            numTiles
        };

        if (eventArray.length < cutOff || index !== 3 - tileOverflowOffset) {
            switch (event.type) {
                case MULTI_DAY_TYPE:
                    return renderEventWithProps(event, 'multi-day-event', {
                        showArrowAfter: isAboveEventRange && tileIndex === numTiles - 1,
                        showArrowBefore: isBelowEventRange && tileIndex === 0,
                        ...eventProps
                    });

                case SINGLE_DAY_TYPE:
                    return renderEventWithProps(event, 'single-day-event', eventProps);

                default:
                    return renderEventWithProps(event, 'placeholder-event', eventProps);

            }
        } else {
            return (
                <span
                    key={`plusMore-${tileIndex}`}
                    className='plus-more'
                    style={{ color: config.colors.primaryColor }}
                    onClick={(e) => {
                        e.stopPropagation();
                        config.onPlusMoreClick(e, eventArray)
                    }}>
                    {`+${eventArray.length - index} more`}
                </span>
            )
        }
    }
}