using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Archetypical.Software
{
    public static class MiddlewareExtensions
    {
        public static IApplicationBuilder UseConduit(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ConduitMiddleware>();
        }

        public static void AddConduit(this IServiceCollection services)
        {
            services.AddSignalRCore();
            services.Add(ServiceDescriptor.Singleton(provider => new Conduit(provider)));
        }
    }
}