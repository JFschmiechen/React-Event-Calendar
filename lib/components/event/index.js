import React from 'react';
import Paper from '@material-ui/core/Paper';
import './style.css';

const Event = props => {
    const { text, eventType, styleObj, showArrowBefore, showArrowAfter, tileIndex, onClick, numTiles } = props;
    let heightOffset = numTiles > 35 ? 3.3 : 2.8; // Additional height of weekday divs
    let eventHeight = numTiles > 35 ? 0.9 : 1.2; // Divider
    return (
        <Paper
            className={eventType}
            onClick={onClick}
            style={{
                width: styleObj.width,
                height: tileIndex < 7 ? styleObj.height / eventHeight - heightOffset + '%' : styleObj.height / eventHeight + '%',
                backgroundColor: styleObj.color
        }}>
            <span
                className='event-continues-arrow'
                style={{
                    display: showArrowBefore ? 'flex' : 'none',
                    float: 'left',
                    margin: 'auto -5px auto 10px',
                }}>{'<'}</span>

            <span className='event-text' style={{ fontSize: '0.8em' }}>{`${text}`}</span>

            <span
                className='event-continues-arrow'
                style={{
                    display: showArrowAfter ? 'flex' : 'none'
                }}>{'>'}</span>
        </Paper>
    )
};

export default Event;