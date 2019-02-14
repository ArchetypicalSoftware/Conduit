using Microsoft.AspNetCore.SignalR;
using System;

namespace Archetypical.Software.Conduit
{
    internal interface IConduit
    {
        void OnConnectedAsync(HubCallerContext context);

        void OnDisconnectedAsync(HubCallerContext context);

        void Cleanup(TimeSpan maxConnectionLifetime);
    }
}