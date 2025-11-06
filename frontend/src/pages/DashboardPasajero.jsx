import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_USER_URL, API_TRIPS_URL } from "../config/api.js";

export default function DashboardPasajero() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState({}); // { tripId: cantidad }

  // Obtener el nombre del usuario del localStorage
  const userName = localStorage.getItem("name") || "Usuario";
  const token = localStorage.getItem('token');

  // Cargar mis viajes reservados y todos los viajes disponibles al iniciar
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
    loadMyTrips();
    loadAllTrips(); // Cargar todos los viajes disponibles automáticamente
  }, []);

  async function loadAllTrips() {
    if (!token) return;
    
    try {
      setSearching(true);
      // Cargar todos los viajes disponibles sin filtros
      const res = await fetch(`${API_TRIPS_URL}/search`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setResults(data.trips || []);
      }
    } catch (e) {
      console.error("Error al cargar viajes:", e);
    } finally {
      setSearching(false);
    }
  }

  async function switchTo(role) {
    try {
      const res = await fetch(`${API_USER_URL}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo cambiar el rol');
      }
      
      // Si necesita onboarding, redirigir a la página correspondiente
      if (data.needOnboarding) {
        if (data.onboardingToken) {
          localStorage.setItem('onboardingToken', data.onboardingToken);
        }
        // Guardar en sessionStorage para que las páginas de onboarding sepan que viene del dashboard
        sessionStorage.setItem('fromDashboard', 'true');
        navigate(data.nextRoute || (role === 'conductor' ? '/register-driver-vehicle' : '/register-photo'), {
          state: { role: role, fromDashboard: true }
        });
        return;
      }
      
      // Si el rol ya está completado, cambiar directamente
      if (data.token) localStorage.setItem('token', data.token);
      localStorage.setItem('role', role);
      window.location.href = role === 'conductor' ? '/dashboard-conductor' : '/dashboard-pasajero';
    } catch (e) {
      alert(e.message);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/auth");
  };

  async function searchTrips() {
    if (!from.trim() || !to.trim()) {
      setError("Por favor completa los campos 'Desde' y 'Hasta'");
      return;
    }
    
    setSearching(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (date) params.set('date', date);
      
      const res = await fetch(`${API_TRIPS_URL}/search?${params.toString()}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al buscar viajes');
      }
      
      setResults(data.trips || []);
      if (data.trips && data.trips.length === 0) {
        setError("No se encontraron viajes disponibles con esos criterios");
      }
    } catch (e) {
      setError(e.message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function bookTrip(id, seats = 1) {
    if (!token) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      navigate("/auth");
      return;
    }

    if (!seats || seats < 1) {
      alert("Por favor selecciona al menos 1 asiento");
      return;
    }

    const trip = results.find(t => t._id === id);
    if (trip && seats > trip.seatsAvailable) {
      alert(`Solo hay ${trip.seatsAvailable} asiento${trip.seatsAvailable !== 1 ? 's' : ''} disponible${trip.seatsAvailable !== 1 ? 's' : ''}`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_TRIPS_URL}/${id}/book`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ seats: Number(seats) })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo solicitar reserva');
      }
      
      alert(`✅ Solicitud de reserva por ${seats} asiento${seats > 1 ? 's' : ''} enviada. El conductor revisará tu solicitud.`);
      
      // Limpiar selección de asientos para este viaje
      setSelectedSeats({ ...selectedSeats, [id]: 1 });
      
      // Actualizar resultados
      setResults(results.map(trip => 
        trip._id === id 
          ? { ...trip, requested: true }
          : trip
      ));
      await loadMyTrips();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyTrips() {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_TRIPS_URL}/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMyTrips(data.asPassenger || []);
      }
    } catch (e) {
      console.error("Error al cargar viajes:", e);
    }
  }

  async function handleCancelBooking(tripId) {
    if (!token) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      navigate("/auth");
      return;
    }

    if (!confirm('¿Estás seguro de cancelar esta reserva?')) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_TRIPS_URL}/${tripId}/bookings`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al cancelar reserva');
      }
      
      alert(data.message || '✅ Reserva cancelada exitosamente');
      await loadMyTrips();
      // Actualizar resultados si el viaje está visible
      setResults(results.map(trip => 
        trip._id === tripId 
          ? { ...trip, seatsAvailable: data.seatsAvailable || trip.seatsAvailable }
          : trip
      ));
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
              pasajero
            </span>
            <p className="text-gray-600 text-sm">{userName}</p>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => navigate('/profile')} 
                className="text-xs underline text-gray-600 hover:text-gray-800"
              >
                Mi perfil
              </button>
              <span className="text-gray-400">|</span>
              <button 
                onClick={() => switchTo('conductor')} 
                className="text-xs underline text-blue-600 hover:text-blue-800"
              >
                Cambiar a conductor
              </button>
              <span className="text-gray-400">|</span>
              <button 
                onClick={handleLogout} 
                className="text-xs underline text-red-600 hover:text-red-800"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
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
            <h3 className="font-semibold mb-6 text-xl text-gray-900">Buscar viaje</h3>
            <div className="space-y-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <input 
                  type="text" 
                  value={from} 
                  onChange={e=>setFrom(e.target.value)} 
                  placeholder="Punto de inicio (ej: Universidad)" 
                  className="flex-1 border border-gray-300 rounded-xl px-6 py-4 text-lg focus:ring-2 focus:ring-[#2A609E] outline-none" 
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <input 
                  type="text" 
                  value={to} 
                  onChange={e=>setTo(e.target.value)} 
                  placeholder="Punto de llegada (ej: Centro)" 
                  className="flex-1 border border-gray-300 rounded-xl px-6 py-4 text-lg focus:ring-2 focus:ring-[#2A609E] outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha (opcional)</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e=>setDate(e.target.value)} 
                  min={new Date().toISOString().split('T')[0]}
                  className="border border-gray-300 rounded-xl px-6 py-4 text-lg focus:ring-2 focus:ring-[#2A609E] outline-none w-full" 
                />
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <button 
              onClick={searchTrips} 
              disabled={searching}
              className="w-full bg-[#2A609E] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#224f84] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? "Buscando..." : "Buscar Viajes"}
            </button>
          </div>

          {/* Resultados de búsqueda / Viajes disponibles */}
          {results.length > 0 && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Viajes disponibles ({results.length})</h3>
                <button 
                  onClick={loadAllTrips} 
                  className="text-blue-600 underline text-sm hover:text-blue-800"
                  disabled={searching}
                >
                  {searching ? "Cargando..." : "Actualizar"}
                </button>
              </div>
              <div className="space-y-4">
                {results.map(trip => {
                  // Verificar si el usuario ya tiene una solicitud en este viaje
                  const myRequest = trip.bookings?.find(b => {
                    if (!b.passengerId) return false;
                    const passengerId = b.passengerId._id || b.passengerId;
                    return passengerId?.toString() === userId || passengerId?.toString() === localStorage.getItem('userId');
                  });
                  
                  return (
                    <div key={trip._id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow hover:shadow-lg transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-lg mb-2">{trip.from} → {trip.to}</div>
                          {trip.driver && (
                            <div className="text-sm text-gray-600 mb-1">
                              Conductor: {trip.driver.nombre}
                            </div>
                          )}
                          <div className="text-sm text-gray-600 mb-1">
                            📅 {new Date(trip.departureTime).toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-sm text-gray-600">
                            🕐 {new Date(trip.departureTime).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-2xl text-[#2A609E] mb-1">
                            ${trip.price}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            {trip.seatsAvailable > 0 ? (
                              <span className="text-green-600">✓ {trip.seatsAvailable} asientos disponibles</span>
                            ) : (
                              <span className="text-red-600">✗ Sin asientos</span>
                            )}
                          </div>
                          {myRequest ? (
                            <div className="text-sm">
                              {myRequest.status === "pending" && (
                                <div>
                                  <span className="text-orange-600 font-semibold">⏳ Solicitud pendiente</span>
                                  {myRequest.seats > 1 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {myRequest.seats} asientos solicitados
                                    </div>
                                  )}
                                </div>
                              )}
                              {myRequest.status === "accepted" && (
                                <div>
                                  <span className="text-green-600 font-semibold">✓ Aceptado</span>
                                  {myRequest.seats > 1 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {myRequest.seats} asientos confirmados
                                    </div>
                                  )}
                                </div>
                              )}
                              {myRequest.status === "rejected" && (
                                <button 
                                  onClick={()=>bookTrip(trip._id, selectedSeats[trip._id] || 1)} 
                                  disabled={loading}
                                  className="text-[#2A609E] underline text-sm"
                                >
                                  Volver a solicitar
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600">Asientos:</label>
                                <select
                                  value={selectedSeats[trip._id] || 1}
                                  onChange={(e) => setSelectedSeats({ ...selectedSeats, [trip._id]: Number(e.target.value) })}
                                  className="border rounded px-2 py-1 text-sm w-20"
                                  disabled={loading}
                                >
                                  {Array.from({ length: Math.min(trip.seatsAvailable || 1, 10) }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}</option>
                                  ))}
                                </select>
                              </div>
                              <button 
                                onClick={()=>bookTrip(trip._id, selectedSeats[trip._id] || 1)} 
                                disabled={trip.seatsAvailable <= 0 || loading}
                                className="bg-[#2A609E] text-white px-6 py-2 rounded-xl hover:bg-[#224f84] transition disabled:opacity-50 disabled:cursor-not-allowed w-full"
                              >
                                {loading ? "Enviando..." : "Solicitar reserva"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mis solicitudes */}
          <div className="space-y-4 mt-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Mis solicitudes de viaje ({myTrips.length})</h3>
              <button 
                onClick={loadMyTrips} 
                className="text-blue-600 underline text-sm hover:text-blue-800"
              >
                Actualizar
              </button>
            </div>
            
            {myTrips.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
                <p className="text-gray-500">Aún no has solicitado ningún viaje.</p>
                <p className="text-gray-400 text-sm mt-2">Busca viajes disponibles arriba para comenzar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myTrips.map(trip => {
                  const status = trip.myBookingStatus;
                  const statusLabels = {
                    pending: { text: "Pendiente", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
                    accepted: { text: "Aceptado", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
                    rejected: { text: "Rechazado", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" }
                  };
                  const statusInfo = statusLabels[status] || statusLabels.pending;
                  
                  return (
                    <div key={trip._id} className={`bg-white rounded-2xl p-6 border-2 ${statusInfo.border} shadow`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-lg mb-2">{trip.from} → {trip.to}</div>
                          {trip.driver && (
                            <div className="text-sm text-gray-600 mb-1">
                              Conductor: {trip.driver.nombre}
                            </div>
                          )}
                          <div className="text-sm text-gray-600 mb-1">
                            📅 {new Date(trip.departureTime).toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-sm text-gray-600">
                            🕐 {new Date(trip.departureTime).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-2xl text-[#2A609E] mb-1">
                            ${trip.price}
                          </div>
                          <div className={`text-sm font-semibold ${statusInfo.color} mb-2`}>
                            {status === "pending" && "⏳"}
                            {status === "accepted" && "✓"}
                            {status === "rejected" && "✗"}
                            {" "}{statusInfo.text}
                          </div>
                          {(() => {
                            const myBooking = trip.bookings?.find(b => 
                              b.passengerId && (b.passengerId._id?.toString() === userId || b.passengerId.toString() === userId)
                            );
                            const seats = myBooking?.seats || 1;
                            if (seats > 1) {
                              return (
                                <div className="text-xs text-gray-500 mb-1">
                                  {seats} asientos {status === "accepted" ? "confirmados" : "solicitados"}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {status === "accepted" && (
                            <div className="space-y-2">
                              <div className="text-xs text-gray-500">
                                ¡Tu solicitud fue aceptada!
                              </div>
                              <button
                                onClick={() => handleCancelBooking(trip._id)}
                                disabled={loading}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancelar reserva
                              </button>
                            </div>
                          )}
                          {status === "pending" && (
                            <button
                              onClick={() => handleCancelBooking(trip._id)}
                              disabled={loading}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                              Cancelar solicitud
                            </button>
                          )}
                          {status === "rejected" && (
                            <div className="text-xs text-gray-500">
                              El conductor rechazó tu solicitud
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
