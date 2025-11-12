import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { API_ONBOARDING_URL, API_AUTH_URL, API_USER_URL } from "../config/api.js";

export default function RegisterPhoto() {
  const [photo, setPhoto] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener datos de registro pendiente o desde el estado
  const registrationData = JSON.parse(localStorage.getItem("pendingRegistration") || "null");
  const role = location.state?.role || registrationData?.role || "pasajero";
  const step = location.state?.step || 1;
  const fromDashboard = location.state?.fromDashboard || sessionStorage.getItem('fromDashboard') === 'true';
  const fromExistingUser = registrationData?.fromExistingUser || false;

  // Prellenar foto si viene de usuario existente y tiene foto
  useEffect(() => {
    if (fromExistingUser && registrationData?.photoUrl && !photo) {
      setPhoto(registrationData.photoUrl);
      setPhotoBase64(registrationData.photoUrl);
    }
  }, [fromExistingUser, registrationData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Optimizar imagen antes de convertir a base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Crear canvas para redimensionar
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a base64 con calidad reducida
          const base64 = canvas.toDataURL('image/jpeg', 0.7);
          setPhotoBase64(base64);
          setPhoto(base64); // Usar la imagen optimizada para preview
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = async () => {
    if (role === "conductor") {
      // Guardar foto temporalmente y continuar al siguiente paso
      if (photoBase64) {
        const tempData = { ...registrationData, photoUrl: photoBase64 };
        localStorage.setItem("pendingRegistration", JSON.stringify(tempData));
      }
      navigate("/register-driver-vehicle", { state: { role: role, step: 2 } });
      return;
    }

    // Para pasajeros, aquí se crea el usuario completo
    if (!registrationData) {
      alert("No se encontraron datos de registro. Por favor, comienza de nuevo.");
      localStorage.removeItem("pendingRegistration");
      navigate("/auth");
      return;
    }

    if (!photoBase64) {
      alert("Por favor sube tu foto de perfil");
      return;
    }

    try {
      // Si viene del dashboard (usuario existente), usar endpoint diferente que no requiere password
      if (fromExistingUser) {
        const token = localStorage.getItem('token');
        if (!token) {
          alert("Sesión expirada. Por favor inicia sesión nuevamente.");
          navigate("/auth");
          return;
        }

        // Actualizar foto de perfil usando el endpoint de usuario autenticado
        const res = await fetch(`${API_USER_URL}/me`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            photoUrl: photoBase64
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Error al actualizar foto de perfil");
        }

        // Completar el rol pasajero usando el endpoint de onboarding
        const onboardingRes = await fetch(`${API_ONBOARDING_URL}/pasajero`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            photoUrl: photoBase64
          })
        });

        const onboardingData = await onboardingRes.json();
        if (!onboardingRes.ok) {
          throw new Error(onboardingData.error || "Error al completar registro de pasajero");
        }

        // Limpiar datos temporales
        localStorage.removeItem("pendingRegistration");
        sessionStorage.removeItem('fromDashboard');

        // Actualizar token si viene en la respuesta
        if (onboardingData.token) {
          localStorage.setItem("token", onboardingData.token);
        }
        localStorage.setItem("role", "pasajero");
        if (onboardingData.nombre) {
          localStorage.setItem("name", onboardingData.nombre);
        }

        alert("¡Registro de pasajero completado exitosamente!");
        navigate("/dashboard-pasajero");
        return;
      }

      // Si es un nuevo registro, usar el endpoint normal
      const res = await fetch(`${API_AUTH_URL}/register-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registrationData,
          photoUrl: photoBase64
        })
      });

      const data = await res.json();
      if (!res.ok) {
        // Manejar errores específicos
        if (res.status === 401) {
          throw new Error(data.error || "Contraseña incorrecta. Si ya tienes una cuenta, usa la contraseña correcta.");
        }
        if (res.status === 400) {
          throw new Error(data.error || "Datos inválidos. Verifica tu información.");
        }
        if (res.status === 503) {
          throw new Error("Servicio no disponible. Por favor intenta nuevamente en unos momentos.");
        }
        throw new Error(data.error || data.message || "Error al completar registro. Por favor intenta nuevamente.");
      }

      // Limpiar datos temporales
      localStorage.removeItem("pendingRegistration");

      // Guardar token y datos del usuario
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role || "pasajero");
        localStorage.setItem("name", data.nombre || registrationData.nombre);
        if (data.userId) {
          localStorage.setItem("userId", data.userId.toString());
        }
      }

      // Mostrar mensaje de éxito
      const successMessage = data.message || "¡Registro completado exitosamente!";
      alert(successMessage);

      // Si viene del dashboard, volver al dashboard
      const fromDashboard = location.state?.fromDashboard || sessionStorage.getItem('fromDashboard') === 'true';
      if (fromDashboard) {
        sessionStorage.removeItem('fromDashboard');
      }
      
      // Redirigir directamente al dashboard después del registro exitoso
      navigate("/dashboard-pasajero");
    } catch (e) {
      console.error("Error al completar registro:", e);
      alert(e.message || "Error al completar el registro. Por favor intenta nuevamente.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2A609E] px-8 py-16 text-center">
      <div className="bg-[#FAF2F2] shadow-2xl rounded-[20px] p-10 w-[480px] flex flex-col items-center">
        {/* Botón volver */}
        <button
          onClick={() => navigate(-1)}
          className="self-start flex items-center text-[#2A609E] font-semibold text-sm mb-4 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </button>

        {/* Encabezado */}
        <h1 className="text-3xl font-bold text-center text-gray-900">Wheels</h1>
        <p className="text-center text-gray-600 text-sm mb-6">
          Ingresa a tu cuenta o crea una nueva
        </p>

        {/* Paso dinámico */}
        <p className="text-sm text-gray-500 mb-2">
          {role === "conductor" ? "Paso 2 de 3" : "Paso 2 de 2"}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-[#2A609E] h-2 rounded-full transition-all duration-700"
            style={{ width: role === "conductor" ? "66%" : "100%" }}
          ></div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sube tu foto de perfil
        </h2>
        <p className="text-gray-600 mb-8 text-sm max-w-[320px]">
          Por seguridad, necesitamos una foto clara de tu rostro para verificar tu identidad.
        </p>

        {/* Zona de carga */}
        <label className="relative cursor-pointer flex flex-col items-center justify-center w-40 h-40 rounded-full border-4 border-dashed border-[#2A609E] bg-gray-100 hover:bg-gray-200 transition overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt="Previsualización"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 px-4 text-center">
              <Upload className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Subir foto</span>
              <span className="text-[10px] font-medium leading-tight">
                Asegúrate de que se vea tu rostro claramente
              </span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Botón continuar */}
        <button
          onClick={handleContinue}
          disabled={!photo}
          className={`mt-8 w-full py-2 rounded-full font-semibold transition ${
            photo
              ? "bg-[#2A609E] text-white hover:bg-[#224f84]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {role === "conductor" ? "Continuar" : "Finalizar registro"}
        </button>
      </div>
    </div>
  );
}
