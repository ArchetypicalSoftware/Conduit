using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Archetypical.Software
{
    public class ConduitMiddleware
    {
        private readonly RequestDelegate _next;

        public ConduitMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public Task Invoke(HttpContext httpContext)
        {
            return _next(httpContext);
        }
    }
}