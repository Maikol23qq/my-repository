import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import passengerImg from "../assets/passenger.png";
import driverImg from "../assets/driver.png";
import { API_AUTH_URL } from "../config/api.js";

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState("pasajero");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [idUniversitario, setIdUniversitario] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegister) {
        // REGISTRO - Solo guardar datos temporalmente, NO crear usuario aún
        // Validaciones básicas
        const isValidEmail = (v) => /.+@.+\..+/.test(v);
        const isValidPassword = (v) => typeof v === 'string' && v.length >= 6;

        if (!isValidEmail(email)) {
          setError("Email inválido");
          return;
        }
        if (!isValidPassword(password)) {
          setError("La contraseña debe tener al menos 6 caracteres");
          return;
        }
        if (!nombre || !nombre.trim()) {
          setError("El nombre es obligatorio");
          return;
        }

        // Guardar datos temporalmente en localStorage
        const registrationData = {
          nombre: nombre.trim(),
          email: email.trim(),
          password: password,
          telefono: telefono.trim() || "",
          idUniversitario: idUniversitario.trim() || "",
          role: role || "pasajero"
        };

        localStorage.setItem("pendingRegistration", JSON.stringify(registrationData));

        // Redirigir al siguiente paso según el rol
        const nextRoute = role === "conductor" ? "/register-photo" : "/register-photo";
        navigate(nextRoute, { state: { role: role, step: 1 } });

        // Limpiar campos
        setEmail("");
        setPassword("");
        setNombre("");
        setTelefono("");
        setIdUniversitario("");
      } else {
        // LOGIN - CON DEBUG
        console.log("🔐 Intentando login con:", { email, password });
        
        const res = await fetch(`${API_AUTH_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("📨 Respuesta completa del login:", data);
        
        if (!res.ok) {
          // Manejar error 429 (Too Many Requests)
          if (res.status === 429) {
            const retryAfter = data.retryAfter || 60;
            throw new Error(data.message || data.error || `Demasiados intentos. Por favor espera ${retryAfter} segundos antes de intentar nuevamente.`);
          }
          // Si no tiene ningún rol completado, mostrar error y NO redirigir
          if (res.status === 403 && data?.mustCompleteRegistration) {
            throw new Error(data.error || "Debes completar el registro primero. Completa el onboarding antes de iniciar sesión.");
          }
          // Si necesita onboarding pero viene del registro, redirigir
          if (res.status === 403 && data?.needOnboarding && !data?.mustCompleteRegistration) {
            const route = data.nextRoute || "/register-photo";
            const nextRole = data.preferredRole || "pasajero";
            navigate(route, { state: { role: nextRole } });
            return;
          }
          throw new Error(data.message || data.error || "Error al iniciar sesión");
        }

        // Guardar token y datos del usuario
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("name", data.nombre);
        if (data.userId) {
          localStorage.setItem("userId", data.userId.toString());
        }

        console.log("🎯 Rol recibido del backend:", data.role);
        console.log("📍 Redirigiendo a:", data.role === "conductor" ? "/dashboard-conductor" : "/dashboard-pasajero");

        // Redirigir según rol - SIEMPRE al dashboard correspondiente
        if (data.role === "conductor") {
          navigate("/dashboard-conductor");
        } else {
          navigate("/dashboard-pasajero");
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2A609E] px-8 py-16">
      {/* Tarjeta principal */}
      <div className="bg-[#FAF2F2] shadow-2xl rounded-[20px] p-10 w-[1000px] transition-all">
        <Link
          to="/"
          className="text-[#2A609E] text-sm font-semibold mb-4 inline-block hover:underline"
        >
          ← Volver
        </Link>

        <h1 className="text-3xl font-bold text-center text-gray-900">Wheels</h1>
        <p className="text-center text-gray-600 text-sm mb-6">
          Ingresa a tu cuenta o crea una nueva
        </p>

        {/* Botones toggle */}
        <div className="flex bg-gray-200 rounded-full mb-6 overflow-hidden">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-sm font-semibold transition ${
              !isRegister ? "bg-white text-gray-900 shadow" : "text-gray-500"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-sm font-semibold transition ${
              isRegister ? "bg-white text-gray-900 shadow" : "text-gray-500"
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-600 text-center text-sm mb-4 font-semibold">
            {error}
          </p>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="bg-gray-100 p-3 rounded-md text-sm focus:ring-2 focus:ring-[#2A609E] outline-none"
                autoComplete="name"
                required
              />
              <input
                type="text"
                placeholder="ID universitario"
                value={idUniversitario}
                onChange={(e) => setIdUniversitario(e.target.value)}
                className="bg-gray-100 p-3 rounded-md text-sm focus:ring-2 focus:ring-[#2A609E] outline-none"
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="bg-gray-100 p-3 rounded-md text-sm focus:ring-2 focus:ring-[#2A609E] outline-none"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-100 p-3 rounded-md text-sm focus:ring-2 focus:ring-[#2A609E] outline-none"
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-100 p-3 rounded-md text-sm focus:ring-2 focus:ring-[#2A609E] outline-none"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
          />

          {/* Selector de rol */}
          <div>
            <p className="text-sm mb-2 text-gray-700">Soy...</p>
            <div className="flex gap-3 justify-between">
              <button
                type="button"
                onClick={() => setRole("pasajero")}
                className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 p-3 transition ${
                  role === "pasajero"
                    ? "border-[#2A609E] bg-white"
                    : "border-gray-300 bg-gray-100"
                }`}
              >
                <img
                  src={passengerImg}
                  alt="Pasajero"
                  className="w-14 h-14 object-contain mb-1"
                />
                <span className="text-xs font-semibold text-gray-700">
                  PASAJERO
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole("conductor")}
                className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 p-3 transition ${
                  role === "conductor"
                    ? "border-[#2A609E] bg-white"
                    : "border-gray-300 bg-gray-100"
                }`}
              >
                <img
                  src={driverImg}
                  alt="Conductor"
                  className="w-14 h-14 object-contain mb-1"
                />
                <span className="text-xs font-semibold text-gray-700">
                  CONDUCTOR
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#2A609E] text-white font-semibold py-2 rounded-full mt-4 hover:bg-[#224f84] transition"
          >
            {isRegister ? "Registrarse" : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}