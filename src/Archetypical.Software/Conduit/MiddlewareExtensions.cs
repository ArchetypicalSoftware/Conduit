using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace Archetypical.Software.Conduit
{
    public static class MiddlewareExtensions
    {
        public static IApplicationBuilder UseConduit(this IApplicationBuilder builder, Action<ConduitOptions> options)
        {
            builder.UseSignalR(routes =>
            {
                routes.MapHub<Conduit>("/conduit");
            });

            var opt = new ConduitOptions { Conduit = builder.ApplicationServices.GetService<Conduit>() };
            options(opt);
            return builder.UseMiddleware<ConduitMiddleware>();
        }

        public static void AddConduit(this IServiceCollection services, Action<HubOptions> signalROptions = null)
        {
            services.Add(ServiceDescriptor.Singleton(new Conduit()));

            if (signalROptions != null)
            {
                services.AddSignalR(signalROptions);
            }
            else
            {
                services.AddSignalR();
            }
        }
    }

    public class ConduitOptions
    {
        public Conduit Conduit { get; set; }
    }
}