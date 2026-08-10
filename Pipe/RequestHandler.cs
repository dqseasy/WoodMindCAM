using System.Text.Json;

namespace WoodMindCAM.Pipe
{
    internal static class RequestHandler
    {
        public static string Handle(
        string requestJson,
        string pipeName,
        DateTime startTime,
        out bool shouldClose)
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
                        data = new
                        {
                            pipe_name = pipeName,
                            engine = "WoodMindCAM",
                            version = "1.0.0",
                            connected_at = startTime.ToString("yyyy-MM-dd HH:mm:ss"),
                            uptime_seconds = (int)(DateTime.Now - startTime).TotalSeconds,
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
