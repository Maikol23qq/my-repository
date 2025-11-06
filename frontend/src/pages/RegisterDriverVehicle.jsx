import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { API_ONBOARDING_URL } from "../config/api.js";

export default function RegisterDriverVehicle() {
  const navigate = useNavigate();
  const [photoVehiculo, setPhotoVehiculo] = useState(null);
  const [photoVehiculoBase64, setPhotoVehiculoBase64] = useState(null);
  const [photoPlaca, setPhotoPlaca] = useState(null);
  const [photoPlacaBase64, setPhotoPlacaBase64] = useState(null);
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [placa, setPlaca] = useState("");

  const optimizeImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
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
        callback(base64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoVehiculoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      optimizeImage(file, (base64) => {
        setPhotoVehiculoBase64(base64);
        setPhotoVehiculo(base64); // Usar la imagen optimizada para preview
      });
    }
  };

  const handlePhotoPlacaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      optimizeImage(file, (base64) => {
        setPhotoPlacaBase64(base64);
        setPhotoPlaca(base64); // Usar la imagen optimizada para preview
      });
    }
  };

  const handleFinish = async () => {
    // Validaciones
    if (!marca.trim() || !modelo.trim() || !anio || !placa.trim()) {
      alert("Por favor completa todos los campos del vehículo");
      return;
    }
    
    const onboardingToken = localStorage.getItem("onboardingToken");
    if (!onboardingToken) {
      alert("No se encontró token de onboarding. Inicia sesión nuevamente.");
      navigate("/auth");
      return;
    }
    try {
      const res = await fetch(`${API_ONBOARDING_URL}/conductor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${onboardingToken}`,
        },
        body: JSON.stringify({ 
          marca, 
          modelo, 
          anio, 
          placa,
          vehiclePhotoUrl: photoVehiculoBase64 || ""
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al completar onboarding");
      
      // Si viene del dashboard, volver al dashboard después de completar
      const fromDashboard = sessionStorage.getItem('fromDashboard') === 'true';
      
      if (fromDashboard) {
        // Actualizar token y rol si viene en la respuesta
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        localStorage.setItem("role", "conductor");
        sessionStorage.removeItem('fromDashboard');
        alert("¡Onboarding de conductor completado!");
        navigate("/dashboard-conductor");
      } else {
        alert("¡Onboarding de conductor completado! Ahora inicia sesión.");
        navigate("/auth");
      }
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2A609E] px-8 py-16 text-center">
      <div className="bg-[#FAF2F2] shadow-2xl rounded-[20px] p-10 w-[480px] flex flex-col items-center text-gray-700">
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

        {/* Paso */}
        <p className="text-sm text-gray-500 mb-2">Paso 2 de 2</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-[#2A609E] h-2 rounded-full transition-all duration-700"
            style={{ width: "100%" }}
          ></div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Registra tu vehículo
        </h2>
        <p className="text-gray-600 mb-8 text-sm max-w-[340px]">
          Para garantizar la seguridad de los pasajeros, necesitamos la información
          completa de tu vehículo.
        </p>

        {/* Campos del formulario */}
        <div className="w-full space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium mb-1">
              Marca del vehículo *
            </label>
            <input
              type="text"
              placeholder="Ingrese la marca del vehículo"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Modelo *</label>
            <input
              type="text"
              placeholder="Ingrese el modelo del vehículo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Año *</label>
              <select
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-[#2A609E] outline-none"
              >
                <option value="">Seleccionar</option>
                {Array.from({ length: 25 }, (_, i) => 2025 - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1"># Placa *</label>
              <input
                type="text"
                placeholder="Ingrese la placa"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none"
              />
            </div>
          </div>
        </div>

        {/* 🔹 Foto del vehículo */}
        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-gray-700 mb-2">Foto del vehículo</p>
          <label className="relative cursor-pointer flex flex-col items-center justify-center w-40 h-40 mx-auto border-4 border-dashed border-[#2A609E] rounded-full bg-gray-100 hover:bg-gray-200 transition overflow-hidden">
            {photoVehiculo ? (
              <img
                src={photoVehiculo}
                alt="Vehículo"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 text-center px-3">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Subir foto</span>
                <span className="text-[10px] font-medium leading-tight">
                  Foto clara del vehículo
                </span>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoVehiculoUpload} />
          </label>
        </div>

        {/* 🔹 Foto de la placa */}
        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-gray-700 mb-2">Foto de la placa</p>
          <label className="relative cursor-pointer flex flex-col items-center justify-center w-40 h-40 mx-auto border-4 border-dashed border-[#2A609E] rounded-full bg-gray-100 hover:bg-gray-200 transition overflow-hidden">
            {photoPlaca ? (
              <img
                src={photoPlaca}
                alt="Placa"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 text-center px-3">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Subir foto</span>
                <span className="text-[10px] font-medium leading-tight">
                  Foto clara de la placa
                </span>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoPlacaUpload} />
          </label>
        </div>

        {/* Botón final */}
        <button
          onClick={handleFinish}
          disabled={!marca || !modelo || !anio || !placa || !photoVehiculo || !photoPlaca}
          className={`mt-8 w-full py-2 rounded-full font-semibold transition ${
            marca && modelo && anio && placa && photoVehiculo && photoPlaca
              ? "bg-[#2A609E] text-white hover:bg-[#224f84]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Finalizar registro
        </button>
      </div>
    </div>
  );
}
