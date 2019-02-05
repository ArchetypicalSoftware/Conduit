import { HubConnectionState } from '@aspnet/signalr';

export class MockHubConnectionBuilder {
  public build = jest.fn(() => this.connection);
  public configureLogging = jest.fn(() => this);
  public withUrl = jest.fn(() => this);

  private connection: MockHubConnection;

  constructor(connection: MockHubConnection) {
    this.connection = connection;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class MockHubConnection {
  public on = jest.fn();
  public onclose = jest.fn();
  public start = jest.fn(() => Promise.resolve());
  public invoke = jest.fn();
  public state = HubConnectionState.Connected;
  public stop = jest.fn(() => Promise.resolve());
}
