import { Link } from "react-router-dom";

export default function Landing() {
  return (
    
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-indigo-600 to-indigo-800 text-white">
      {/* Encabezado */}
      <header className="flex items-center justify-between px-8 py-4">

      </header>

      {/* Cuerpo principal */}
      <main className="flex flex-col items-center text-center px-6 md:px-20">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">Wheells</h1>

        <h3 className="text-3xl font-bold tracking-wide">
          Comparte tu ruta, ahorra y llega seguro.
        </h3>
        <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mb-10">
          Una forma segura y práctica de compartir transporte entre estudiantes de tu universidad.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <Link
            to="/auth"
            className="bg-white text-indigo-700 font-semibold px-8 py-3 rounded-2xl hover:bg-indigo-100 transition"
          >
            Iniciar Sesión
          </Link>
          <Link
            to="/auth?mode=register"
            className="border border-white px-8 py-3 rounded-2xl font-semibold hover:bg-white hover:text-indigo-700 transition"
          >
            Registrarse
          </Link>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="text-center py-6 text-indigo-200 text-sm">
        © {new Date().getFullYear()} Wheels — Proyecto Universitario-Maikol Smit Gutierrez Bello
      </footer>
    </div>
  );
}
