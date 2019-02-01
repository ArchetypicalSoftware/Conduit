import { LogLevel } from '@aspnet/signalr';
export declare type IConduitCallback<T> = (message: T) => void;
export interface IConduitConfig {
    host?: string;
    logLevel?: LogLevel;
    retryInterval?: number;
    maxConnectionAttempts?: number;
}
export declare class Conduit {
    private config;
    private connectionPromise;
    private connection;
    private eventHandlers;
    private id;
    private closedByUser;
    private filters;
    private subscriptions;
    constructor(config?: IConduitConfig | null);
    subscribe<T>(eventKey: string, callback: IConduitCallback<T>): Promise<number>;
    applyFilter(filterName: string, filter: object): Promise<void>;
    unsubscribe(id: number): boolean;
    close(): Promise<void>;
    isConnected(): boolean;
    private start;
    private connect;
    private processQueue;
    private pushHandler;
}
