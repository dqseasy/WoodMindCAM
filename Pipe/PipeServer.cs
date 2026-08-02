using System.IO.Pipes;
using System.Text;
using System.Text.Json;

namespace WoodMindCAM.Pipe
{
    internal class PipeServer
    {
        private readonly DateTime _startTime = DateTime.Now;
        private readonly string _pipeName;

        public PipeServer(string pipeName)
        {
            _pipeName = pipeName;
        }

        public void Start()
        {
            Task.Run(ListenLoop);
        }

        private async Task ListenLoop()
        {
            bool running = true;

            while (running)
            {
                using var server = new NamedPipeServerStream(
                    _pipeName,
                    PipeDirection.InOut,
                    1,
                    PipeTransmissionMode.Byte,
                    PipeOptions.Asynchronous);

                await server.WaitForConnectionAsync();

                try
                {
                    string requestJson = await ReadMessage(server);

                    bool shouldClose;
                    string responseJson = HandleRequest(requestJson, out shouldClose);

                    await WriteMessage(server, responseJson);

                    if (shouldClose)
                        running = false;
                }
                catch
                {
                    // giữ server sống
                }
            }

            Environment.Exit(0);
        }

        private static async Task<string> ReadMessage(Stream stream)
        {
            byte[] lenBytes = new byte[4];
            await ReadExact(stream, lenBytes, 4);

            int length = BitConverter.ToInt32(lenBytes, 0);

            byte[] data = new byte[length];
            await ReadExact(stream, data, length);

            return Encoding.UTF8.GetString(data);
        }

        private static async Task WriteMessage(Stream stream, string json)
        {
            byte[] data = Encoding.UTF8.GetBytes(json);
            byte[] lenBytes = BitConverter.GetBytes(data.Length);

            await stream.WriteAsync(lenBytes, 0, 4);
            await stream.WriteAsync(data, 0, data.Length);
            await stream.FlushAsync();
        }

        private static async Task ReadExact(Stream stream, byte[] buffer, int length)
        {
            int offset = 0;

            while (offset < length)
            {
                int read = await stream.ReadAsync(buffer, offset, length - offset);

                if (read == 0)
                    throw new IOException("Pipe closed");

                offset += read;
            }
        }

        private string HandleRequest(string requestJson, out bool shouldClose)
        {
            shouldClose = false;

            try
            {
                using JsonDocument doc = JsonDocument.Parse(requestJson);

                string type = doc.RootElement
                    .GetProperty("type")
                    .GetString()?
                    .ToLowerInvariant() ?? string.Empty;

                object response = type switch
                {
                    "test_connection" => new
                    {
                        status = "OK",
                        type = "test_connection",
                        message = "connected",
                        data = new {
                            pipe_name = _pipeName,
                            engine = "WoodMindCAM",
                            version = "1.0.0",
                            connected_at = _startTime.ToString("yyyy-MM-dd HH:mm:ss"),
                            uptime_seconds = (int)(DateTime.Now - _startTime).TotalSeconds,
                            process_id = Environment.ProcessId,
                            protocol = "length-prefixed-json-v1"
                        }
                    },

                    "close" => CloseResponse(out shouldClose),

                    _ => new
                    {
                        status = "ERROR",
                        type = type,
                        message = "unknown request",
                        data = new { }
                    }
                };

                return JsonSerializer.Serialize(response);
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new
                {
                    status = "ERROR",
                    type = "exception",
                    message = ex.Message,
                    data = new { }
                });
            }
        }

        private static object CloseResponse(out bool shouldClose)
        {
            shouldClose = true;

            return new
            {
                status = "OK",
                type = "close",
                message = "closing",
                data = new { }
            };
        }
    }
}