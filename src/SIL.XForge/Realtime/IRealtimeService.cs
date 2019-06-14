using System.Collections.Generic;
using System.Threading.Tasks;

namespace SIL.XForge.Realtime
{
    public interface IRealtimeService
    {
        void StartServer();
        void StopServer();

        Task<IConnection> ConnectAsync();

        Task DeleteAllAsync(string type, IEnumerable<string> ids);
    }
}
