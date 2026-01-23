# ===========================================
# SaaS Inmobiliaria - Backend Dockerfile
# ===========================================

# Usar Node.js LTS con Debian (compatible con Prisma)
FROM node:18-slim

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema para PostgreSQL
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY src/ ./src/
COPY prisma/ ./prisma/

# Crear directorio para base de datos y logs
RUN mkdir -p /app/data /app/logs

# Generar cliente de Prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001
# DATABASE_URL debe ser configurada en el servicio de despliegue (Render, Railway, etc.)

# Comando para ejecutar la aplicación
CMD ["npm", "start"]