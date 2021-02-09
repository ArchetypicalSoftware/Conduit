using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Archetypical.Software.Conduit
{
    /// <summary>
    ///
    /// </summary>
    public class ConduitHub : Hub
    {
        internal ILogger<ConduitHub> _logger;

        /// <summary>
        ///
        /// </summary>
        /// <param name="conduits"></param>
        /// <param name="logger"></param>
        public ConduitHub(IEnumerable<IConduit> conduits, ILogger<ConduitHub> logger)
        {
            Children = conduits.ToList();
            _logger = logger;
        }

        internal List<IConduit> Children;

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
        /// Initiates the Cleanup task. This is only here to clean up closed connections that don't call OnDisconnectedAsync
        /// </summary>
        public void StartCleanupTask()
        {
            if (CleanUpTask == null)
            {
                CleanUpTask = Task.Run(async () =>
                {
                    while (true)
                    {
                        await Task.Delay(CleanupTaskInterval);
                        _logger.LogInformation("Kicking off cleanup tasks...");
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
            _logger.LogInformation($"New filter requested for [{filterName}]...");
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