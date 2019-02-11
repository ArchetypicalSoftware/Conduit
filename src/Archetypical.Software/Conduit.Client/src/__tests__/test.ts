import { Conduit } from '../index';
import { MockHubConnection } from './signalr.hubConnection.mock';

interface IMockPayload {
  data: string;
}

// tslint:disable-next-line:no-empty
function noop(data: IMockPayload) {}

describe('Subscription Tests', () => {
  let conduit: Conduit;
  let mockConnection: MockHubConnection;

  beforeEach(() => {
    conduit = new Conduit({ retryInterval: 10 });
    mockConnection = (conduit as any).connection = new MockHubConnection();
  });

  test('Invoke:ApplyFilter not called without a subscription', async done => {
    await conduit.start();
    await conduit.applyFilter('filterType', {});
    expect(mockConnection.invoke).toBeCalledTimes(0);
    done();
  });

  test('Invoke:ApplyFilter is called with subscription', async done => {
    const filterObject = {};

    await conduit.start();

    await conduit.applyFilter('filterType', filterObject);
    expect(mockConnection.invoke).toBeCalledTimes(0);

    await conduit.on<IMockPayload>('eventKey', noop);
    
    expect(mockConnection.invoke).toBeCalledTimes(1);
    expect(mockConnection.invoke).toBeCalledWith('ApplyFilter', 'filterType', filterObject);
    done();
  });
});
