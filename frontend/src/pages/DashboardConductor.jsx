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
      if (!res.ok) throw new Error(data.error || 'No se pudo cambiar el rol');
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
                const passengersCount = trip.seatsTotal - trip.seatsAvailable;
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
                        <div className="text-sm">
                          <span className="text-gray-600">Pasajeros reservados: </span>
                          <span className="font-semibold text-[#2A609E]">{passengersCount}</span>
                          <span className="text-gray-400"> / {trip.seatsTotal}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold text-2xl text-[#2A609E] mb-1">
                          ${trip.price}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {trip.seatsAvailable > 0 ? (
                            <span className="text-green-600">✓ {trip.seatsAvailable} disponibles</span>
                          ) : (
                            <span className="text-red-600">✗ Lleno</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
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
      </div>
    </div>
  );
}
