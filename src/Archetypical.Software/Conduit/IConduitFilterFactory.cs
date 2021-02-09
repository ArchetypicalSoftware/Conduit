using Microsoft.AspNetCore.SignalR;

namespace Archetypical.Software.Conduit
{
    public interface IConduitFilterFactory
    {
    }

    /// <summary>
    ///
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public interface IConduitFilterFactory<T> : IConduitFilterFactory
    {
        /// <summary>
        ///
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        T Build(HubCallerContext context);
    }
}