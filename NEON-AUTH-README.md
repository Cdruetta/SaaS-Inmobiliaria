# 🚀 Guía Completa: Habilitar Neon Auth en SaaS Inmobiliario

Esta guía te llevará paso a paso para migrar tu aplicación de **SQLite local** a **Neon PostgreSQL** con autenticación completa.

## 📋 Requisitos Previos

- ✅ Node.js 16+
- ✅ Cuenta en [Neon](https://neon.tech)
- ✅ Git

---

## 🚀 Paso 1: Configurar Neon Database

### 1.1 Crear cuenta en Neon
1. Ve a [console.neon.tech](https://console.neon.tech)
2. Regístrate con GitHub/Google/Email
3. Crea un nuevo proyecto

### 1.2 Crear base de datos
```bash
# En Neon Console:
1. Click "Create project"
2. Nombre: "saas-inmobiliario"
3. Región: "South America (São Paulo)" ⭐
4. PostgreSQL versión: Latest
```

### 1.3 Obtener DATABASE_URL
```bash
# En Neon Console > Tu proyecto > Connection string
# Copia la connection string que se ve así:
postgresql://username:password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 🔧 Paso 2: Actualizar Configuración

### 2.1 Actualizar dependencias
```bash
cd backend

# Remover SQLite (ya hecho)
npm uninstall better-sqlite3

# Instalar PostgreSQL driver (ya hecho)
npm install pg
```

### 2.2 Configurar variables de entorno
```bash
# Crear archivo .env en /backend
cp env-example.txt .env

# Editar .env y reemplazar DATABASE_URL:
DATABASE_URL="postgresql://tu-usuario:tu-password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 2.3 Regenerar Prisma Client
```bash
cd backend
npx prisma generate
```

---

## 🗄️ Paso 3: Migrar Base de Datos

### 3.1 Ejecutar migraciones en Neon
```bash
cd backend

# Crear tablas en Neon
npx prisma db push

# O crear y ejecutar migración
npx prisma migrate dev --name init-neon
```

### 3.2 Migrar datos existentes
```bash
cd backend

# Ejecutar script de migración
node migrate-to-neon.js
```

**¿Qué hace el script?**
- ✅ Lee datos de SQLite (`dev.db`)
- ✅ Migra usuarios, propiedades, clientes, transacciones
- ✅ Si no hay datos, crea ejemplos de prueba
- ✅ Verifica la migración

---

## 🔐 Paso 4: Probar Autenticación

### 4.1 Iniciar servidor
```bash
cd backend
npm run dev
```

### 4.2 Probar endpoints de autenticación
```bash
# Registrar usuario
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Usuario Test"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4.3 Verificar datos en Neon
```bash
# Ver usuarios en Neon
npx prisma studio

# O desde Neon Console > SQL Editor
SELECT * FROM users;
```

---

## 🎯 Paso 5: Probar Frontend

### 5.1 Iniciar frontend
```bash
cd frontend
npm run dev
```

### 5.2 Probar login completo
1. Ve a `http://localhost:5173`
2. Regístrate o inicia sesión
3. Verifica que se guarden datos en Neon

---

## 🔧 Configuración de Producción

### Para despliegue en AWS/Vercel/etc:

```bash
# En producción, usar variables de entorno
DATABASE_URL=postgresql://prod-user:prod-pass@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require

# Configurar pool de conexiones (opcional)
DATABASE_URL=postgresql://prod-user:prod-pass@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1
```

### Neon Auth (Opcional - Para autenticación avanzada)
Si quieres usar **Neon Auth** (OAuth, JWT automático):

```bash
# En Neon Console > Auth
1. Habilitar Neon Auth
2. Configurar proveedores (Google, GitHub)
3. Obtener credenciales

# En tu código:
import { neonAuth } from '@neon-auth/client'

const { user, session } = await neonAuth.signIn()
```

---

## 📊 Ventajas de Neon para tu SaaS

### 🚀 Rendimiento
- **Serverless**: Escala automáticamente
- **Edge Network**: Conexiones rápidas globales
- **Auto-scaling**: Maneja picos de tráfico

### 💰 Costo
- **Free Tier**: 512MB gratis
- **Pago por uso**: Solo por lo que consumes
- **Sin servidor dedicado**: Ahorra vs RDS

### 🔒 Seguridad
- **SSL obligatorio**: Conexiones seguras
- **Backup automático**: Datos protegidos
- **Encryption**: Datos en reposo y en tránsito

### 🛠️ Developer Experience
- **Branching**: Crea entornos de desarrollo instantáneos
- **Prisma integration**: Funciona perfecto con tu ORM
- **Real-time monitoring**: Dashboard de métricas

---

## 🐛 Solución de Problemas

### Error: "Can't reach database server"
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Probar conexión
npx prisma db push --preview-feature
```

### Error: "Authentication failed"
```bash
# Verificar credenciales en Neon Console
# Asegurarse que IP esté whitelisted (0.0.0.0/0 para desarrollo)
```

### Error: "Migration failed"
```bash
# Resetear base de datos
npx prisma migrate reset --force

# Recrear esquema
npx prisma db push --force-reset
```

---

## 🎉 ¡Listo!

Tu SaaS inmobiliario ahora usa **Neon PostgreSQL** con:

- ✅ **Autenticación JWT** funcionando
- ✅ **Base de datos serverless** en la nube
- ✅ **Escalabilidad automática**
- ✅ **Backups automáticos**
- ✅ **Rendimiento optimizado**

### Próximos pasos recomendados:
1. **Configurar CI/CD** con GitHub Actions
2. **Agregar Neon Branching** para desarrollo
3. **Configurar monitoring** con Neon Dashboard
4. **Optimizar queries** con Prisma

¿Necesitas ayuda con algún paso específico? 🤔

---

**Recuerda**: Tus datos ahora están en la nube de forma segura con Neon. ¡El futuro de tu SaaS está asegurado! ☁️🏠