import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import RegisterPhoto from "./pages/RegisterPhoto";
import RegisterDriverVehicle from "./pages/RegisterDriverVehicle";
import RegisterDriverPhotos from "./pages/RegisterDriverPhotos";
import DashboardConductor from "./pages/DashboardConductor";
import DashboardPasajero from "./pages/DashboardPasajero";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register-photo" element={<RegisterPhoto />} />
        <Route path="/register-driver-vehicle" element={<RegisterDriverVehicle />} />
        <Route path="/register-driver-photos" element={<RegisterDriverPhotos />} />
        <Route path="/dashboard-pasajero" element={<DashboardPasajero />} />
        <Route path="/dashboard-conductor" element={<DashboardConductor />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
