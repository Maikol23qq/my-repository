import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";

export default function RegisterPhoto() {
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Rol recibido desde Auth.jsx (por defecto pasajero)
  const role = location.state?.role || "pasajero";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(URL.createObjectURL(file));
    }
  };

  const handleContinue = () => {
    if (role === "conductor") {
      // Si es conductor, va al registro del vehículo
      navigate("/register-driver-vehicle");
    } else {
      // Si es pasajero, termina el registro
      alert("¡Registro completado con éxito! 🎉");
      navigate("/");
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
          {role === "conductor" ? "Paso 1 de 2" : "Paso 2 de 2"}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-[#2A609E] h-2 rounded-full transition-all duration-700"
            style={{ width: role === "conductor" ? "50%" : "100%" }}
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
