/**
 * This is the en-001 short locale date format. Setting as default.
 */
export const DEFAULT_LOCALE_FORMAT: string = 'dd/MM/y';
export const DEFAULT_LOCALE_TIME_FORMAT: string = 'HH:mm:ss';
export const DEFAULT_LOCALE_DATETIME_FORMAT: string = 'dd/MM/y HH:mm:ss';

// https://en.wikipedia.org/wiki/Date_format_by_country
export const LITTLE_ENDIAN_REGEX: RegExp = /d+.+m+.+y+/i;
export const MIDDLE_ENDIAN_REGEX: RegExp = /m+.+d+.+y+/i;
// No need for BIG_ENDIAN_REGEX because anything that doesn't satisfy the above 2
// is automatically BIG_ENDIAN

// To know if we want to display a time using 24-hours or 12-hours format, we just need to check if the
// format contains a capital H or not.
export const EU_TIME_FORMAT_REGEX: RegExp = /H+/;
export const US_TIME_FORMAT_REGEX: RegExp = /h+/;

export const DELIMITER_REGEX: RegExp = /d+|m+|y+/i;

export const USER_INPUT_REGEX: RegExp = /\d+/g;
export const USER_INPUT_TIME_REGEX: RegExp = /(\d+)\s?(\w+)?/gi;
export const USER_INPUT_DATETIME_REGEX: RegExp = /(\d{1,2}.*\d{2}.*\d{2,4})\s+(\d{1,2}.*\d{0,2}.*\d{0,2}(?:\s+(?:[pP]|[aA])[mM])?)/g;

export const MOBILE_USERAGENT_REGEX: RegExp = /Mobi/i;

export const RTL_REGEX: RegExp = /\u200f/g;

export const YEAR: string = 'YYYY';
export const MONTH: string = 'MM';
export const DATE: string = 'DD';
export const HOUR: string = 'HH';
export const US_HOUR: string = 'hh';
export const MINUTE: string = 'mm';
export const SECOND: string = 'ss';

export type FormatType = 'LITTLE_ENDIAN' | 'MIDDLE_ENDIAN' | 'BIG_ENDIAN' | 'EU_TIME_FORMAT' | 'US_TIME_FORMAT';

export type InputDateDisplayFormat = {
  readonly name: FormatType;
  readonly format: [string, string, string];
};

export const LITTLE_ENDIAN: InputDateDisplayFormat = {
  name: 'LITTLE_ENDIAN',
  format: [DATE, MONTH, YEAR],
};

export const MIDDLE_ENDIAN: InputDateDisplayFormat = {
  name: 'MIDDLE_ENDIAN',
  format: [MONTH, DATE, YEAR],
};

export const BIG_ENDIAN: InputDateDisplayFormat = {
  name: 'BIG_ENDIAN',
  format: [YEAR, MONTH, DATE],
};

export const EU_TIME_FORMAT: InputDateDisplayFormat = {
  name: 'EU_TIME_FORMAT',
  format: [HOUR, MINUTE, SECOND],
};

export const US_TIME_FORMAT: InputDateDisplayFormat = {
  name: 'US_TIME_FORMAT',
  format: [US_HOUR, MINUTE, SECOND],
};

export const NO_OF_DAYS_IN_A_WEEK: number = 7;
export const NO_OF_ROWS_IN_CALENDAR_VIEW: number = 6;
export const TOTAL_DAYS_IN_DAYS_VIEW: number = NO_OF_DAYS_IN_A_WEEK * NO_OF_ROWS_IN_CALENDAR_VIEW;
