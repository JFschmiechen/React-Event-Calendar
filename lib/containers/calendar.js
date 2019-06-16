import React, { Component } from 'react';
import moment from 'moment';
import ReactResizeDetector from 'react-resize-detector';

import CalendarFrame from '../components/calendar';
import {
    MULTI_DAY_TYPE,
    PLACEHOLDER_TYPE, SINGLE_DAY_TYPE,
    wrappingTiles
} from "../resources/values/strings";
import {
    parseConfig,
    parseEvent,
    reorderEvents,
    wrapLongEvent,
    computeDifferences
} from "../resources/utilities";

class Calendar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            calendarList: null,
            isLoading: true,
            month: 0,
            year: 0,
            numDaysInMonth: 0,
            isMobile: false,
            frameRef: React.createRef(),
        };

        this.initCalendarList = this.initCalendarList.bind(this);
        this.loadEvent = this.loadEvent.bind(this);
        this.loadCalendarList = this.loadCalendarList.bind(this);
    }

    /*
     * Load events and config props from the parent component. Events here are copied so that when we determine the
     * event type in the loadCalendarList function, we do not mutate the passed events which may have other uses in
     * their program.
     *
     * parseConfig checks for missing data members such as colors or weekdays, and injects default values for those
     * fields into the config object. This ensures calendar events will always be colored.
     */
    componentDidMount() {
        const { items, config, month, year } = this.props;

        // Create deep copy so that user input is not mutated.
        let eventsCopy  = JSON.parse(JSON.stringify(items));

        // Inject defaults if key is not overwritten.
        parseConfig(config);

        let safeMonth = month ? month : new Date().getMonth() + 1;
        let safeYear = year ? year : new Date().getFullYear();

        this.initCalendarList(safeMonth, safeYear, () => {
            this.loadCalendarList(eventsCopy, safeMonth, safeYear);
        });
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if ( (nextProps.month !== this.props.month || nextProps.year !== this.props.year) && nextProps.items) {
            const { items, config, month, year } = nextProps;

            // Create deep copy so that user input is not mutated.
            let eventsCopy  = JSON.parse(JSON.stringify(items));

            // Inject defaults if key is not overwritten.
            parseConfig(config);

            let safeMonth = month ? month : new Date().getMonth() + 1;
            let safeYear = year ? year : new Date().getFullYear();

            this.initCalendarList(safeMonth, safeYear, () => {
                this.loadCalendarList(eventsCopy, safeMonth, safeYear);
            });
        }
    }

    /*
     * Initialize empty calendar list of a given length. This step is important because it allows us to use unshift
     * functions to load our events without worrying about the calendar index being undefined.
     *
     * This is the starting point of the calendar, and everything flows from here.
     * initCalendarList -> loadCalendarList -> loadEvent -> calendarList passed to presentational components and displayed.
     *
     * @param callBack: This callBack is the loadCalendarList function. Once the calendar has been initialized,
     *                  we can begin loading it.
     */
    initCalendarList(month, year, callBack) {
        const numDaysInMonth = [31, year % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
        let calendarList = [];

        let numDays = numDaysInMonth[month - 1];
        let offset = moment(`${year}-${month}-01`, 'YYYY-M-DD').day();
        let numTiles = offset + numDays > 35 ? 35 + 7 : 35;

        for (let i = 0; i < numTiles ; i++) {
            calendarList[i] = [];
        }

        this.setState({ calendarList, numDaysInMonth }, () => callBack());

    }

    /* Sort and iterate over copied events, assigning types and determining their place on the calendar.
     * numDays, offset, and most of the variables below are used to calculate the event's position from it's start
     * and end dates.
     */
    loadCalendarList(events, month, year) {
        // Six weeks, four weeks = selected month, one week for months before and after - 42 days total.
        // Group events on the same day, each element in array represents one day.
        const { calendarList, numDaysInMonth } = this.state;
        const { config } = this.props;

        if (!config) return null;

        let firstDateStart = null, firstDateEnd = null;
        let secondDateStart = null, secondDateEnd = null;
        let firstDateCreated = null, secondDateCreated = null;

        let numDays = numDaysInMonth[month - 1];
        let numDaysInLastMonth = numDaysInMonth[month - 2 >= 0 ? month - 2 : 11];
        let numDaysInNextMonth = numDaysInMonth[month > 11 ? 0 : month];
        let offset =  moment(`${year}-${month}-01`, "YYYY-M-DD").day();
        let numTiles = offset + numDays > 35 ? 35 + 7 : 35;

        let argsObject = { numDays, numDaysInMonth, numDaysInLastMonth, numDaysInNextMonth, offset, month, year, numTiles };

        events.sort((firstEvent, secondEvent) => {

            firstDateCreated = moment(firstEvent.created);
            secondDateCreated = moment(secondEvent.created);

            firstDateStart = moment(firstEvent.start, config.dateFormat);
            firstDateEnd = moment(firstEvent.end, config.dateFormat);

            secondDateStart = moment(secondEvent.start, config.dateFormat);
            secondDateEnd = moment(secondEvent.end, config.dateFormat);

            const args = {
                firstDateStart,
                firstDateEnd,
                secondDateStart,
                secondDateEnd,
                month,
                numDaysInMonth,
            };

            return computeDifferences(
                firstDateCreated,
                secondDateCreated,
                firstEvent,
                secondEvent,
                args
            );

        });

        events.map(event => {

            const {
                parsedDay,
                parsedEnd,
                parsedMonth,
                parsedMonthEnd,
                isBelowEventRange,
                isAboveEventRange
            } = parseEvent(event, argsObject, config);

            const parts = {
                numTiles,
                parsedDay,
                parsedEnd,
                offset,
                month,
                numDaysInLastMonth,
                numDays,
            };

            if (!isBelowEventRange || !isAboveEventRange) {
                for (let i = parsedDay, j = 0 ; i < parsedEnd; i++, j++) {
                    switch(true) {
                        // Event is multiple days long
                        case Math.abs(parsedEnd - parsedDay) > 1:
                            event.type = MULTI_DAY_TYPE;
                            break;

                        // Event takes place over a single day
                        case parsedMonth === parsedMonthEnd
                            ? Math.abs(parsedEnd - parsedDay) <= 1
                            : Math.abs((parsedEnd - parsedDay) - parsedDay) <= 1:
                            event.type = SINGLE_DAY_TYPE;
                            break;

                        // If event reaches here, there is likely something wrong with its structure.
                        // Set it as a placeholder so it is less likely to disrupt other events.
                        default:
                            event.type = PLACEHOLDER_TYPE;
                            break;
                    }

                    switch(true) {
                        // Event belongs to 'this' month
                        case parsedMonth === month:
                            this.loadEvent(event, calendarList, i + offset - 1, parts, j);
                            break;

                        // Event belongs to previous month
                        case parsedMonth === (month - 1 >= 1 ? month - 1 : 12):
                            this.loadEvent(event, calendarList, i - numDaysInLastMonth + offset - 1, parts, j);
                            break;

                        // Event belongs to next month
                        default:
                            this.loadEvent(event, calendarList, numDays + i + offset - 1, parts, j);
                            break;
                    }
                }
            }

            return 0; // Get rid of warning
        });

        // Perform second pass to reorder placeholder events so that space can be saved.
        reorderEvents({ calendarList, numDays, numDaysInMonth, numDaysInLastMonth, numDaysInNextMonth, offset, month, year, numTiles, config });

        this.setState({ calendarList, isLoading: false, month, year });
    }

    /* Place event into appropriate spot on calendar, check for vertical overflow, and wrap events that extend past
     * calendar border.
     *
     * This is the last step before the calendarList is passed to the presentational components.
     */
    loadEvent(event, calendarList, i, parts, j) {
        const { config } = this.props;
        const { parsedEnd, numTiles } = parts;
        let ranOnce = false;
        if (i >= 0 && i < numTiles && j === 0 ) {
            calendarList[i].unshift(event);

            wrapLongEvent(event, ranOnce, calendarList, parts, i, event, config);

        } else {
            let start = moment(event.start, config.dateFormat);
            let end = moment(event.end, config.dateFormat);

            if (i >= 0 && i < numTiles) {
                if (!wrappingTiles.includes(i - 1)) {
                    calendarList[i].unshift({
                        summary: event.summary,
                        created: event.created,
                        type: PLACEHOLDER_TYPE,
                        start: {date: `${start.year()}-${start.month() + 1}-${parsedEnd}`},
                        end: {date: `${end.year()}-${end.month() + 1}-${parsedEnd}`}
                    });
                }
            }
        }
    }

    /* Calendar will shrink into mobile mode when the calendar's container is below a certain height or width.
     * Width and height values are determined to be the lowest values possible and still retain calendar integrity.
     */
    checkParentDimensions(ref) {
        let width = ref.current.clientWidth;
        let height = ref.current.clientHeight;

        if (width < 451 || height < 521) {
            this.setState({
                isMobile: true,
            })
        } else {
            this.setState({
                isMobile: false
            })
        }
    }

    render() {
        const { config } = this.props;
        const { calendarList, isLoading, month, year, numDaysInMonth, isMobile, frameRef } = this.state;

        if (isLoading) { return (<div />); }

        // Patch for leap years since year value is dynamic.
        config.numDaysInMonth = numDaysInMonth;
        config.isMobile = isMobile;

        return (
            <div className='calendar-frame' ref={frameRef} style={{ height: config.height, width: config.width }}>
                <CalendarFrame year={year} month={month} calendarList={calendarList} config={config} />
                <ReactResizeDetector
                    handleHeight
                    handleWidth
                    onResize={() => this.checkParentDimensions(frameRef)}
                    refreshMode={'debounce'}
                    refreshRate={200}
                />
            </div>
        )
    }
}

export const EventCalendar = Calendar;
export const eventTypes = { PLACEHOLDER_TYPE, MULTI_DAY_TYPE, SINGLE_DAY_TYPE };
