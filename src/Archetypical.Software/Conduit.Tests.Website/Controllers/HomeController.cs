using Archetypical.Software;
using Conduit.Tests.Website.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace Conduit.Tests.Website.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Send(string something)
        {
            Conduit<SomeSubscriptionObject>.SendAsync(t => t.Sample.Equals(something), new SomePayload());
            return Ok();
        }

        public IActionResult About()
        {
            ViewData["Message"] = "Your application description page.";

            return View();
        }

        public IActionResult Contact()
        {
            ViewData["Message"] = "Your contact page.";

            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}