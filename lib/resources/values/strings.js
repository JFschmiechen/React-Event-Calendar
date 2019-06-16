
// Types

export const MULTI_DAY_TYPE = 'MULTI-DAY-EVENT';
export const SINGLE_DAY_TYPE = 'SINGE-DAY-EVENT';
export const PLACEHOLDER_TYPE = 'PLACEHOLDER-EVENT';

// Translate

export const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Constants

export const wrappingTiles = [6, 13, 20, 27, 34];

// Colors

export const primaryColor = 'slateblue';
export const secondaryColor = 'lightslategray';

// Default config

export const defaultConfig = {
    colors: {
        primaryColor,
        secondaryColor,
    },
    weekDays: days,
    dateFormat: 'YYYY-MM-DD',
    height: 600,
    width: 1000,
};
