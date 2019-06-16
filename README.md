# React Event Calendar


[Live demo](https://jfconnect-1e366.firebaseapp.com/)


### Installation

```
npm install @jfschmiechen/react-event-calendar
```

## API

### Calendar Props

| Prop        | Type           | Description  | Default |
| ------------- |:---:| ------| :-------------:|      
| items       | [object] | This is an array of event objects. Each object needs a text, start, and end value. | Null
| month      | integer | Determines what month the calendar is viewing | Current month
| year      | integer      | Determines what year the calendar is viewing | Current Year
| config | object | The config object contains values that won't be changing often such as event declarations. See next table and examples below. | Null

### Config Object

| Key | Type | Description | Default |
| ----| -----| ----------- | ------- |
| height | string | Height of calendar. Value must be calculable otherwise the calendar frame loses integrity. | 600px |
| width | string | Width of calendar. Value must be calculable otherwise the calendar frame loses integrity. | 1000px
| colors | object      | Allows customization of calendar theme. Object contains primaryColor and secondaryColor fields |{ primaryColor: 'slateblue', secondaryColor: 'lightslategray' }
| onEventClick | function | Takes a function that is passed the click event, calendar event, and an array of all events in it's tile. | Null
| onTileClick | function | Takes a function that is passed an array of all events in the tile, and the click event. | Null
| onPlusMoreClick | function | Functionally the same as onTileClick, but is triggered when the tile overflow text is clicked. | Null
| weekDays | [string] | Starting on Sunday, this array contains names of each week day. If you want the day names to be in another language, override this with an array of the translated names. | ['Sunday', 'Monday', ...]
| dateFormat | string | This needs to be set if you are using a different date format than the default value. That way, the calendar can parse dates correctly. See [moment.js](https://momentjs.com/) for more formats.  | 'YYYY-MM-DD' |

### Event Schema

| Key | Type | Description |
| --- | ---- | ----------- |
| text | string | This is the text that appears on the event itself. |
| start | string | The date / date time the event starts.
| end | string | The date / date time the event ends.
| color | string | If this is not set the event will take on the primaryColor defined in the config.
* If your events have more fields than these, include them when you pass the events to the calendar and they will be available to use when the event listeners fire.

## Example

```javascript
import React from 'react';
import { EventCalendar, eventTypes } from '@jfschmiechen/react-event-calendar';

// Event source (array of event objects)
import events from './lib/resources/events-json';

let parsedEvents = [];
// Create shim so that the calendar can get the correct data from each event.
// In this example, I am using events from a google calendar.
events.items.map(event => {
    let tempObject = {};

    tempObject.start = event.start.dateTime ? event.start.dateTime : event.start.date;
    tempObject.end = event.end.dateTime ? event.end.dateTime : event.end.date;
    tempObject.text = event.summary;

    parsedEvents.push(tempObject);
});

// These colors allow customization to the theme.
// default colors are slateblue and lightslategray.
let colors = {
    primaryColor: 'slateblue',
    secondaryColor: 'lightslategray'
};

// The config contains all settings for the event calendar.
// See the API table to see all possible values.
let config = {
    colors,
    onEventClick: (e, event, eventArray) => console.log(event.type === eventTypes.SINGLE_DAY_TYPE),
    onTileClick: (e, eventArray) => console.log(eventArray),
    onPlusMoreClick: (e, eventArray) => console.log(eventArray)
};

// Lastly, pass the events and config to the calendar, and you are done.
function App() {
  return (
      <EventCalendar items={parsedEvents} month={5} year={2019} config={config} />
  );
}

export default App;
```

## Notes

* Events passed to this component are deep copied in order to keep immutability.
* If calendar width is less than 450px OR height is less than 520px, the calendar will enter a mobile view since at that size the full size events are not legible. 

## Built With

* [moment.js](https://momentjs.com/) - I used this to handle dates and formatting.
* [react-resize-detector](https://www.npmjs.com/package/react-resize-detector) - Used to make the calendar more responsive.
* [materialUI](https://material-ui.com/) - Used this to create calendar tiles and events.

## Authors

* **James Schmiechen**  - [Learn more](https://jfschmiechen.github.io/)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
