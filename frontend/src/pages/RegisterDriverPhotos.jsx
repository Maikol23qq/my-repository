import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterDriverPhotos = () => {
  const navigate = useNavigate();
  const [driverPhoto, setDriverPhoto] = useState(null);
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [plate, setPlate] = useState("");

  // Subir foto del conductor
  const handleDriverPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setDriverPhoto(URL.createObjectURL(file));
  };

  // Subir foto del vehículo
  const handleVehiclePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setVehiclePhoto(URL.createObjectURL(file));
  };

  const handleContinue = () => {
    navigate("/home"); // puedes cambiar esta ruta según tu flujo
  };

  return (
    <div className="min-h-screen bg-[#386FA4] flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        {/* Foto del conductor */}
        <h2 className="text-2xl font-bold text-center text-[#386FA4] mb-6">
          Sube tu foto de perfil
        </h2>

        <div className="flex flex-col items-center mb-8">
          {driverPhoto ? (
            <img
              src={driverPhoto}
              alt="Foto del conductor"
              className="w-32 h-32 rounded-full object-cover border-4 border-[#386FA4] mb-4"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 border-2 border-[#386FA4] flex items-center justify-center mb-4 text-gray-500">
              Sin foto
            </div>
          )}
          <label className="bg-[#386FA4] text-white px-4 py-2 rounded-full cursor-pointer hover:bg-[#2f5982] transition">
            Subir foto
            <input
              type="file"
              accept="image/*"
              onChange={handleDriverPhotoChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Información del vehículo */}
        <h3 className="text-xl font-semibold text-[#386FA4] text-center mb-4">
          Información del vehículo
        </h3>

        <div className="flex flex-col items-center mb-6">
          {vehiclePhoto ? (
            <img
              src={vehiclePhoto}
              alt="Foto del vehículo"
              className="w-40 h-24 object-cover rounded-lg border-4 border-[#386FA4] mb-4"
            />
          ) : (
            <div className="w-40 h-24 bg-gray-200 border-2 border-[#386FA4] flex items-center justify-center mb-4 text-gray-500">
              Sin foto
            </div>
          )}
          <label className="bg-[#386FA4] text-white px-4 py-2 rounded-full cursor-pointer hover:bg-[#2f5982] transition">
            Subir foto de la placa
            <input
              type="file"
              accept="image/*"
              onChange={handleVehiclePhotoChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Campo para placa */}
        <div className="mb-6">
          <label className="block text-[#386FA4] font-medium mb-2">
            Placa del vehículo
          </label>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Ej: ABC123"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#386FA4] outline-none"
          />
        </div>

        {/* Botón continuar */}
        <button
          onClick={handleContinue}
          className="w-full bg-[#386FA4] text-white py-3 rounded-full font-semibold hover:bg-[#2f5982] transition"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default RegisterDriverPhotos;
