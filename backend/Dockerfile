# ===========================================
# SaaS Inmobiliaria - Backend Dockerfile
# ===========================================

# Usar Node.js LTS
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema para SQLite
RUN apk add --no-cache sqlite

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
RUN npx prisma generate

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/prod.db"

# Comando para ejecutar la aplicación
CMD ["npm", "start"]