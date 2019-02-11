import { IConnectionConfig } from '@archetypical/auto-hub-connection';
export declare type IConduitCallback<T> = (message: T) => void;
export declare class Conduit {
    private connection;
    private filters;
    private hasSubscription;
    constructor(config?: IConnectionConfig | null);
    on<T>(payloadName: string, callback: (data: T) => void): Promise<void>;
    off<T>(payloadName: string, callback?: (data: T) => void): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    applyFilter(filterName: string, filter: object): Promise<void>;
    private processQueue;
}
