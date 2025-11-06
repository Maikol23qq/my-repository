# Guía de Despliegue - Frontend

Esta guía te ayudará a desplegar el frontend de Wheells en diferentes plataformas.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta en una plataforma de despliegue (Vercel, Netlify, Render, etc.)
- Git configurado
- Backend ya desplegado (para obtener la URL de la API)

## 🔧 Variables de Entorno

Antes de desplegar, configura la siguiente variable de entorno:

```
VITE_API_URL=https://tu-backend.com/api/auth
```

**Nota**: En Vite, las variables de entorno deben empezar con `VITE_` para ser accesibles en el cliente.

## 🚀 Opciones de Despliegue

### 1. Vercel (Recomendado para Frontend)

1. Ve a [Vercel.com](https://vercel.com) y crea una cuenta
2. Importa tu proyecto desde GitHub
3. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `Wheells-Fronted/frontend`
   - **Build Command**: `npm run build` (automático)
   - **Output Directory**: `dist` (automático)
4. Agrega las variables de entorno:
   - `VITE_API_URL`: URL de tu backend (ej: `https://tu-backend.render.com/api/auth`)
5. Deploy!

El archivo `vercel.json` ya está configurado.

### 2. Netlify

1. Ve a [Netlify.com](https://netlify.com) y crea una cuenta
2. "Add new site" → "Import an existing project"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Base directory**: `Wheells-Fronted/frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Agrega las variables de entorno en "Site settings" → "Environment variables":
   - `VITE_API_URL`: URL de tu backend
6. Deploy!

El archivo `netlify.toml` ya está configurado.

### 3. Render.com

1. Ve a [Render.com](https://render.com) y crea una cuenta
2. Crea un nuevo "Static Site"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Build Command**: `cd Wheells-Fronted/frontend && npm install && npm run build`
   - **Publish Directory**: `Wheells-Fronted/frontend/dist`
5. Agrega las variables de entorno
6. Deploy!

### 4. GitHub Pages

1. Instala `gh-pages`: `npm install --save-dev gh-pages`
2. Agrega al `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```
3. Configura `vite.config.js`:
   ```js
   export default defineConfig({
     base: '/nombre-de-tu-repo/',
     // ... resto de la config
   })
   ```
4. Ejecuta: `npm run deploy`

## 🔗 Configuración Post-Despliegue

Después de desplegar el frontend:

1. Copia la URL de tu frontend desplegado (ej: `https://wheells-frontend.vercel.app`)
2. Ve a tu backend y actualiza la variable `FRONTEND_URL` con esta URL
3. Reinicia el backend para aplicar los cambios

## 📝 Notas Importantes

- **URL del Backend**: Asegúrate de usar `https://` en producción, no `http://`
- **CORS**: El backend debe tener configurado el `FRONTEND_URL` correcto
- **Build**: El comando `npm run build` genera los archivos estáticos en la carpeta `dist`

## 🔍 Verificación Post-Despliegue

Después del despliegue:

1. Visita tu URL del frontend
2. Intenta registrarte o iniciar sesión
3. Verifica en la consola del navegador (F12) que no haya errores de CORS
4. Verifica que las peticiones al backend funcionen correctamente

## 🐛 Troubleshooting

- **Error 404 en rutas**: Asegúrate de que tu plataforma tenga configurado el redirect a `index.html` (ya configurado en `vercel.json` y `netlify.toml`)
- **Error de CORS**: Verifica que `FRONTEND_URL` en el backend coincida exactamente con tu URL
- **Variables de entorno no funcionan**: Recuerda que en Vite deben empezar con `VITE_` y hacer rebuild después de cambiarlas

## 📦 Build Local

Para probar el build localmente antes de desplegar:

```bash
cd Wheells-Fronted/frontend
npm run build
npm run preview
```

Esto construirá el proyecto y lo servirá en modo preview (similar a producción).

