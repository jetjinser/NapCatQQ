import log4js, { Configuration } from 'log4js';
import { truncateString } from '@/common/utils/helper';
import { SelfInfo } from '@/core';
import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

const logConfig: Configuration = {
  appenders: {
    FileAppender: { // 输出到文件的appender
      type: 'file',
      filename: '/dev/null', // 指定日志文件的位置和文件名
      maxLogSize: 10485760, // 日志文件的最大大小（单位：字节），这里设置为10MB
      layout: {
        type: 'pattern',
        pattern: '%d{yyyy-MM-dd hh:mm:ss} [%p] %X{userInfo} | %m'
      }
    },
    ConsoleAppender: { // 输出到控制台的appender
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: `%d{yyyy-MM-dd hh:mm:ss} [%[%p%]] ${chalk.magenta('%X{userInfo}')} | %m`
      }
    }
  },
  categories: {
    default: { appenders: ['FileAppender', 'ConsoleAppender'], level: 'debug' }, // 默认情况下同时输出到文件和控制台
    file: { appenders: ['FileAppender'], level: 'debug' },
    console: { appenders: ['ConsoleAppender'], level: 'debug' }
  }
};

log4js.configure(logConfig);
const loggerConsole = log4js.getLogger('console');
const loggerFile = log4js.getLogger('file');
const loggerDefault = log4js.getLogger('default');

export function setLogLevel(fileLogLevel: LogLevel, consoleLogLevel: LogLevel) {
  logConfig.categories.file.level = fileLogLevel;
  logConfig.categories.console.level = consoleLogLevel;
  log4js.configure(logConfig);
}

export function setLogSelfInfo(selfInfo: SelfInfo) {
  const userInfo = `${selfInfo.nick}(${selfInfo.uin})`;
  loggerConsole.addContext('userInfo', userInfo);
  loggerFile.addContext('userInfo', userInfo);
  loggerDefault.addContext('userInfo', userInfo);
}
setLogSelfInfo({ nick: '', uin: '', uid: '' });

let fileLogEnabled = false;
let consoleLogEnabled = false;
export function enableFileLog(enable: boolean) {
  fileLogEnabled = enable;
}
export function enableConsoleLog(enable: boolean) {
  consoleLogEnabled = enable;
}

function formatMsg(msg: any[]) {
  let logMsg = '';
  for (const msgItem of msg) {
    // 判断是否是对象
    if (typeof msgItem === 'object') {
      const obj = JSON.parse(JSON.stringify(msgItem, null, 2));
      logMsg += JSON.stringify(truncateString(obj)) + ' ';
      continue;
    }
    logMsg += msgItem + ' ';
  }
  return logMsg;
}

// eslint-disable-next-line no-control-regex
const colorEscape = /\x1B[@-_][0-?]*[ -/]*[@-~]/g;

function _log(level: LogLevel, ...args: any[]) {
  if (consoleLogEnabled) {
    loggerConsole[level](formatMsg(args));
  }
  if (fileLogEnabled) {
    loggerFile[level](formatMsg(args).replace(colorEscape, ''));
  }
}

export function log(...args: any[]) {
  // info 等级
  _log(LogLevel.INFO, ...args);
}

export function logDebug(...args: any[]) {
  _log(LogLevel.DEBUG, ...args);
}

export function logError(...args: any[]) {
  _log(LogLevel.ERROR, ...args);
}

export function logWarn(...args: any[]) {
  _log(LogLevel.WARN, ...args);
}

export function logFatal(...args: any[]) {
  _log(LogLevel.FATAL, ...args);
}
