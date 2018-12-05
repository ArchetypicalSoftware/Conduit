using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Archetypical.Software
{
    public static class MiddlewareExtensions
    {
        public static IApplicationBuilder UseConduit(this IApplicationBuilder builder)
        {
            builder.UseSignalR(routes => { routes.MapHub<Conduit>("/conduit"); });
            return builder.UseMiddleware<ConduitMiddleware>();
        }

        public static void AddConduit(this IServiceCollection services)
        {
            services.Add(ServiceDescriptor.Singleton(provider => new Conduit(provider)));
            services.AddSignalR();
        }
    }
}