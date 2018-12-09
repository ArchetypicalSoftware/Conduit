using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Threading.Tasks;

namespace Archetypical.Software
{
    public class Conduit<TSubscription> : IConduit where TSubscription : class, new()
    {
        private static Conduit _conduit;

        public Conduit(IConduitFilter<TSubscription> filter, Conduit conduit)
        {
            Filter = filter;
            _conduit = conduit;
            _conduit.SubscriptionActions[typeof(TSubscription).Name] = (dn, connectionId) =>
            {
                var client = Mapper<TSubscription>.Map(dn);
                var current = Pairs.FirstOrDefault(x => x.ConnectionId == connectionId);
                if (current != null)
                {
                    current.ClientSubscription = client;
                }
            };
        }

        public void OnContextConnectedAsync(HubCallerContext context)
        {
            if (Filter != null)
            {
                var client = Filter.PopulateClient(context);
                Pairs.Add(new Pair(context.ConnectionId, client ?? new TSubscription()));
            }
        }

        private IConduitFilter<TSubscription> Filter { get; }

        private static readonly List<Pair> Pairs = new List<Pair>();

        /// <summary>
        ///
        /// </summary>
        /// <param name="clientSelector"></param>
        /// <param name="payload"></param>
        /// <returns></returns>
        public static Task SendAsync<TPayload>(Predicate<TSubscription> clientSelector, TPayload payload)
        {
            var ids = Pairs.Where(x => clientSelector(x.ClientSubscription)).Select(x => x.ConnectionId).ToList();
            if (ids.Any())
            {
                return _conduit.Clients?.Clients(ids).SendAsync("conduit", typeof(TPayload).Name, payload);
            }

            return Task.CompletedTask;
        }

        private class Pair
        {
            public Pair(string connectionId, TSubscription client)
            {
                ConnectionId = connectionId;
                ClientSubscription = client;
            }

            public string ConnectionId { get; }
            public TSubscription ClientSubscription { get; set; }
        }
    }

    public class Conduit : Hub
    {
        protected internal Dictionary<string, Action<dynamic, string>> SubscriptionActions = new Dictionary<string, Action<dynamic, string>>(StringComparer.CurrentCultureIgnoreCase);

        public override Task OnConnectedAsync()
        {
            Children.ForEach(conduit => conduit.OnContextConnectedAsync(Context));
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            return base.OnDisconnectedAsync(exception);
        }

        public Task Subscribe(string typeName, ExpandoObject subscription)
        {
            if (SubscriptionActions.ContainsKey(typeName))
            {
                var del = SubscriptionActions[typeName];
                del.Invoke(subscription, Context.ConnectionId);
                return Task.CompletedTask;
            }

            throw new NotSupportedException($"There is no Conduit<{typeName}> registered on the server");
        }

        internal List<IConduit> Children = new List<IConduit>();

        public Conduit()
        {
        }
    }
}