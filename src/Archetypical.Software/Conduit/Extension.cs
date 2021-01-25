using Microsoft.AspNetCore.SignalR;

namespace Archetypical.Software.Conduit
{
    public static class Extension
    {
        public static void AddFilter<T>(this Conduit src, IConduitFilterFactory<T> filter = null) where T : class, new()
        {
            src.Children.Add(new Conduit<T>(filter ?? new ClientInitiatedFilter<T>(), src, src._logger)); ;
        }
    }

    public class ClientInitiatedFilter<T> : IConduitFilterFactory<T> where T : class
    {
        public T Build(HubCallerContext context)
        {
            return null;
        }
    }
}