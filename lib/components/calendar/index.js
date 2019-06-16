import React from 'react';

import CalendarItem from '../calendarItem';
import './style.css';

const Calendar = props => {
    const { calendarList, month, year, config } = props;
    return (
        <div className='calendar-container'>
                <div className='calendar-tile-container'>
                    {calendarList.map((eventArray, index) => {
                        return <CalendarItem
                            month={month}
                            year={year}
                            key={index}
                            eventArray={eventArray}
                            tileIndex={index}
                            numTiles={calendarList.length}
                            config={config}
                        />
                    })}
                </div>
        </div>
    )
};

export default Calendar;