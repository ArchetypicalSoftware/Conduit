![logo](docs/Images/conduit.png)

Conduit connects browsers and .NET Core applications utilizing strongly typed payloads and enables server-side message filtering based upon client data.

# Overview

Conduit is a wrapper to Microsoft's .NET Core websocket implementation, SignalR. In addition to providing a lot of the same functionality of SignalR, Conduit enables you to filter which users receive your messages based upon their state and not by the specific group they have registered for. This is done by storing a POCO defined by you server side for each user connected to Conduit. Once you are ready to send a message, you provide a predicate to select the specific users you want to send the message to based upon their data. Furthermore, your filter object can be updated from browser side to allow for real-time updates to your filtering.
 
```cs
public class UserAssetsToMonitor
{
    public List<string> StockSymbols { get; set; }
}
```

For example, imagine this POCO represents the assets the users is interested in monitoring and you want to send the information you receive as fast as you can to your users. To eliminate processing and storage client-side you can determine which users you want to send your data with a predicate.

# Conduit Server

[Full Documentation](docs/Server/README.md)

To send a filtered request to the client, the call from server side is quite simple:

```cs
// Get an update on something users might want
Stock updatedStock = GetUpdatedStock();

// Send the data to the users where predicate result is true
await Conduit<UserAssetsToMonitor>.SendAsync(x => x.StockSymbols.Contains(updatedStock.Name), updatedStock);
```

Whenever you get an update you want to send to the user, you can call into the SendAsync method providing a predicate and the payload to be sent to the user whenever the predicate returns `true`.

# Conduit Client

[Full Documenation](docs/Client/README.md)

To handle an incoming message on client side is just as easy:

```js
import { Conduit } from '@archetypical/conduit'

// Create a new client
const conduit = new Conduit();

// Initiate the connection
await conduit.start();

// Define a callback handler for Stock
await conduit.on('Stock', updateStockData);
```

Now let's say your user dives into a view that is focused on a more narrow set of data. You can inform the server that you wish to only receive updates that contain that narrowed set by updating its filter.

```js
// Tell the server you only want updates for specific pages
await conduit.applyFilter('UserAssetsToMonitor', {
    StockSymbols: ['MSFT']
});
```

Now your user will only get updates for the data they said they cared about! 
