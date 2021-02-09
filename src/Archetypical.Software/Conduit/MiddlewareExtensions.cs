using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using System;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.SignalR;

namespace Archetypical.Software.Conduit
{
    public static class MiddlewareExtensions
    {
        public static IApplicationBuilder UseConduit(this IEndpointRouteBuilder router, IApplicationBuilder builder, Action<ConduitOptions> options)
        {
            router.MapHub<ConduitHub>("/conduit");

            var opt = new ConduitOptions
            {
                Conduit = builder.ApplicationServices.GetService<ConduitHub>(),
            };

            options(opt);
            opt.Conduit.CleanupTaskInterval = opt.CleanupTaskInterval;
            opt.Conduit.MaxConnectionLifetime = opt.MaxConnectionLifetime;

            if (opt.CleanupTaskEnabled)
            {
                opt.Conduit.StartCleanupTask();
            }

            return builder;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="services"></param>
        /// <param name="signalROptions"></param>
        /// <returns></returns>
        public static ISignalRServerBuilder AddConduit(this IServiceCollection services, Action<HubOptions> signalROptions = null)
        {
            services.AddSingleton<ConduitHub>();
            services.AddSingleton(typeof(Conduit<>));
            if (signalROptions != null) services.Configure(signalROptions);
            return services.AddSignalR();
        }
    }

    public class ConduitOptions
    {
        public ConduitHub Conduit { get; set; }
        public TimeSpan MaxConnectionLifetime { get; set; } = TimeSpan.FromDays(1);

        public TimeSpan CleanupTaskInterval { get; set; } = TimeSpan.FromHours(1);

        public bool CleanupTaskEnabled { get; set; } = true;
    }
}