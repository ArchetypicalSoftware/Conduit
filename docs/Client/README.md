# Conduit Client

Conduit client is a javascript client designed to easily integrate with a Conduit server implementation. The Conduit client is intended to be used with a server Conduit implemented in .net core. Please see the full documentation [here](https://github.com/ArchetypicalSoftware/Conduit).

## Installation

Install globally via npm:

```sh
npm install -g @archetypical/conduit
```

Or globally via yarn:

```sh
yarn global add @archetypical/conduit
```

## Methods

Once you have established your [server side Conduit](https://github.com/ArchetypicalSoftware/Conduit) you can connect to it with a new Conduit client. If you have used the [signalr client](https://docs.microsoft.com/en-us/javascript/api/@aspnet/signalr/hubconnection?view=signalr-js-latest) before, you will recognize a lot of the same methods.

### Instantiation

You are able to instantiate a conduit client with the default options:

```js
const conduit = new Conduit();
```

Or you can provide configuration settings used to change the underlying reconnect behavior.

```js
const conduit = new Conduit({
    logLevel: LogLevel.Error,
    retryInterval: 3000,
    maxConnectionAttempts: 5
});
```

For more information on these options, please refer to [AutoHubConnection](https://www.npmjs.com/package/@archetypical/auto-hub-connection).

### ApplyFilter

`applyFilter(filterName: string, filter: object): Promise<void>`

Call `applyFilter` to provide the server conduit additional data points to more accurately send data to the client.

**filterName** is expected to be the name of the class used in the server conduit to define filterable data for your users.

**filter** is the actual filter data to be used by the server conduit to filter calls.

### Start

`start(): Promise<void>`

`start` initiates a connection with the server Conduit.

### On

`on<T>(payloadName: string, callback: (data: T) => void): Promise<void>`

`on` adds a callback handler for when a specific payload type is provided.

**payloadName** is type name of the object pushed by the server Conduit.

**callback** is the method called whenever a payload of that type is pushed.

### Off

`off<T>(payloadName: string, callback?: (data: T) => void): void`

`off` removes a handler or all handlers for a specific payload type.

**payloadName** is the type name of the object pushed by the server Conduit.

**callback** is the method you want removed whenever a payload of that type is pushed.

## Example

```js
import { Conduit } from '@archetypical/conduit'

// Create a new client
const conduit = new Conduit();

// Initiate the connection
await conduit.start();

// Define a callback handler for PageStats
await conduit.on('PageStats', updatePageStats);

// Tell the server you only want updates for specific pages
await conduit.applyFilter('UserFilterData', {
    RecentPages: ['Home', 'About', 'Kittens']
});
```