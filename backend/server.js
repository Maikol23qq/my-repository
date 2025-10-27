// server.js - VERSIÓN COMPLETA CON DEBUG
import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

// ✅ CORS CORREGIDO
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  
  // Manejar preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// =====================
// 🗃️ BASE DE DATOS EN MEMORIA
// =====================
let users = [];
let nextId = 1;

// =====================
// 🧪 RUTA DE PRUEBA
// =====================
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "✅ Backend funcionando correctamente",
    timestamp: new Date().toISOString(),
    usersCount: users.length
  });
});

// =====================
// 🧍‍♀️ Registro de usuario - CON DEBUG COMPLETO
// =====================
app.post("/api/auth/register", async (req, res) => {
  try {
    // ✅ DEBUG COMPLETO - DETALLE DE CAMPOS
    console.log("=== 🐛 DEBUG REGISTRO ===");
    console.log("Body completo:", JSON.stringify(req.body, null, 2));
    console.log("--- Campos individuales ---");
    console.log("name:", req.body.name, "- Tipo:", typeof req.body.name, "- Vacío?", !req.body.name);
    console.log("email:", req.body.email, "- Tipo:", typeof req.body.email, "- Vacío?", !req.body.email);
    console.log("password:", req.body.password, "- Tipo:", typeof req.body.password, "- Vacío?", !req.body.password);
    console.log("telefono:", req.body.telefono, "- Tipo:", typeof req.body.telefono, "- Vacío?", !req.body.telefono);
    console.log("idUniversitario:", req.body.idUniversitario, "- Tipo:", typeof req.body.idUniversitario, "- Vacío?", !req.body.idUniversitario);
    console.log("role:", req.body.role, "- Tipo:", typeof req.body.role, "- Vacío?", !req.body.role);
    
    // Verificar campos obligatorios
    const camposRequeridos = ['name', 'email', 'password'];
    const camposVacios = camposRequeridos.filter(campo => !req.body[campo] || req.body[campo].toString().trim() === '');
    
    if (camposVacios.length > 0) {
      console.log("❌ CAMPOS VACÍOS DETECTADOS:", camposVacios);
      return res.status(400).json({ error: "Todos los campos obligatorios deben estar completos" });
    }

    // ✅ CONVERTIR 'name' A 'nombre'
    const { name, email, password, telefono, idUniversitario, role } = req.body;
    const nombre = name;

    console.log("✅ Todos los campos OK, procediendo con registro...");

    // Verificar si el usuario ya existe
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      console.log("❌ Usuario ya existe:", email);
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear nuevo usuario
    const newUser = {
      id: nextId++,
      nombre,
      email, 
      password: hashedPassword, 
      telefono: telefono || "",
      idUniversitario: idUniversitario || "", 
      role: role || "pasajero"
    };
    
    users.push(newUser);
    console.log("✅ Usuario registrado exitosamente:", newUser.email);
    console.log("📊 Total de usuarios registrados:", users.length);

    res.status(201).json({ 
      message: "Usuario registrado correctamente ✅",
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error);
    res.status(500).json({ error: "Error al registrar el usuario" });
  }
});

// =====================
// 🔐 Inicio de sesión
// =====================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Intento de login:", email);

    const user = users.find(u => u.email === email);
    if (!user) {
      console.log("❌ Usuario no encontrado:", email);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("❌ Contraseña incorrecta para:", email);
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "claveultrasegura",
      { expiresIn: "2h" }
    );

    console.log("✅ Login exitoso:", email);

    res.json({
      message: "Inicio de sesión exitoso ✅",
      token,
      role: user.role,
      nombre: user.nombre,
      userId: user.id
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// =====================
// 🧭 Ruta inicial
// =====================
app.get("/", (req, res) => {
  res.send("🚗 Servidor Wheels funcionando correctamente 🚀");
});

// =====================
// 🧨 Iniciar servidor
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Servidor escuchando en puerto ${PORT}`);
  console.log(`🗃️ Usando base de datos en memoria`);
  console.log(`🌐 CORS configurado para: http://localhost:5173`);
  console.log(`📡 Endpoint de prueba: http://localhost:${PORT}/api/test`);
});