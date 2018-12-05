namespace Archetypical.Software
{
    public static class Extension
    {
        public static void AddFilter<T>(this Conduit src, IConduitFilter<T> filter)
        {
            src.Children.Add(new Conduit<T>(filter, src));
        }
    }
}