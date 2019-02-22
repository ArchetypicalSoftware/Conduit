# Conduit Server

The Conduit server implementation enables you define a set of filterable POCOs to on the fly determine which users want to receive messages. Conduit is built for [ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/?view=aspnetcore-2.2).

## Installation

Via your package management tool of choice, install the `Archetypical.Software.Conduit` NuGet package.

## Setup

To setup Conduit, you need to call the `UseConduit` method in the `Configure` method of your `Startup` class. It is here you will define the filters you want to use.

Here is a POCO we want to later use for filtering outgoing messages.

```cs
public class UserAssetsToMonitor
{
    public List<string> StockSymbols { get; set; }
}
```

Now we can add a reference our filter POCO in the `Configure` method.

```cs
app.UseConduit(options => options.Conduit.AddFilter<UserAssetsToMonitor>());
```

This is the simplest filter setup available to you. In this situation, a new filterable POCO instance will be created each time a user connects to Conduit but will not have any user specific information until you receive a filter update from the front end.

In the situation you want to pre-populate your filter object with user specific data, you 'll need to provide a `IConduitFilterFactory<T>` instance.

For example,

```cs
public class UserAssetsToMonitoryFactory : IConduitFilterFactory<UserAssetsToMonitor>
{
     public UserAssetsToMonitor Build(HubCallerContext context)
     {
         // Logic to build a user specific UserAssetsToMonitor
     }
}
```

This can then be referenced when defining your filter during startup.

```cs
app.UseConduit(options => options.Conduit.AddFilter(new UserAssetsToMonitorFactory()));
```

Now whenever a user connects to conduit, the factory instance will be used to create your filterable POCO pre-populated with user specific information.

### Lifetime Options

In addition to defining the filters to be used, the `UseConduit` method can also be used to define a handful of other options regarding cleanup of orphaned SignalrR connections that can occur whenever the `OnDisconnectedAsync` method of the `Hub` for some reason is not called.

`CleanupTaskEnabled`: Defines if the cleanup task is enabled. Default value is `true`.

`MaxConnectionLifetime`: Defines how long a connection can live for. Default value is one day.

`CleanupTaskInterval`: Defines how often the clean up thread run executes. Default value is one hour.

## Usage

After the initial setup, usage of Conduit couldn't be easier. To send a message to a user via conduit simply call `SendAsync` with a predicate to determine which users you want to send your payload to.

```cs
// Get an update on something users might want
Stock updatedStock = GetUpdatedStock();

// Send the data to the users where predicate result is true
await Conduit<UserAssetsToMonitor>.SendAsync(x => x.StockSymbols.Contains(updatedStock.Name), updatedStock);
```

Under the hood, Conduit grabs all instances of `UserAssetsToMonitor` for each connected user and via the supplied predicate determines which users desire the message.