import { LogType, _LOG } from './../log/log';

export type LogItem = {
    message: string;
    type: LogType;
    time: number;
    telemetry?: any;
};

export type ProjectResult = {
    items: any[];
    logger: _LOG;
    // logs: LogItem[];
};

export type ProjectPage = {
    maxAvailableItems: number;
    maxAvailablePages: number;
    nextPage: number;
    projects: any[];
    target: string;
    time: number;
};
