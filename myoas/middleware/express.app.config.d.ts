import * as express from 'express';
import { Oas3AppOptions } from './oas3.options';
export declare class ExpressAppConfig {
    private app;
    private routingOptions;
    private definitionPath;
    private openApiValidatorOptions;
    constructor(theapp: any, definitionPath: string, appOptions: Oas3AppOptions);
    private setOpenApiValidatorOptions;
    configureLogger(loggerOptions: any): any;
    private errorHandler;
    getApp(): express.Application;
}
