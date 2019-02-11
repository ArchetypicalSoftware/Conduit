import { AutoHubConnection, IConnectionConfig } from '@archetypical/auto-hub-connection';
import { HubConnectionState } from '@aspnet/signalr';

export type IConduitCallback<T> = (message: T) => void;

interface IFilter {
  isSent: boolean;
  filterName: string;
  filter: object;
}

export class Conduit {
  private connection: AutoHubConnection;
  private filters: IFilter[];
  private hasSubscription: boolean;

  constructor(config?: IConnectionConfig | null) {
    this.connection = new AutoHubConnection('/conduit', config);

    this.filters = [];
    this.hasSubscription = false;

    this.connection.onclose(() => this.filters.forEach(x => x.isSent = false));
  }

  public async on<T>(payloadName: string, callback: (data: T) => void): Promise<void> {
    this.connection.on(payloadName, callback);

    this.hasSubscription = true;

    await this.processQueue();
  }

  public off<T>(payloadName: string, callback?: (data: T) => void): void {
    this.connection.off(payloadName, callback);
  }

  public async start(): Promise<void> {
    await this.connection.start();
    await this.processQueue();
  }

  public async stop() {
    await this.connection.stop();
  }

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
