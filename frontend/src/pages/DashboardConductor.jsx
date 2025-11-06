import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_USER_URL, API_TRIPS_URL } from "../config/api.js";

export default function DashboardConductor() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem("name") || "Usuario";
  
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [seats, setSeats] = useState(1);
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripRequests, setTripRequests] = useState(null);

  // Cargar mis viajes al iniciar
  useEffect(() => {
    loadMyTrips();
  }, []);

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
      window.location.href = role === 'pasajero' ? '/dashboard-pasajero' : '/dashboard-conductor';
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

  async function loadMyTrips() {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_TRIPS_URL}/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMyTrips(data.asDriver || []);
      }
    } catch (e) {
      console.error("Error al cargar viajes:", e);
    }
  }

  async function loadTripRequests(tripId) {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_TRIPS_URL}/${tripId}/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTripRequests(data);
        setSelectedTrip(tripId);
      }
    } catch (e) {
      console.error("Error al cargar solicitudes:", e);
      alert("Error al cargar solicitudes");
    }
  }

  async function handleAcceptRequest(tripId, passengerId) {
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_TRIPS_URL}/${tripId}/requests/${passengerId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al aceptar solicitud');
      }
      
      alert('✅ Solicitud aceptada');
      await loadTripRequests(tripId);
      await loadMyTrips();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRejectRequest(tripId, passengerId) {
    if (!token) return;
    
    if (!confirm('¿Estás seguro de rechazar esta solicitud?')) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`${API_TRIPS_URL}/${tripId}/requests/${passengerId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al rechazar solicitud');
      }
      
      alert('Solicitud rechazada');
      await loadTripRequests(tripId);
      await loadMyTrips();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createTrip() {
    // Validaciones
    if (!from.trim() || !to.trim()) {
      setError("Por favor completa los campos 'Desde' y 'Hasta'");
      return;
    }
    if (!date) {
      setError("Por favor selecciona una fecha");
      return;
    }
    if (!time) {
      setError("Por favor selecciona una hora");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Por favor ingresa un precio válido");
      return;
    }
    if (!seats || Number(seats) < 1) {
      setError("Por favor ingresa al menos 1 asiento");
      return;
    }

    // Validar que la fecha/hora no sea en el pasado
    const departureTime = new Date(`${date}T${time}:00`);
    if (departureTime < new Date()) {
      setError("No puedes crear viajes en el pasado");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${API_TRIPS_URL}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          from: from.trim(), 
          to: to.trim(), 
          departureTime: departureTime.toISOString(), 
          price: Number(price), 
          seatsTotal: Number(seats) 
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear el viaje');
      }
      
      // Limpiar formulario
      setFrom("");
      setTo("");
      setDate("");
      setTime("");
      setPrice("");
      setSeats(1);
      
      // Recargar viajes
      await loadMyTrips();
      
      alert('✅ Viaje creado exitosamente');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Calcular estadísticas
  const totalTrips = myTrips.length;
  const totalPassengers = myTrips.reduce((sum, trip) => {
    return sum + (trip.seatsTotal - trip.seatsAvailable);
  }, 0);
  const averageRating = 4.8; // Por ahora estático, se puede calcular después

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
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-1">
              conductor
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
                onClick={() => switchTo('pasajero')} 
                className="text-xs underline text-blue-600 hover:text-blue-800"
              >
                Cambiar a pasajero
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Crear viaje */}
        <div className="bg-white rounded-2xl p-6 shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Publicar nuevo viaje</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input 
                value={from} 
                onChange={e=>setFrom(e.target.value)} 
                placeholder="Punto de inicio" 
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input 
                value={to} 
                onChange={e=>setTo(e.target.value)} 
                placeholder="Punto de llegada" 
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input 
                type="date" 
                value={date} 
                onChange={e=>setDate(e.target.value)} 
                min={new Date().toISOString().split('T')[0]}
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input 
                type="time" 
                value={time} 
                onChange={e=>setTime(e.target.value)} 
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio (COP)</label>
              <input 
                type="number" 
                min="0" 
                value={price} 
                onChange={e=>setPrice(e.target.value)} 
                placeholder="Ej: 15000" 
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asientos disponibles</label>
              <input 
                type="number" 
                min="1" 
                max="10"
                value={seats} 
                onChange={e=>setSeats(e.target.value)} 
                placeholder="Ej: 4" 
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
              />
            </div>
          </div>
          <button 
            onClick={createTrip} 
            disabled={loading}
            className="mt-4 bg-[#2A609E] text-white px-6 py-2 rounded-xl hover:bg-[#224f84] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando..." : "Crear viaje"}
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 mb-2">{totalTrips}</div>
            <div className="text-gray-600">Viajes publicados</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 mb-2">{averageRating}</div>
            <div className="text-gray-600">Calificación promedio</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 mb-2">{totalPassengers}</div>
            <div className="text-gray-600">Pasajeros transportados</div>
          </div>
        </div>

        {/* Mis viajes */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Mis viajes publicados ({myTrips.length})</h3>
            <button 
              onClick={loadMyTrips} 
              className="text-blue-600 underline text-sm hover:text-blue-800"
            >
              Actualizar
            </button>
          </div>
          
          {myTrips.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <p className="text-gray-500">Aún no has publicado viajes.</p>
              <p className="text-gray-400 text-sm mt-2">Crea tu primer viaje usando el formulario de arriba.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myTrips.map(trip => {
                const acceptedBookings = trip.bookings?.filter(b => b.status === "accepted") || [];
                const pendingBookings = trip.bookings?.filter(b => b.status === "pending") || [];
                const passengersCount = acceptedBookings.length;
                const availableSeats = trip.seatsTotal - passengersCount;
                
                return (
                  <div key={trip._id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-lg mb-2">{trip.from} → {trip.to}</div>
                        <div className="text-sm text-gray-600 mb-1">
                          📅 {new Date(trip.departureTime).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          🕐 {new Date(trip.departureTime).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="text-sm mb-2">
                          <span className="text-gray-600">Pasajeros aceptados: </span>
                          <span className="font-semibold text-[#2A609E]">{passengersCount}</span>
                          <span className="text-gray-400"> / {trip.seatsTotal}</span>
                        </div>
                        {pendingBookings.length > 0 && (
                          <div className="text-sm mb-2">
                            <span className="text-orange-600 font-semibold">
                              ⏳ {pendingBookings.length} solicitud{pendingBookings.length > 1 ? 'es' : ''} pendiente{pendingBookings.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold text-2xl text-[#2A609E] mb-1">
                          ${trip.price}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {availableSeats > 0 ? (
                            <span className="text-green-600">✓ {availableSeats} disponibles</span>
                          ) : (
                            <span className="text-red-600">✗ Lleno</span>
                          )}
                        </div>
                        <button
                          onClick={() => loadTripRequests(trip._id)}
                          className="mt-2 bg-[#2A609E] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#224f84] transition"
                        >
                          Ver solicitudes ({pendingBookings.length})
                        </button>
                        <div className="text-xs text-gray-500 mt-2">
                          Creado: {new Date(trip.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de solicitudes */}
        {tripRequests && selectedTrip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Solicitudes de reserva</h3>
                <button
                  onClick={() => {
                    setTripRequests(null);
                    setSelectedTrip(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold">{tripRequests.trip.from} → {tripRequests.trip.to}</div>
                <div className="text-sm text-gray-600">
                  {new Date(tripRequests.trip.departureTime).toLocaleString('es-ES')}
                </div>
                <div className="text-sm">
                  Asientos disponibles: {tripRequests.trip.seatsAvailable} / {tripRequests.trip.seatsTotal}
                </div>
              </div>

              {/* Solicitudes pendientes */}
              {tripRequests.requests.pending.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-orange-600">⏳ Pendientes ({tripRequests.requests.pending.length})</h4>
                  <div className="space-y-3">
                    {tripRequests.requests.pending.map((request, idx) => {
                      const passenger = request.passengerId;
                      return (
                        <div key={idx} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold">{passenger?.nombre || 'Usuario'}</div>
                              <div className="text-sm text-gray-600">{passenger?.email}</div>
                              {passenger?.telefono && (
                                <div className="text-sm text-gray-600">📞 {passenger.telefono}</div>
                              )}
                              {passenger?.idUniversitario && (
                                <div className="text-sm text-gray-600">🎓 ID: {passenger.idUniversitario}</div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                Solicitado: {new Date(request.requestedAt).toLocaleString('es-ES')}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptRequest(selectedTrip, passenger._id)}
                                disabled={loading || tripRequests.trip.seatsAvailable <= 0}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => handleRejectRequest(selectedTrip, passenger._id)}
                                disabled={loading}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Rechazar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Solicitudes aceptadas */}
              {tripRequests.requests.accepted.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-green-600">✓ Aceptadas ({tripRequests.requests.accepted.length})</h4>
                  <div className="space-y-2">
                    {tripRequests.requests.accepted.map((request, idx) => {
                      const passenger = request.passengerId;
                      return (
                        <div key={idx} className="border border-green-200 bg-green-50 rounded-lg p-3">
                          <div className="font-semibold">{passenger?.nombre || 'Usuario'}</div>
                          <div className="text-sm text-gray-600">{passenger?.email}</div>
                          {passenger?.telefono && (
                            <div className="text-sm text-gray-600">📞 {passenger.telefono}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Solicitudes rechazadas */}
              {tripRequests.requests.rejected.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-red-600">✗ Rechazadas ({tripRequests.requests.rejected.length})</h4>
                  <div className="space-y-2">
                    {tripRequests.requests.rejected.map((request, idx) => {
                      const passenger = request.passengerId;
                      return (
                        <div key={idx} className="border border-red-200 bg-red-50 rounded-lg p-3">
                          <div className="font-semibold">{passenger?.nombre || 'Usuario'}</div>
                          <div className="text-sm text-gray-600">{passenger?.email}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tripRequests.requests.pending.length === 0 && 
               tripRequests.requests.accepted.length === 0 && 
               tripRequests.requests.rejected.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No hay solicitudes para este viaje
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
