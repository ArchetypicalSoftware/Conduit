import { IConnectionConfig } from '@archetypical/auto-hub-connection';
/**
 * Conduit callback. Used to provide a strongly typed
 * callback when utilizing typescript
 *
 * @export
 * @interface IConduitCallback
 */
export declare type IConduitCallback<T> = (message: T) => void;
/**
 * Conduit client
 *
 * @export
 * @class Conduit
 */
export declare class Conduit {
    private connection;
    private filters;
    private hasSubscription;
    /**
     * Creates an instance of Conduit
     * @param {(IConnectionConfig | null)} [config]
     * @param {(string | null)} [baseUrl]
     * @memberof Conduit
     */
    constructor(config?: IConnectionConfig | null, baseUrl?: string | null);
    /**
     * Defines a callback for when a payload type is sent from the server
     *
     * @template T Payload type
     * @param {string} payloadTypeName Name of the payload type
     * @param {(data: T) => void} callback Callback that handles the payload type
     * @returns {Promise<void>}
     * @memberof Conduit
     */
    on<T>(payloadTypeName: string, callback: (data: T) => void): Promise<void>;
    /**
     * Removes one or all handlers of a payload type
     *
     * @template T Payload type
     * @param {string} payloadName Name of the payload type
     * @param {(data: T) => void} [callback] Optional: Callback handler to be removed. All callback handlers are removed if no callback is provided
     * @memberof Conduit
     */
    off<T>(payloadName: string, callback?: (data: T) => void): void;
    /**
     * Initiates the connection to the server Conduit.
     *
     * @returns {Promise<void>}
     * @memberof Conduit
     */
    start(): Promise<void>;
    /**
     * Disconnects from the server Conduit
     *
     * @memberof Conduit
     */
    stop(): Promise<void>;
    /**
     * Sends a filter to the server Conduit to enable server-side filtering of users to payloads to
     *
     * @param {string} filterName Name of the server-side filter type
     * @param {object} filter Filter contents
     * @returns {Promise<void>}
     * @memberof Conduit
     */
    applyFilter(filterName: string, filter: object): Promise<void>;
    private processQueue;
}
