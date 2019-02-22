using Microsoft.AspNetCore.SignalR;

namespace Archetypical.Software.Conduit
{
    public interface IConduitFilterFactory
    {
    }

    public interface IConduitFilterFactory<T> : IConduitFilterFactory
    {
        T Build(HubCallerContext context);
    }
}