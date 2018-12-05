using Microsoft.AspNetCore.SignalR;

namespace Archetypical.Software
{
    internal interface IConduit
    {
        void OnContextConnectedAsync(HubCallerContext context);
    }

    // You may need to install the Microsoft.AspNetCore.Http.Abstractions package into your project

    // Extension method used to add the middleware to the HTTP request pipeline.
}