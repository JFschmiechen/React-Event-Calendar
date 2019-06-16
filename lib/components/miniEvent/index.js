import React from 'react';

import './style.css';

const miniEvent = (props) => {
    const { eventCount, color } = props;

    if (eventCount <= 0) return <div/>;

    return <div className='mini-event' style={{ backgroundColor: color }}>
        {eventCount}
    </div>
};

export default miniEvent;