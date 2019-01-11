import * as signalR from '@aspnet/signalr';

export type IConduitCallback<T> = (message: T) => void;

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

function find<T>(array: T[], predicate: (element: T) => boolean): T | null {
  let first: T | null = null;
  array.every((x: T) => {
    if (predicate(x)) {
      first = x;
      return false;
    }

    return true;
  });

  return first;
}

export class Conduit {
  private connectionPromise: Promise<void> | null;
  private connection: signalR.HubConnection | null;
  private eventHandlers: IConduitEventHandler[];
  private id: number;
  private logLevel: signalR.LogLevel;
  private host: string;
  private closedByUser: boolean;
  private filters: IFilter[];
  private subscriptions: ISubscription[];

  constructor(host: string | null = null, logLevel: signalR.LogLevel = signalR.LogLevel.Error) {
    this.connectionPromise = null;
    this.connection = null;
    this.eventHandlers = [];
    this.id = 1;
    this.logLevel = logLevel;
    this.host = host || '';
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

    let entry = find(this.filters, x => x.filterName === filterName);

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
      return this.connection.state === signalR.HubConnectionState.Connected;
    }

    return false;
  }

  private async start() {
    if (this.connectionPromise === null) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${this.host}/conduit`)
        .configureLogging(this.logLevel)
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
        this.connectionPromise = this.connection.start();
        await this.connectionPromise;
        await this.processQueue();
      } catch (err) {
        this.connectionPromise = null;
        // tslint:disable-next-line:no-console
        console.log('conduit: ' + err);

        setTimeout(() => this.start(), 5000);
      }
    }

    return this.connectionPromise;
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
          // tslint:disable-next-line:no-empty
        }
      });

      // Subscriptions
      const subscriptionsToSend = this.subscriptions.filter(x => !x.isSent);
      subscriptionsToSend.forEach(async x => {
        if (find(this.subscriptions, y => y.eventKey === x.eventKey && y.isSent)) {
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
      handlers.forEach(x => {
        try {
          x.callback(message);
        } catch (err) {
          // tslint:disable-next-line:no-console
          console.log('conduit: ' + err);
        }
      });
    }
  };
}
