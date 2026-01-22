# 🚀 Despliegue en Producción - SaaS Inmobiliario

Guía completa para desplegar tu aplicación SaaS inmobiliario en **Render** con **Neon PostgreSQL**.

## 📋 Requisitos Previos

- ✅ Cuenta en [Render](https://render.com)
- ✅ Base de datos en [Neon](https://neon.tech) (ya configurada)
- ✅ GitHub repository actualizado

## 🏗️ Paso 1: Preparar el Código

### 1.1 Actualizar package.json scripts (✅ Ya hecho)
```json
{
  "scripts": {
    "build": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

### 1.2 Variables de entorno para producción
```bash
# Archivo .env.production (crear en backend/)
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://tu-usuario:tu-password@ep-damp-poetry-ac4cbz85-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=tu-clave-secreta-muy-segura-generada-con-openssl-rand-base64-32
CORS_ORIGIN=https://tu-frontend.onrender.com
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## 🚀 Paso 2: Desplegar en Render

### 2.1 Backend (API)

#### Opción A: Despliegue Manual
1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Conecta tu repositorio GitHub
4. Configura:
   ```
   Name: saas-inmobiliaria-backend
   Environment: Node
   Build Command: npm run build
   Start Command: npm start
   ```

#### Opción B: Despliegue con render.yaml
1. Sube el archivo `render.yaml` a tu repositorio
2. En Render: "New" → "Blueprint"
3. Render detectará automáticamente la configuración

### 2.2 Variables de Entorno del Backend
En Render Dashboard → Tu servicio → Environment:
```
NODE_ENV=production
DATABASE_URL=postgresql://tu-usuario:tu-password@ep-damp-poetry-ac4cbz85-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=tu-clave-secreta-muy-segura-generada-con-openssl-rand-base64-32
CORS_ORIGIN=https://tu-frontend.onrender.com
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 2.3 Frontend (React)

1. En Render: "New" → "Static Site"
2. Configura:
   ```
   Name: saas-inmobiliaria-frontend
   Environment: Static Site
   Build Command: npm run build
   Publish Directory: dist
   ```

3. Variables de entorno:
   ```
   VITE_API_BASE_URL=https://tu-backend.onrender.com
   ```

## 🔧 Paso 3: Configuración Post-Despliegue

### 3.1 Actualizar CORS en Backend
Una vez que tengas la URL del frontend, actualiza:
```
CORS_ORIGIN=https://tu-frontend.onrender.com
```

### 3.2 Verificar Base de Datos
```bash
# Desde Render Shell o localmente:
npx prisma studio --schema=./backend/prisma/schema.prisma
```

### 3.3 Probar Endpoints
```bash
# Login
curl https://tu-backend.onrender.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"cristian.e.druetta@gmail.com","password":"gise1984"}'

# Dashboard
curl https://tu-backend.onrender.com/api/dashboard/stats \
  -H "Authorization: Bearer TU_TOKEN"
```

## 🌐 Paso 4: Configuración de Dominio (Opcional)

### 4.1 Dominio Personalizado
1. En Render → Tu servicio → Settings → Custom Domain
2. Agrega tu dominio: `tu-dominio.com`
3. Configura DNS:
   ```
   CNAME @ tu-servicio.onrender.com
   ```

### 4.2 SSL Automático
Render proporciona SSL automáticamente para dominios personalizados.

## 📊 Paso 5: Monitoreo y Mantenimiento

### 5.1 Logs
- Render Dashboard → Tu servicio → Logs
- Configura alertas para errores

### 5.2 Métricas
- Render Dashboard → Tu servicio → Metrics
- Monitorea uso de CPU, memoria, requests

### 5.3 Backup de Base de Datos
Neon hace backups automáticos, pero puedes configurar adicionales:
```bash
# Backup manual desde Render Shell
pg_dump $DATABASE_URL > backup.sql
```

## 💰 Costos Estimados

### Render (Free Tier + Paid)
```
Backend Web Service: $7/mes (512MB RAM)
Frontend Static Site: FREE
PostgreSQL (Neon): FREE (512MB)
```
**Total mensual:** ~$7 USD

### Escalado Futuro
- **Backend:** $25/mes (2GB RAM) para más usuarios
- **Neon:** $0-50/mes según uso

## 🔧 Solución de Problemas

### Error: "Can't reach database server"
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Probar conexión desde Render Shell
npm install -g prisma
prisma db push
```

### Error: "Build failed"
```bash
# Verificar build logs en Render
# Común: Falta postinstall script
```

### Error: CORS
```bash
# Verificar CORS_ORIGIN
# Debe ser: https://tu-frontend.onrender.com (sin / al final)
```

## 🎯 Checklist de Producción

- [ ] Backend desplegado en Render
- [ ] Frontend desplegado en Render
- [ ] Variables de entorno configuradas
- [ ] Base de datos Neon conectada
- [ ] CORS configurado correctamente
- [ ] Login funcionando con credenciales reales
- [ ] Dashboard mostrando datos
- [ ] Dominio personalizado (opcional)
- [ ] SSL habilitado
- [ ] Logs monitoreados

## 🚀 ¡Tu SaaS está en Producción!

URLs de producción:
- **Frontend:** `https://tu-frontend.onrender.com`
- **Backend:** `https://tu-backend.onrender.com`
- **Base de datos:** Neon PostgreSQL

¡Felicitaciones! Tu SaaS inmobiliario está listo para recibir usuarios reales. 🏠✨