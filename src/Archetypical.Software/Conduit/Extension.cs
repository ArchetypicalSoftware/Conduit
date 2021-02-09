using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;

namespace Archetypical.Software.Conduit
{
    public static class Extension
    {
        /// <summary>
        ///
        /// </summary>
        /// <param name="src"></param>
        /// <param name="filter"></param>
        /// <typeparam name="T"></typeparam>
        public static ISignalRServerBuilder AddFilter<T>(this ISignalRServerBuilder src, IConduitFilterFactory<T> filter) where T : class, new()
        {
            src.Services.AddSingleton(filter);
            return src;
        }
    }

    /// <summary>
    ///
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class ClientInitiatedFilter<T> : IConduitFilterFactory<T> where T : class
    {
        /// <summary>
        ///
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public T Build(HubCallerContext context)
        {
            return null;
        }
    }
}