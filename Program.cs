using System.Threading;
using WoodMindCAM.Pipe;

namespace WoodMindCAM
{
    internal static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            if (args.Length == 0)
                return;

            string uid = args[0];
            string pipeName = $"WoodMindCAM_{uid}";

            var server = new PipeServer(pipeName);
            server.Start();

            Thread.Sleep(Timeout.Infinite);
        }
    }
}