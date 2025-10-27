import { useNavigate } from "react-router-dom";

export default function DashboardPasajero() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/auth");
  };

  // DEBUG TEMPORAL - Agrega esto
  console.log("🔍 DEBUG - localStorage completo:", {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    name: localStorage.getItem("name"),
    todosLosItems: { ...localStorage }
  });

  // Obtener el nombre del usuario del localStorage
  const userName = localStorage.getItem("name") || "Usuario";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - IGUAL AL DEL CONDUCTOR */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              W
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Wheels</h1>
          </div>
          
          <div className="text-right">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-1">
              pasajero
            </span>
            <p className="text-gray-600 text-sm">{userName}</p>
          </div>
        </div>
      </div>

      {/* Contenido principal - OCUPA TODA LA PANTALLA (TODO IGUAL) */}
      <div className="flex-1 bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Título */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Buscar viaje</h2>
            <p className="text-gray-600 text-lg">
              Encuentra conductores que vayan a tu destino
            </p>
          </div>

          {/* Formulario de búsqueda */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <h3 className="font-semibold mb-6 text-xl text-gray-900">Desde</h3>
            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <input
                  type="text"
                  placeholder="Punto de inicio"
                  className="flex-1 border border-gray-300 rounded-xl px-6 py-4 text-lg focus:ring-2 focus:ring-[#2A609E] outline-none"
                />
              </div>
              <h3 className="font-semibold mb-6 text-xl text-gray-900">Hasta</h3>
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <input
                  type="text"
                  placeholder="Punto de llegada"
                  className="flex-1 border border-gray-300 rounded-xl px-6 py-4 text-lg focus:ring-2 focus:ring-[#2A609E] outline-none"
                />
              </div>
            </div>
            <button className="w-full bg-[#2A609E] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#224f84] transition">
              Buscar Viajes
            </button>
          </div>

          {/* Lista de viajes disponibles */}
          <div className="space-y-6">
            {/* Viaje 1 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-xl mb-4 text-gray-900">Nombre del conductor</h3>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">Lugar de inicio → Destino</span>
                    </div>
                    <div className="flex items-center gap-8 text-base">
                      <span>Hora | 8:00 AM</span>
                      <span>Presio | $15.000</span>
                      <span># De asientos disponibles | 3</span>
                    </div>
                  </div>
                </div>
                <button className="bg-[#2A609E] text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-[#224f84] transition whitespace-nowrap ml-6">
                  Reservar
                </button>
              </div>
            </div>

            {/* Viaje 2 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-xl mb-4 text-gray-900">Carlos Rodríguez</h3>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">Calle 100 → Universidad Sabana</span>
                    </div>
                    <div className="flex items-center gap-8 text-base">
                      <span>Hora | 7:30 AM</span>
                      <span>Presio | $12.000</span>
                      <span># De asientos disponibles | 2</span>
                    </div>
                  </div>
                </div>
                <button className="bg-[#2A609E] text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-[#224f84] transition whitespace-nowrap ml-6">
                  Reservar
                </button>
              </div>
            </div>

            {/* Viaje 3 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-xl mb-4 text-gray-900">Ana Martínez</h3>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">Centro → Campus Universitario</span>
                    </div>
                    <div className="flex items-center gap-8 text-base">
                      <span>Hora | 9:15 AM</span>
                      <span>Presio | $10.000</span>
                      <span># De asientos disponibles | 4</span>
                    </div>
                  </div>
                </div>
                <button className="bg-[#2A609E] text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-[#224f84] transition whitespace-nowrap ml-6">
                  Reservar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}