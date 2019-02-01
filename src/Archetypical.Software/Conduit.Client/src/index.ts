import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@aspnet/signalr';

export type IConduitCallback<T> = (message: T) => void;

export interface IConduitConfig {
  host?: string;
  logLevel?: LogLevel;
  retryInterval?: number;
  maxConnectionAttempts?: number;
}

interface IConduitPayload {
  eventKey: string;
  message: any;
}

interface IConduitEventHandler {
  id: number;
  callback: IConduitCallback<any>;
  eventKey: string;
}

interface IFilter {
  isSent: boolean;
  filterName: string;
  filter: object;
}

interface ISubscription {
  isSent: boolean;
  eventKey: string;
}

export class Conduit {
  private config: IConduitConfig;
  private connectionPromise: Promise<void> | null;
  private connection: HubConnection | null;
  private eventHandlers: IConduitEventHandler[];
  private id: number;
  private closedByUser: boolean;
  private filters: IFilter[];
  private subscriptions: ISubscription[];

  constructor(config: IConduitConfig | null = null) {
    this.config = Object.assign(
      {},
      {
        host: '',
        logLevel: LogLevel.Error,
        maxConnectionAttempts: 5,
        retryInterval: 5000,
      },
      config,
    );

    this.connectionPromise = null;
    this.connection = null;
    this.eventHandlers = [];
    this.id = 1;
    this.closedByUser = false;
    this.filters = [];
    this.subscriptions = [];
  }

  public async subscribe<T>(eventKey: string, callback: IConduitCallback<T>): Promise<number> {
    if (!eventKey || typeof eventKey !== 'string') {
      throw new Error('eventKey must be a valid string');
    }

    if (!callback || typeof callback !== 'function') {
      throw new Error('handler must be a valid function');
    }

    this.closedByUser = false;

    this.subscriptions.push({
      eventKey,
      isSent: false,
    });

    await this.start();
    await this.processQueue();

    const handler = {
      callback,
      eventKey,
      id: this.id++,
    } as IConduitEventHandler;

    this.eventHandlers.push(handler);

    return handler.id;
  }

  public async applyFilter(filterName: string, filter: object) {
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
        isSent: false,
      } as IFilter;

      this.filters.push(entry);
    } else {
      entry.isSent = false;
      entry.filter = filter;
    }

    await this.processQueue();
  }

  public unsubscribe(id: number): boolean {
    if (!id || typeof id !== 'number') {
      throw new Error('id must be a valid number');
    }

    const originalLength = this.eventHandlers.length;

    this.eventHandlers = this.eventHandlers.filter(x => x.id !== id);

    return this.eventHandlers.length !== originalLength;
  }

  public async close() {
    if (this.connection) {
      this.closedByUser = true;
      this.id = 1;
      await this.connection!.stop();
      this.connection = null;
      this.connectionPromise = null;
      this.filters = [];
      this.subscriptions = [];
    }
  }

  public isConnected(): boolean {
    if (this.connection) {
      return this.connection.state === HubConnectionState.Connected;
    }

    return false;
  }

  private async start() {
    if (this.connectionPromise === null) {
      this.connection = new HubConnectionBuilder()
        .withUrl(`${this.config.host}/conduit`)
        .configureLogging(this.config.logLevel!)
        .build();

      this.connection.on('conduit', this.pushHandler);

      this.connection.onclose(() => {
        this.connectionPromise = null;
        this.connection = null;
        if (!this.closedByUser) {
          this.start();
        }
      });

      try {
        this.connectionPromise = new Promise(async (resolve, reject) => {
          await this.connect(
            resolve,
            reject,
            0,
          );
        });
      } catch {
        if (this.connection) {
          this.connection = null;
        }
        this.connectionPromise = null;
      }
    }

    return this.connectionPromise;
  }

  private async connect(resolve: () => void, reject: () => void, attemptCount: number) {
    try {
      await this.connection!.start();
      resolve();
    } catch (err) {
      if (attemptCount === this.config.maxConnectionAttempts) {
        reject();
      }

      setTimeout(
        () =>
          this.connect(
            resolve,
            reject,
            attemptCount + 1,
          ),
        this.config.retryInterval,
      );
    }
  }

  private async processQueue() {
    if (this.isConnected()) {
      // Filters
      const filtersToSend = this.filters.filter(x => !x.isSent);
      filtersToSend.forEach(async x => {
        try {
          x.isSent = true;
          await this.connection!.invoke('ApplyFilter', x.filterName, x.filter);
        } catch {
          x.isSent = false;
        }
      });

      // Subscriptions
      const subscriptionsToSend = this.subscriptions.filter(x => !x.isSent);
      subscriptionsToSend.forEach(async x => {
        if (this.subscriptions.filter(y => y.eventKey === x.eventKey && y.isSent).length) {
          x.isSent = true;
        } else {
          try {
            x.isSent = true;
            await this.connection!.invoke('SubscribeToEventAsync', x.eventKey);
          } catch {
            x.isSent = false;
            // tslint:disable-next-line:no-empty
          }
        }
      });
    }
  }

  private pushHandler = (payload: IConduitPayload) => {
    const eventKey = payload.eventKey;
    const message = payload.message;

    const handlers = this.eventHandlers.filter(x => x.eventKey === eventKey);

    if (handlers) {
      handlers.forEach(x => x.callback(message));
    }
  };
}
