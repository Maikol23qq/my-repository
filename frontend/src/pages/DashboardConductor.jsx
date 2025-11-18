import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_USER_URL, API_TRIPS_URL, API_CHAT_URL } from "../config/api.js";
import Chat from "../components/Chat.jsx";

export default function DashboardConductor() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem("name") || "Usuario";
  
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [route, setRoute] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [seats, setSeats] = useState(1);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripRequests, setTripRequests] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [chatTrip, setChatTrip] = useState(null);
  const [chatOtherUser, setChatOtherUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editForm, setEditForm] = useState({
    from: "",
    to: "",
    route: "",
    date: "",
    time: "",
    price: "",
    seats: 1
  });

  // Cargar mis viajes y datos del usuario al iniciar
  useEffect(() => {
    loadMyTrips();
    loadUserData();
  }, []);

  async function loadUserData() {
    if (!token) return;
    try {
      const res = await fetch(`${API_USER_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserData(data);
      }
    } catch (e) {
      console.error("Error al cargar datos del usuario:", e);
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
        // Guardar datos del usuario para prellenar formularios
        if (data.userData) {
          // Guardar datos en localStorage como pendingRegistration para que las páginas de registro los usen
          // No incluir password ya que el usuario ya está autenticado
          const registrationData = {
            ...data.userData,
            role: role,
            fromExistingUser: true // Flag para indicar que viene de un usuario existente
          };
          localStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
        }
        // Guardar en sessionStorage para que las páginas de onboarding sepan que viene del dashboard
        sessionStorage.setItem('fromDashboard', 'true');
        navigate(data.nextRoute || (role === 'conductor' ? '/register-driver-vehicle' : '/register-photo'), {
          state: { role: role, fromDashboard: true, userData: data.userData }
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

  async function handleDeleteTrip(tripId) {
    if (!token) return;
    
    if (!confirm('¿Estás seguro de eliminar este viaje? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`${API_TRIPS_URL}/${tripId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar viaje');
      }
      
      alert('✅ Viaje eliminado exitosamente');
      await loadMyTrips();
      // Cerrar modal si estaba abierto
      if (selectedTrip === tripId) {
        setTripRequests(null);
        setSelectedTrip(null);
      }
      if (editingTrip === tripId) {
        setEditingTrip(null);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openEditTrip(trip) {
    const departureDate = new Date(trip.departureTime);
    const dateStr = departureDate.toISOString().split('T')[0];
    const timeStr = departureDate.toTimeString().slice(0, 5);
    
    setEditForm({
      from: trip.from,
      to: trip.to,
      route: trip.route || "",
      date: dateStr,
      time: timeStr,
      price: trip.price.toString(),
      seats: trip.seatsTotal
    });
    setEditingTrip(trip._id);
  }

  async function handleUpdateTrip() {
    if (!token) return;
    
    if (!editForm.from.trim() || !editForm.to.trim()) {
      alert("Por favor completa los campos 'Desde' y 'Hasta'");
      return;
    }
    if (!editForm.date || !editForm.time) {
      alert("Por favor selecciona fecha y hora");
      return;
    }
    if (!editForm.price || Number(editForm.price) <= 0) {
      alert("Por favor ingresa un precio válido");
      return;
    }
    if (!editForm.seats || Number(editForm.seats) < 1) {
      alert("Por favor ingresa al menos 1 asiento");
      return;
    }

    const departureTime = new Date(`${editForm.date}T${editForm.time}:00`);
    if (departureTime < new Date()) {
      alert("No puedes crear viajes en el pasado");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_TRIPS_URL}/${editingTrip}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          from: editForm.from.trim(),
          to: editForm.to.trim(),
          route: editForm.route.trim(),
          departureTime: departureTime.toISOString(),
          price: Number(editForm.price),
          seatsTotal: Number(editForm.seats)
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar viaje');
      }
      
      alert('✅ Viaje actualizado exitosamente');
      setEditingTrip(null);
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
    if (userData?.vehicles && userData.vehicles.length > 0 && !selectedVehicleId) {
      setError("Por favor selecciona un vehículo");
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
          route: route.trim(),
          departureTime: departureTime.toISOString(), 
          price: Number(price), 
          seatsTotal: Number(seats),
          vehicleId: selectedVehicleId || null
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear el viaje');
      }
      
      // Limpiar formulario
      setFrom("");
      setTo("");
      setRoute("");
      setDate("");
      setTime("");
      setPrice("");
      setSeats(1);
      setSelectedVehicleId("");
      
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
  const totalTrips = myTrips.length; // Total de viajes creados (incluye todos)
  
  // Pasajeros reservados: contar todos los pasajeros con booking aceptado en viajes actuales
  const reservedPassengers = myTrips.reduce((sum, trip) => {
    const acceptedBookings = trip.bookings?.filter(b => b.status === "accepted") || [];
    return sum + acceptedBookings.length;
  }, 0);
  
  // Pasajeros transportados: solo de viajes completados (departureTime en el pasado)
  const now = new Date();
  const completedTrips = myTrips.filter(trip => new Date(trip.departureTime) < now);
  const transportedPassengers = completedTrips.reduce((sum, trip) => {
    const acceptedBookings = trip.bookings?.filter(b => b.status === "accepted") || [];
    return sum + acceptedBookings.length;
  }, 0);

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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ruta (Opcional)</label>
              <input 
                value={route} 
                onChange={e=>setRoute(e.target.value)} 
                placeholder="Ej: Parada 1, Parada 2, Parada 3..." 
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
              />
              <p className="text-xs text-gray-500 mt-1">Indica las paradas o lugares por donde pasarás</p>
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
            {userData?.vehicles && userData.vehicles.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo *</label>
                <select
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none bg-white"
                  required
                >
                  <option value="">Selecciona un vehículo</option>
                  {userData.vehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.marca} {vehicle.modelo} ({vehicle.placa}) - {vehicle.anio}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
            <div className="text-gray-600">Viajes creados</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 mb-2">{reservedPassengers}</div>
            <div className="text-gray-600">Pasajeros reservados</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 mb-2">{transportedPassengers}</div>
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
                const totalAcceptedSeats = acceptedBookings.reduce((sum, b) => sum + (b.seats || 1), 0);
                const passengersCount = acceptedBookings.length;
                const availableSeats = trip.seatsTotal - totalAcceptedSeats;
                
                return (
                    <div key={trip._id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {userData?.photoUrl && (
                            <img 
                              src={userData.photoUrl} 
                              alt="Tu foto"
                              className="w-10 h-10 rounded-full object-cover border-2 border-[#2A609E]"
                            />
                          )}
                          <div className="font-semibold text-lg">{trip.from} → {trip.to}</div>
                        </div>
                        {userData?.vehicle?.photoUrl && (
                          <div className="mb-2">
                            <img 
                              src={userData.vehicle.photoUrl} 
                              alt="Vehículo"
                              className="w-20 h-14 rounded object-cover border border-gray-300"
                            />
                          </div>
                        )}
                        {trip.route && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">📍 Ruta: </span>
                            <span>{trip.route}</span>
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
                        <div className="flex flex-col gap-2 mt-2">
                          <button
                            onClick={() => loadTripRequests(trip._id)}
                            className="bg-[#2A609E] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#224f84] transition"
                          >
                            Ver solicitudes ({pendingBookings.length})
                          </button>
                          {acceptedBookings.length > 0 && (
                            <button
                              onClick={() => {
                                const firstAccepted = acceptedBookings[0];
                                const passenger = firstAccepted.passengerId;
                                if (passenger) {
                                  setChatOtherUser(passenger.nombre || 'Pasajero');
                                  setChatTrip(trip._id);
                                }
                              }}
                              className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-700 transition"
                            >
                              💬 Chat
                            </button>
                          )}
                          <button
                            onClick={() => openEditTrip(trip)}
                            disabled={loading}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Editar viaje
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip._id)}
                            disabled={loading}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Eliminar viaje
                          </button>
                        </div>
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
                            <div className="flex items-start gap-3">
                              {passenger?.photoUrl && (
                                <img 
                                  src={passenger.photoUrl} 
                                  alt={passenger.nombre}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-orange-300"
                                />
                              )}
                              <div>
                                <div className="font-semibold">{passenger?.nombre || 'Usuario'}</div>
                                <div className="text-sm text-gray-600">{passenger?.email}</div>
                                {passenger?.telefono && (
                                  <div className="text-sm text-gray-600">📞 {passenger.telefono}</div>
                                )}
                                {passenger?.idUniversitario && (
                                  <div className="text-sm text-gray-600">🎓 ID: {passenger.idUniversitario}</div>
                                )}
                                <div className="text-sm font-semibold text-[#2A609E] mt-1">
                                  {request.seats || 1} asiento{(request.seats || 1) > 1 ? 's' : ''} solicitado{(request.seats || 1) > 1 ? 's' : ''}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Solicitado: {new Date(request.requestedAt).toLocaleString('es-ES')}
                                </div>
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
                          <div className="flex items-center gap-2">
                            {passenger?.photoUrl && (
                              <img 
                                src={passenger.photoUrl} 
                                alt={passenger.nombre}
                                className="w-10 h-10 rounded-full object-cover border-2 border-green-300"
                              />
                            )}
                            <div>
                              <div className="font-semibold">{passenger?.nombre || 'Usuario'}</div>
                              <div className="text-sm text-gray-600">{passenger?.email}</div>
                              {passenger?.telefono && (
                                <div className="text-sm text-gray-600">📞 {passenger.telefono}</div>
                              )}
                              <div className="text-sm font-semibold text-green-700 mt-1">
                                {request.seats || 1} asiento{(request.seats || 1) > 1 ? 's' : ''} confirmado{(request.seats || 1) > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
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

        {/* Modal de edición de viaje */}
        {editingTrip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Editar viaje</h3>
                <button
                  onClick={() => setEditingTrip(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input 
                      value={editForm.from} 
                      onChange={e => setEditForm({ ...editForm, from: e.target.value })} 
                      placeholder="Punto de inicio" 
                      className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input 
                      value={editForm.to} 
                      onChange={e => setEditForm({ ...editForm, to: e.target.value })} 
                      placeholder="Punto de llegada" 
                      className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ruta (Opcional)</label>
                    <input 
                      value={editForm.route} 
                      onChange={e => setEditForm({ ...editForm, route: e.target.value })} 
                      placeholder="Ej: Parada 1, Parada 2, Parada 3..." 
                      className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Indica las paradas o lugares por donde pasarás</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input 
                      type="date" 
                      value={editForm.date} 
                      onChange={e => setEditForm({ ...editForm, date: e.target.value })} 
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                    <input 
                      type="time" 
                      value={editForm.time} 
                      onChange={e => setEditForm({ ...editForm, time: e.target.value })} 
                      className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                    <input 
                      type="number" 
                      value={editForm.price} 
                      onChange={e => setEditForm({ ...editForm, price: e.target.value })} 
                      placeholder="0" 
                      min="0"
                      className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asientos totales</label>
                    <input 
                      type="number" 
                      value={editForm.seats} 
                      onChange={e => setEditForm({ ...editForm, seats: e.target.value })} 
                      placeholder="1" 
                      min="1"
                      className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none" 
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={() => setEditingTrip(null)}
                    className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateTrip}
                    disabled={loading}
                    className="bg-[#2A609E] text-white px-6 py-2 rounded-xl hover:bg-[#224f84] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat */}
        {chatTrip && chatOtherUser && (
          <Chat
            tripId={chatTrip}
            otherUserName={chatOtherUser}
            onClose={() => {
              setChatTrip(null);
              setChatOtherUser(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
