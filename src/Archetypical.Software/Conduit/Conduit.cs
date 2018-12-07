using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Archetypical.Software
{
    public class Conduit<T> : IConduit
    {
        private static Conduit _conduit;

        public Conduit(IConduitFilter<T> filter, Conduit conduit)
        {
            Filter = filter;
            _conduit = conduit;
        }

        public void OnContextConnectedAsync(HubCallerContext context)
        {
            if (Filter != null)
            {
                var client = Filter.PopulateClient(context);
                _pairs.Add(new Pair(context.ConnectionId, client));
            }
        }

        private IConduitFilter<T> Filter { get; }

        private static readonly List<Pair> _pairs = new List<Pair>();

        /// <summary>
        ///
        /// </summary>
        /// <param name="clientSelector"></param>
        /// <param name="payload"></param>
        /// <returns></returns>
        public static Task SendAsync(Predicate<T> clientSelector, object payload)
        {
            var ids = _pairs.Where(x => clientSelector(x.Client)).Select(x => x.ConnectionId).ToList();
            if (ids.Any())
            {
                return _conduit.Clients?.Clients(ids).SendAsync("conduit", payload);
            }

            return Task.CompletedTask;
        }

        private class Pair
        {
            public Pair(string connectionId, T client)
            {
                ConnectionId = connectionId;
                Client = client;
            }

            public string ConnectionId { get; }
            public T Client { get; }
        }
    }

    public class Conduit : Hub
    {
        public override Task OnConnectedAsync()
        {
            Children.ForEach(conduit => conduit.OnContextConnectedAsync(Context));
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            return base.OnDisconnectedAsync(exception);
        }

        internal List<IConduit> Children = new List<IConduit>();
        private IServiceProvider _provider;

        public Conduit(IServiceProvider provider)
        {
            _provider = provider;
        }
    }
}