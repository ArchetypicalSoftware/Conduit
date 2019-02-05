jest.mock('@aspnet/signalr');

import * as signalr from '@aspnet/signalr';
import { Conduit } from '../index';
import { MockHubConnection, MockHubConnectionBuilder } from './signalr.hubConnection.mock';

interface IMockPayload {
    data: string;
}

// tslint:disable-next-line:no-empty
function noop(data: IMockPayload) { }

describe('Subscription Tests', () => {
    const mockHubConnectionBuilder = signalr.HubConnectionBuilder as jest.Mock<signalR.HubConnectionBuilder>;
    let builder: MockHubConnectionBuilder;
    let connection: MockHubConnection;

    beforeEach(() => {
        connection = new MockHubConnection();
        builder = new MockHubConnectionBuilder(connection);

        mockHubConnectionBuilder.mockImplementation(() => builder);
    });

    test('Connection is correctly set up', () => {
        const conduit = new Conduit();
        conduit.subscribe<IMockPayload>('eventKey', noop);

        expect(builder.build).toHaveBeenCalledTimes(1);
        expect(builder.configureLogging).toHaveBeenCalledTimes(1);
        expect(builder.withUrl).toHaveBeenCalledTimes(1);
        expect(connection.on).toHaveBeenCalledTimes(1);
        expect(connection.onclose).toHaveBeenCalledTimes(1);
        expect(connection.start).toHaveBeenCalledTimes(1);
    });

    test('Reattempt connection when start fails', async done => {
        const conduit = new Conduit({ retryInterval: 10 });
        connection.start.mockImplementationOnce(() => Promise.reject());

        await conduit.subscribe<IMockPayload>('eventKey', noop);

        expect(connection.start).toHaveBeenCalledTimes(2);
        done();
    });

    test('Invoke is not called when there is no connection', async done => {
        const conduit = new Conduit({ retryInterval: 10 });

        connection.start.mockImplementation(() => Promise.reject());

        try {
            await conduit.subscribe<IMockPayload>('eventKey', noop);
        } catch {
            expect(connection.invoke).toHaveBeenCalledTimes(0);
            done();
        }
    });

    test('Invoke:SubscribeToEventAsync called', async done => {
        const conduit = new Conduit({ retryInterval: 10 });
        await conduit.subscribe<IMockPayload>('eventKey', noop);
        
        expect(connection.invoke).toBeCalledTimes(1);
        expect(connection.invoke).toBeCalledWith('SubscribeToEventAsync', 'eventKey');
        done();
    });

    test('Invoke:ApplyFilter not called with no subscription', async done => {
        const conduit = new Conduit({ retryInterval: 10 });
        await conduit.applyFilter('filterType', {});
        expect(connection.invoke).toBeCalledTimes(0);
        done();
    });

    test('Invoke:ApplyFilter is called with subscription', async done => {
        const filterObject = {};

        const conduit = new Conduit({ retryInterval: 10 });
        await conduit.subscribe<IMockPayload>('eventKey', noop);
        await conduit.applyFilter('filterType', filterObject);
        expect(connection.invoke).toBeCalledTimes(2);
        expect(connection.invoke).toBeCalledWith('SubscribeToEventAsync', 'eventKey');
        expect(connection.invoke).toBeCalledWith('ApplyFilter', 'filterType', filterObject);
        done();
    });

    test('Invoke called once with multiple handlers to same subscription', async done => {
        const conduit = new Conduit({ retryInterval: 10 });
        await conduit.subscribe<IMockPayload>('eventKey', noop);
        await conduit.subscribe('eventKey', noop);
        expect(connection.invoke).toBeCalledTimes(1);
        done();
    });

    test('Callback called when event recieved from server', async done => {
        let handler: (
            payload: {
                eventKey: string;
                message: any;
            },
        // tslint:disable-next-line:no-empty
        ) => void = () => {};

        connection.on.mockImplementation((eventKey: string, callback: () => void) => (handler = callback));

        let isCalled = false;
        const cb = (x: IMockPayload) => (isCalled = true);

        const conduit = new Conduit();
        await conduit.subscribe<IMockPayload>('eventKey', cb);
        handler({
            eventKey: 'eventKey',
            message: 'hello',
        });

        expect(isCalled).toBeTruthy();
        done();
    });

    test('Start called again on disconnect', async done => {
        // tslint:disable-next-line:no-empty
        let onCloseHandler: () => void = () => {};

        connection.onclose.mockImplementation((callback: () => void) => (onCloseHandler = callback));

        const conduit = new Conduit();
        await conduit.subscribe<IMockPayload>('eventKey', noop);
        onCloseHandler();
        await conduit.subscribe<IMockPayload>('eventKey', noop);
        expect(connection.start).toBeCalledTimes(2);
        done();
    });

    test('Start not called on explicit close', async done => {
        const conduit = new Conduit();
        await conduit.subscribe<IMockPayload>('eventKey', noop);
        await conduit.close();
        expect(connection.start).toBeCalledTimes(1);
        expect(connection.stop).toBeCalledTimes(1);
        done();
    });
});
