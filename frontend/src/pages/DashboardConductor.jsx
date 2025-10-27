export default function DashboardConductor() {
  // Datos de ejemplo para los viajes
  const viajes = [
    {
      hora: "08:30 AM",
      inicio: "Av. Principal 123",
      precio: "$15.000",
      destino: "Centro Comercial",
      pasajeros: 3
    },
    {
      hora: "02:15 PM", 
      inicio: "Calle 45 #67-89",
      precio: "$12.000",
      destino: "Universidad",
      pasajeros: 2
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
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
              conductor
            </span>
            <p className="text-gray-600 text-sm">Nombre de usuario</p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Título y botón */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Mis viajes</h2>
            <p className="text-gray-600">Gestiona tus viajes programados</p>
          </div>
          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Publicar viaje
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 mb-2">15</div>
            <div className="text-gray-600">Viajes completados</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 mb-2">4.8</div>
            <div className="text-gray-600">Calificación promedio</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 mb-2">42</div>
            <div className="text-gray-600">Pasajeros transportados</div>
          </div>
        </div>

        {/* Lista de viajes - ESTILO PASAJERO */}
        <div className="space-y-6">
          {/* Viaje 1 */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-4 text-gray-900">Viaje programado</h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">{viajes[0].inicio} → {viajes[0].destino}</span>
                  </div>
                  <div className="flex items-center gap-8 text-base">
                    <span>Hora | {viajes[0].hora}</span>
                    <span>Precio | {viajes[0].precio}</span>
                    <span># De pasajeros | {viajes[0].pasajeros}</span>
                  </div>
                </div>
              </div>
              <button className="bg-[#2A609E] text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-[#224f84] transition whitespace-nowrap ml-6">
                Editar
              </button>
            </div>
          </div>

          {/* Viaje 2 */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-4 text-gray-900">Viaje programado</h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">{viajes[1].inicio} → {viajes[1].destino}</span>
                  </div>
                  <div className="flex items-center gap-8 text-base">
                    <span>Hora | {viajes[1].hora}</span>
                    <span>Precio | {viajes[1].precio}</span>
                    <span># De pasajeros | {viajes[1].pasajeros}</span>
                  </div>
                </div>
              </div>
              <button className="bg-[#2A609E] text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-[#224f84] transition whitespace-nowrap ml-6">
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}