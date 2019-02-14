import { AutoHubConnection, IConnectionConfig } from '@archetypical/auto-hub-connection';
import { HubConnectionState } from '@aspnet/signalr';

/**
 * Conduit callback. Used to provide a strongly typed 
 * callback when utilizing typescript
 * 
 * @export
 * @interface IConduitCallback
 */
export type IConduitCallback<T> = (message: T) => void;

interface IFilter {
  isSent: boolean;
  filterName: string;
  filter: object;
}

/**
 * Conduit client
 *
 * @export
 * @class Conduit
 */
export class Conduit {
  private connection: AutoHubConnection;
  private filters: IFilter[];
  private hasSubscription: boolean;

  /**
   * Creates an instance of Conduit
   * @param {(IConnectionConfig | null)} [config]
   * @memberof Conduit
   */
  constructor(config?: IConnectionConfig | null) {
    this.connection = new AutoHubConnection('/conduit', config);

    this.filters = [];
    this.hasSubscription = false;

    this.connection.onclose(() => this.filters.forEach(x => x.isSent = false));
  }

  /**
   * Defines a callback for when a payload type is sent from the server
   *
   * @template T Payload type
   * @param {string} payloadTypeName Name of the payload type
   * @param {(data: T) => void} callback Callback that handles the payload type
   * @returns {Promise<void>}
   * @memberof Conduit
   */
  public async on<T>(payloadTypeName: string, callback: (data: T) => void): Promise<void> {
    this.connection.on(payloadTypeName, callback);

    this.hasSubscription = true;

    await this.processQueue();
  }

  /**
   * Removes one or all handlers of a payload type
   *
   * @template T Payload type
   * @param {string} payloadName Name of the payload type
   * @param {(data: T) => void} [callback] Optional: Callback handler to be removed. All callback handlers are removed if no callback is provided
   * @memberof Conduit
   */
  public off<T>(payloadName: string, callback?: (data: T) => void): void {
    this.connection.off(payloadName, callback);
  }

  /**
   * Initiates the connection to the server Conduit. 
   *
   * @returns {Promise<void>}
   * @memberof Conduit
   */
  public async start(): Promise<void> {
    await this.connection.start();
    await this.processQueue();
  }

  /**
   * Disconnects from the server Conduit
   *
   * @memberof Conduit
   */
  public async stop() {
    await this.connection.stop();
  }

  /**
   * Sends a filter to the server Conduit to enable server-side filtering of users to payloads to
   *
   * @param {string} filterName Name of the server-side filter type
   * @param {object} filter Filter contents
   * @returns {Promise<void>}
   * @memberof Conduit
   */
  public async applyFilter(filterName: string, filter: object): Promise<void> {
    if (!filterName || typeof filterName !== 'string') {
      throw new Error('filterName must be a valid string');
    }

    if (!filter || typeof filter !== 'object') {
      throw new Error('filter must be a valid object');
    }

    let entry = this.filters.find(x => x.filterName === filterName);

    if (!entry) {
      entry = {
        filter,
        filterName,
        isSent: false
      } as IFilter;

      this.filters.push(entry);
    } else {
      entry.isSent = false;
      entry.filter = filter;
    }

    await this.processQueue();
  }

  private async processQueue() {
    if (this.connection.state === HubConnectionState.Connected && this.hasSubscription) {
      // Filters
      const filtersToSend = this.filters.filter(x => !x.isSent);
      filtersToSend.forEach(async x => {
        try {
          x.isSent = true;
          await this.connection.invoke('ApplyFilter', x.filterName, x.filter);
        } catch {
          x.isSent = false;
        }
      });
    }
  }
}
