using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Threading.Tasks;

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

        #endregion

        private static Conduit _conduit;
        private static ConcurrentDictionary<string, ConnectionFilterPair> ConnectionFilterMap = new ConcurrentDictionary<string, ConnectionFilterPair>();

        private IConduitFilterFactory<TFilter> FilterFactory { get; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="filterFactory">Filter factory that creates object to evaluate</param>
        /// <param name="conduit">Conduit instance</param>
        public Conduit(IConduitFilterFactory<TFilter> filterFactory, Conduit conduit)
        {
            FilterFactory = filterFactory;
            _conduit = conduit;

            var eventKey = typeof(TFilter).Name;

            _conduit.FilterActions.Add(eventKey, (dynamic, connectionId) =>
            {
                var mappedFilter = Mapper<TFilter>.Map(dynamic) as TFilter;
                var pair = new ConnectionFilterPair(connectionId, mappedFilter);
                var current = ConnectionFilterMap.AddOrUpdate(connectionId, pair, (x,y) => pair);
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
        public static Task SendAsync<TPayload>(Predicate<TFilter> clientSelector, TPayload payload)
        {
            var filterType = typeof(TFilter).Name;
            if(!_conduit.FilterActions.ContainsKey(filterType))
            {
                throw new NotSupportedException($"There is no Conduit<{filterType}> registered on the server");
            }

            IEnumerable<ConnectionFilterPair> query = ConnectionFilterMap.Values;

            var ids = query.Where(x => clientSelector(x.Filter)).Select(x => x.ConnectionId).ToList();

            if (ids.Any())
            {
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

    /// <summary>
    /// 
    /// </summary>
    public class Conduit : Hub
    {
        internal List<IConduit> Children = new List<IConduit>();

        /// <summary>
        /// Dictionary of filter actions to be called on a new filter from client-side
        /// </summary>
        protected internal Dictionary<string, Action<dynamic, string>> FilterActions = new Dictionary<string, Action<dynamic, string>>(StringComparer.CurrentCultureIgnoreCase);        

        /// <summary>
        /// The max lifetime of a connection to monitor
        /// </summary>
        protected internal TimeSpan MaxConnectionLifetime { get; set; }

        /// <summary>
        /// How frequently to call Cleanup
        /// </summary>
        protected internal TimeSpan CleanupTaskInterval { get; set; }

        private Task CleanUpTask { get; set; }

        /// <summary>
        /// Constructor
        /// </summary>
        public Conduit() { }

        /// <summary>
        /// Initiates the Cleanup task. This is only here to clean up closed connections that don't call OnDisconnectedAsync
        /// </summary>
        public void StartCleanupTask()
        {
            if(CleanUpTask == null)
            {
                CleanUpTask = Task.Run(async () =>
                {
                    while (true)
                    {
                        await Task.Delay(CleanupTaskInterval);

                        Children.ForEach(conduit => conduit.Cleanup(MaxConnectionLifetime));
                    }
                });
            }
        }

        /// <summary>
        /// OnConnected handler
        /// </summary>
        /// <returns></returns>
        public override Task OnConnectedAsync()
        {
            Children.ForEach(conduit => conduit.OnConnectedAsync(Context));
            return base.OnConnectedAsync();
        }

        /// <summary>
        /// OnDisconnected handler
        /// </summary>
        /// <param name="exception"></param>
        /// <returns></returns>
        public override Task OnDisconnectedAsync(Exception exception)
        {
            Children.ForEach(conduit => conduit.OnDisconnectedAsync(Context));
            return base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Applies a filter from client-side. Replaces any existng filter previously assigned.
        /// </summary>
        /// <param name="filterName"></param>
        /// <param name="filter"></param>
        /// <returns></returns>
        public void ApplyFilter(string filterName, ExpandoObject filter)
        {
            if (FilterActions.ContainsKey(filterName))
            {
                var del = FilterActions[filterName];
                del.Invoke(filter, Context.ConnectionId);
            }
            else
            {
                throw new NotSupportedException($"There is no Conduit<{filterName}> registered on the server");
            }
        }
    }
}