import { Configuration, Layout } from 'log4js';

export const LOG4JS_DEFAULT_LAYOUT: Layout = {
  type: 'pattern',
  // log4js default pattern %d{yyyy-MM-dd HH:mm:ss:SSS} [%thread] %-5level %logger{36} - %msg%n
  // we use process id instead thread id
  pattern: '%[%d{yyyy-MM-dd hh:mm:ss:SSS} %-5.5p --- [%15.15x{name}]%] %20.40f{3} :  %m',
  tokens: {
    name: (logEvent) => {
      return (logEvent.context && logEvent.context['name']) || '-';
    },
  },
};

export const LOG4JS_NO_COLOUR_DEFAULT_LAYOUT: Layout = {
  type: 'pattern',
  // log4js default pattern %d{yyyy-MM-dd HH:mm:ss:SSS} [%thread] %-5level %logger{36} - %msg%n
  // we use process id instead thread id
  pattern: '%d{yyyy-MM-dd hh:mm:ss:SSS} %-5.5p --- [%15.15x{name}] %40.40f{3} :  %m',
  tokens: {
    name: (logEvent) => {
      return (logEvent.context && logEvent.context['name']) || '-';
    },
  },
};

export const LOG4JS_DEFAULT_CONFIG: Configuration = {
  appenders: {
    stdout: {
      type: 'stdout',
      layout: LOG4JS_DEFAULT_LAYOUT,
    },
    dateFile: {
      type: 'dateFile',
      filename: `./logs/application.log`,
      keepFileExt: true,
      layout: LOG4JS_NO_COLOUR_DEFAULT_LAYOUT,
    },
  },
  categories: {
    default: {
      enableCallStack: true,
      appenders: ['stdout', 'dateFile'],
      level: 'debug',
    },
  },
};
