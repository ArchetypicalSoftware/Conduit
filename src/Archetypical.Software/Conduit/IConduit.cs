using Microsoft.AspNetCore.SignalR;

namespace Archetypical.Software.Conduit
{
    internal interface IConduit
    {
        void OnContextConnectedAsync(HubCallerContext context);

        void OnContextDisconnectedAsync(HubCallerContext context);
    }
}