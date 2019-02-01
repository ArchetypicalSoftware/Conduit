/// <reference types="jest" />
import { HubConnectionState } from '@aspnet/signalr';
export declare class MockHubConnectionBuilder {
    build: jest.Mock<MockHubConnection>;
    configureLogging: jest.Mock<this>;
    withUrl: jest.Mock<this>;
    private _connection;
    constructor(connection: MockHubConnection);
}
export declare class MockHubConnection {
    on: jest.Mock<{}>;
    onclose: jest.Mock<{}>;
    start: jest.Mock<Promise<void>>;
    invoke: jest.Mock<{}>;
    state: HubConnectionState;
}
