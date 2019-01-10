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

export class Conduit {
  private connectionPromise: Promise<void> | null = null;
  private connection: signalR.HubConnection | null = null;
  private eventHandlers: IConduitEventHandler[];
  private id: number = 1;
  private logLevel: signalR.LogLevel;
  private host: string;
  private closedByUser: boolean;

  constructor(host: string | null = null, logLevel: signalR.LogLevel = signalR.LogLevel.Error) {
    this.host = host || '';
    this.logLevel = logLevel;
    this.eventHandlers = [];
    this.closedByUser = false;
  }

  public async subscribe<T>(eventKey: string, callback: IConduitCallback<T>): Promise<number> {
    if (!eventKey || typeof eventKey !== 'string') {
      throw new Error('eventKey must be a valid string');
    }

    if (!callback || typeof callback !== 'function') {
      throw new Error('handler must be a valid function');
    }

    this.closedByUser = false;
    await this.start();

    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection!.invoke('SubscribeToEventAsync', eventKey);
    }

    const handler = {
      callback,
      eventKey,
      id: this.id++,
    } as IConduitEventHandler;

    this.eventHandlers.push(handler);

    return handler.id;
  }

  public async applyFilter(filterName: string, filter: object) {
    this.closedByUser = false;
    await this.start();

    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection!.invoke('ApplyFilter', filterName, filter);
    }
  }

  public unsubscribe(id: number): boolean {
    if (!id || typeof id !== 'number') {
      throw new Error('id must be a valid number');
    }

    for (let i = 0; i < this.eventHandlers.length; i++) {
      const handler = this.eventHandlers[i];

      if (handler.id === id) {
        this.eventHandlers.splice(i, 1);
        return true;
      }
    }

    return false;
  }

  public async close() {
    if (this.connection) {
      this.closedByUser = true;
      this.id = 1;
      await this.connection!.stop();
      this.connection = null;
      this.connectionPromise = null;
    }
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
        if (!this.closedByUser) {
          this.start();
        }
      });

      try {
        this.connectionPromise = this.connection.start();
        await this.connectionPromise;
      } catch (err) {
        this.connectionPromise = null;
        // tslint:disable-next-line:no-console
        console.log('conduit: ' + err);

        setTimeout(() => this.start(), 5000);
      }
    }

    return this.connectionPromise;
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
