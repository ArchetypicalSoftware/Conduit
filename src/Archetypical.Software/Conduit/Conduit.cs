using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Archetypical.Software.Conduit
{
    /// <summary>
    ///
    /// </summary>
    /// <typeparam name="TFilter"></typeparam>
    public class Conduit<TFilter> : IConduit where TFilter : class, new()
    {
        #region ConnectionFilterPair

        /// <summary>
        /// POCO to house the connnection filter data
        /// </summary>
        private class ConnectionFilterPair
        {
            public ConnectionFilterPair(string connectionId, TFilter filter)
            {
                ConnectionId = connectionId;
                Filter = filter;
                CreatedDate = DateTime.Now;
            }

            public string ConnectionId { get; }
            public DateTime CreatedDate { get; }
            public TFilter Filter { get; set; }
        }

        #endregion ConnectionFilterPair

        private readonly ConduitHub _conduit;
        private readonly ILogger<Conduit<TFilter>> _logger;
        private static readonly ConcurrentDictionary<string, ConnectionFilterPair> ConnectionFilterMap = new ConcurrentDictionary<string, ConnectionFilterPair>();

        private IConduitFilterFactory<TFilter> FilterFactory { get; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="filterFactory">Filter factory that creates object to evaluate</param>
        /// <param name="conduit">Conduit instance</param>
        public Conduit(IConduitFilterFactory<TFilter> filterFactory, ConduitHub conduit, ILogger<Conduit<TFilter>> logger)
        {
            FilterFactory = filterFactory;
            _conduit = conduit;
            _logger = logger;

            var eventKey = typeof(TFilter).Name;
            _logger.LogInformation($"Registering Filter for {eventKey}");
            _conduit.FilterActions.Add(eventKey, (dynamic, connectionId) =>
            {
                var mappedFilter = Mapper<TFilter>.Map(dynamic) as TFilter;
                if (_logger.IsEnabled(LogLevel.Trace))
                    _logger.LogTrace($"registering filter for {JsonSerializer.Serialize(mappedFilter)}");
                var pair = new ConnectionFilterPair(connectionId, mappedFilter);
                var current = ConnectionFilterMap.AddOrUpdate(connectionId, pair, (x, y) => pair);
                _logger.LogDebug($"Mapped connection ({current.ConnectionId}) with filter [{current.Filter}]");
            });
        }

        /// <summary>
        /// OnConnected handler
        /// </summary>
        /// <param name="context">The connection context</param>
        public void OnConnectedAsync(HubCallerContext context)
        {
            if (FilterFactory != null)
            {
                var filter = FilterFactory.Build(context);
                var pair = new ConnectionFilterPair(context.ConnectionId, filter ?? new TFilter());
                ConnectionFilterMap.TryAdd(context.ConnectionId, pair);
            }
        }

        /// <summary>
        /// OnDisconnected handler
        /// </summary>
        /// <param name="context">The connection context</param>
        public void OnDisconnectedAsync(HubCallerContext context)
        {
            ConnectionFilterMap.TryRemove(context.ConnectionId, out ConnectionFilterPair value);
        }

        /// <summary>
        /// Call to send a payload to a filtered set of connected users
        /// </summary>
        /// <param name="clientSelector">Predicate used to filter which users to send a payload to</param>
        /// <param name="payload">The payload object to send. The payload class name (not full name) will be the methodName client-side.</param>
        /// <returns></returns>
        public Task SendAsync<TPayload>(Predicate<TFilter> clientSelector, TPayload payload)
        {
            var filterType = typeof(TFilter).Name;
            if (!_conduit.FilterActions.ContainsKey(filterType))
            {
                throw new NotSupportedException($"There is no Conduit<{filterType}> registered on the server");
            }

            IEnumerable<ConnectionFilterPair> query = ConnectionFilterMap.Values;

            var ids = query.Where(x => clientSelector(x.Filter)).Select(x => x.ConnectionId).ToList();

            if (ids.Any())
            {
                _conduit._logger.LogDebug($"Sending {typeof(TPayload).Name} to connections {string.Join(",", ids)}");
                return _conduit.Clients?.Clients(ids).SendAsync(typeof(TPayload).Name, payload);
            }

            return Task.CompletedTask;
        }

        /// <summary>
        /// Cleans up any connections that have existed outside the max connection lifetime
        /// </summary>
        /// <param name="maxConnectionLifetime">Max lifetime of the connection</param>
        public void Cleanup(TimeSpan maxConnectionLifetime)
        {
            var keys = ConnectionFilterMap.Keys;
            var now = DateTime.Now;

            foreach (var key in keys)
            {
                if (ConnectionFilterMap.TryGetValue(key, out var pair))
                {
                    if (now - pair.CreatedDate > maxConnectionLifetime)
                    {
                        ConnectionFilterMap.TryRemove(key, out pair);
                    }
                }
            }
        }
    }
}