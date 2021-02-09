using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;

namespace Archetypical.Software.Conduit
{
    public interface IConduit
    {
        void Initialize(Dictionary<string,Action<dynamic,string>> filterActions);
        void OnConnectedAsync(HubCallerContext context);

        void OnDisconnectedAsync(HubCallerContext context);

        void Cleanup(TimeSpan maxConnectionLifetime);
    }
}