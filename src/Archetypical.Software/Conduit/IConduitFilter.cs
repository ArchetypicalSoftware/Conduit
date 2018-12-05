using Microsoft.AspNetCore.SignalR;

namespace Archetypical.Software
{
    public interface IConduitFilter
    {
    }

    public interface IConduitFilter<T> : IConduitFilter
    {
        T PopulateClient(HubCallerContext context);
    }
}