import * as signalR from '@aspnet/signalr';
export declare type IConduitCallback<T> = (message: T) => void;
export declare class Conduit {
    private connectionPromise;
    private connection;
    private eventHandlers;
    private id;
    private logLevel;
    private host;
    private closedByUser;
    private filters;
    private subscriptions;
    constructor(host?: string | null, logLevel?: signalR.LogLevel);
    subscribe<T>(eventKey: string, callback: IConduitCallback<T>): Promise<number>;
    applyFilter(filterName: string, filter: object): Promise<void>;
    unsubscribe(id: number): boolean;
    close(): Promise<void>;
    isConnected(): boolean;
    private start;
    private processQueue;
    private pushHandler;
}
