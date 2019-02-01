import * as signalR from '@aspnet/signalr';
export declare type IConduitCallback<T> = (message: T) => void;
export declare class Conduit {
    private _connectionPromise;
    private _connection;
    private _eventHandlers;
    private _id;
    private _logLevel;
    private _host;
    private _closedByUser;
    private _filters;
    private _subscriptions;
    constructor(host?: string | null, logLevel?: signalR.LogLevel);
    subscribe<T>(eventKey: string, callback: IConduitCallback<T>): Promise<number>;
    applyFilter(filterName: string, filter: object): Promise<void>;
    unsubscribe(id: number): boolean;
    close(): Promise<void>;
    isConnected(): boolean;
    private _start;
    private _processQueue;
    private _pushHandler;
}
