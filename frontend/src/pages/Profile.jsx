import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_USER_URL } from "../config/api.js";

export default function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    idUniversitario: "",
    preferredRole: "pasajero"
  });

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_USER_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar perfil");
      }

      setUserData(data);
      setFormData({
        nombre: data.nombre || "",
        email: data.email || "",
        telefono: data.telefono || "",
        idUniversitario: data.idUniversitario || "",
        preferredRole: data.preferredRole || "pasajero"
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${API_USER_URL}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar perfil");
      }

      setSuccess("Perfil actualizado exitosamente ✅");
      setUserData(data.user);
      
      // Actualizar nombre en localStorage si cambió
      if (data.user.nombre) {
        localStorage.setItem("name", data.user.nombre);
      }

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A609E] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              W
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="text-red-600 hover:text-red-800 text-sm underline"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Mensajes */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Información del perfil */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Información Personal</h2>
          
          <div className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2A609E] outline-none"
                placeholder="Tu nombre completo"
              />
            </div>

            {/* Email (solo lectura) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">El email no se puede cambiar</p>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2A609E] outline-none"
                placeholder="Tu número de teléfono"
              />
            </div>

            {/* ID Universitario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Universitario
              </label>
              <input
                type="text"
                value={formData.idUniversitario}
                onChange={(e) => setFormData({ ...formData, idUniversitario: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2A609E] outline-none"
                placeholder="Tu ID universitario"
              />
            </div>

            {/* Rol preferido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol preferido
              </label>
              <select
                value={formData.preferredRole}
                onChange={(e) => setFormData({ ...formData, preferredRole: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2A609E] outline-none bg-white"
              >
                <option value="pasajero">Pasajero</option>
                <option value="conductor">Conductor</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Este será tu rol por defecto al iniciar sesión</p>
            </div>
          </div>

          {/* Botón guardar */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !formData.nombre.trim()}
              className="bg-[#2A609E] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#224f84] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* Información de roles */}
        {userData && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Roles Completados</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-xl border-2 ${userData.rolesCompleted?.pasajero ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Pasajero</h3>
                    <p className="text-sm text-gray-600">
                      {userData.rolesCompleted?.pasajero ? "✓ Completado" : "Pendiente"}
                    </p>
                  </div>
                  {userData.rolesCompleted?.pasajero ? (
                    <span className="text-green-600 text-2xl">✓</span>
                  ) : (
                    <button
                      onClick={() => navigate("/register-photo", { state: { role: "pasajero" } })}
                      className="text-[#2A609E] text-sm underline"
                    >
                      Completar
                    </button>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 ${userData.rolesCompleted?.conductor ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Conductor</h3>
                    <p className="text-sm text-gray-600">
                      {userData.rolesCompleted?.conductor ? "✓ Completado" : "Pendiente"}
                    </p>
                  </div>
                  {userData.rolesCompleted?.conductor ? (
                    <span className="text-green-600 text-2xl">✓</span>
                  ) : (
                    <button
                      onClick={() => navigate("/register-driver-vehicle", { state: { role: "conductor" } })}
                      className="text-[#2A609E] text-sm underline"
                    >
                      Completar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información del vehículo (solo si es conductor) */}
        {userData?.rolesCompleted?.conductor && userData?.vehicle && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Información del Vehículo</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                <div className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-700">
                  {userData.vehicle.marca || "No especificada"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                <div className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-700">
                  {userData.vehicle.modelo || "No especificado"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                <div className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-700">
                  {userData.vehicle.anio || "No especificado"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Placa</label>
                <div className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-700">
                  {userData.vehicle.placa || "No especificada"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

