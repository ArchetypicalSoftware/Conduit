using Microsoft.AspNetCore.SignalR;
using System;

namespace Archetypical.Software.Conduit
{
    public interface IConduit
    {
        void OnConnectedAsync(HubCallerContext context);

        void OnDisconnectedAsync(HubCallerContext context);

        void Cleanup(TimeSpan maxConnectionLifetime);
    }
}