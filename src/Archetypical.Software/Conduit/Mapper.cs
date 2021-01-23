using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Reflection;
using System.Text.Json;

namespace Archetypical.Software.Conduit
{
    // By using a generic class we can take advantage
    // of the fact that .NET will create a new generic type
    // for each type T. This allows us to avoid creating
    // a dictionary of Dictionary<string, PropertyInfo>
    // for each type T. We also avoid the need for the
    // lock statement with every call to Map.
    public static class Mapper<T>
        // We can only use reference types
        where T : class, new()
    {
        private static readonly Dictionary<string, PropertyInfo> _propertyMap;

        static Mapper()
        {
            // At this point we can convert each
            // property name to lower case so we avoid
            // creating a new string more than once.
            _propertyMap = typeof(T).GetProperties()
                .ToDictionary(p => p.Name.ToLower(), p => p);
        }

        public static T Map(ExpandoObject source)
        {
            T destination = new T();
            // Might as well take care of null references early.
            if (source == null)
            {
                throw new ArgumentNullException("source");
            }

            if (destination == null)
            {
                throw new ArgumentNullException("destination");
            }

            // .netcore3.1 changed its SignalR implementation and relys on the below for serialization
            return JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(source));
        }
    }
}