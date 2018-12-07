using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace Archetypical.Software
{
    public static class MiddlewareExtensions
    {
        public static IApplicationBuilder UseConduit(this IApplicationBuilder builder)
        {
            builder.UseSignalR(routes =>
            {
                routes.MapHub<Conduit>("/conduit");
            });
            return builder.UseMiddleware<ConduitMiddleware>();
        }

        public static void AddConduit(this IServiceCollection services, Action<HubOptions> signalROptions = null)
        {
            services.Add(ServiceDescriptor.Singleton(provider => new Conduit(provider)));
            services.AddSignalR(signalROptions);
        }
    }
}