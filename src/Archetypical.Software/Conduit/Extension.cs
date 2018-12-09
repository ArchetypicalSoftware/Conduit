using Microsoft.AspNetCore.SignalR;

namespace Archetypical.Software
{
    public static class Extension
    {
        public static void AddFilter<T>(this Conduit src, IConduitFilter<T> filter = null) where T : class, new()
        {
            src.Children.Add(new Conduit<T>(filter ?? new ClientInitiatedFilter<T>(), src));
        }
    }

    public class ClientInitiatedFilter<T> : IConduitFilter<T> where T : class
    {
        public T PopulateClient(HubCallerContext context)
        {
            return null;
        }
    }
}