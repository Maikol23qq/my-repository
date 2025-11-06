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

  // Obtener el nombre del usuario del localStorage
  const userName = localStorage.getItem("name") || "Usuario";
  const token = localStorage.getItem('token');

  // Cargar mis viajes reservados al iniciar
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

  async function bookTrip(id) {
    if (!token) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      navigate("/auth");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_TRIPS_URL}/${id}/book`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo reservar');
      }
      
      alert('✅ Reserva confirmada exitosamente');
      
      // Actualizar resultados y mis viajes
      setResults(results.map(trip => 
        trip._id === id 
          ? { ...trip, seatsAvailable: trip.seatsAvailable - 1, booked: true }
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

          {/* Resultados de búsqueda */}
          {results.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xl font-bold mb-4">Viajes disponibles ({results.length})</h3>
              <div className="space-y-4">
                {results.map(trip => (
                  <div key={trip._id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow hover:shadow-lg transition">
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
                        <button 
                          onClick={()=>bookTrip(trip._id)} 
                          disabled={trip.seatsAvailable <= 0 || trip.booked || loading}
                          className="bg-[#2A609E] text-white px-6 py-2 rounded-xl hover:bg-[#224f84] transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {trip.booked ? "Ya reservado" : loading ? "Reservando..." : "Reservar"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mis reservas */}
          <div className="space-y-4 mt-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Mis viajes reservados ({myTrips.length})</h3>
              <button 
                onClick={loadMyTrips} 
                className="text-blue-600 underline text-sm hover:text-blue-800"
              >
                Actualizar
              </button>
            </div>
            
            {myTrips.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
                <p className="text-gray-500">Aún no has reservado ningún viaje.</p>
                <p className="text-gray-400 text-sm mt-2">Busca viajes disponibles arriba para comenzar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myTrips.map(trip => (
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
                        <div className="text-sm text-gray-600">
                          Estado: <span className="text-green-600 font-semibold">Reservado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
