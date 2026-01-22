# 🐳 Docker Setup - SaaS Inmobiliaria

Esta guía explica cómo usar Docker para desarrollar y desplegar tu aplicación SaaS inmobiliaria.

## 📋 Prerrequisitos

### Instalar Docker Desktop

1. **Descargar Docker Desktop:**
   - Visita: https://www.docker.com/products/docker-desktop
   - Descarga la versión para Windows
   - Instala siguiendo el asistente

2. **Verificar instalación:**
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Configuración recomendada:**
   - Asignar al menos 4GB de RAM
   - Habilitar WSL 2 si usas Windows
   - Reiniciar después de instalar

## 🚀 Uso en Desarrollo

### Levantar entorno completo

```bash
# Desde la raíz del proyecto
cd D:\CRISTIAN\SaaS

# Levantar backend + frontend + base de datos
docker-compose --profile dev up
```

### Acceder a la aplicación

- **Frontend:** http://localhost:5173 (Vite con hot reload)
- **Backend API:** http://localhost:3001
- **Debug Node.js:** http://localhost:9229

### Comandos útiles en desarrollo

```bash
# Ver logs en tiempo real
docker-compose --profile dev logs -f

# Ver logs de un servicio específico
docker-compose --profile dev logs backend -f

# Ejecutar comandos en contenedores
docker-compose --profile dev exec backend npm test
docker-compose --profile dev exec frontend npm run build

# Detener todo
docker-compose --profile dev down

# Reconstruir contenedores (después de cambios en Dockerfile)
docker-compose --profile dev up --build
```

## 🏭 Despliegue en Producción

### Levantar producción completa

```bash
# Producción básica (SQLite)
docker-compose up -d

# Con PostgreSQL (recomendado para producción)
docker-compose --profile postgres up -d
```

### URLs de producción

- **Frontend:** http://localhost:80 (Nginx)
- **Backend API:** http://localhost:3001
- **Proxy SSL:** http://localhost:443 (si configurado)

### Gestión de producción

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs de producción
docker-compose logs -f

# Reiniciar servicios
docker-compose restart backend
docker-compose restart frontend

# Backup de base de datos
docker-compose exec backend npm run backup-db

# Detener producción
docker-compose down
```

## 🗂️ Estructura de Archivos

```
D:\CRISTIAN\SaaS\
├── docker-compose.yml          # Configuración de producción
├── docker-compose.override.yml # Configuración de desarrollo
├── backend/
│   ├── Dockerfile              # Backend producción
│   ├── Dockerfile.dev          # Backend desarrollo
│   └── data/                   # Base de datos (volume)
├── frontend/
│   ├── Dockerfile              # Frontend producción
│   └── Dockerfile.dev          # Frontend desarrollo
└── nginx/
    └── nginx.conf              # Proxy reverso (opcional)
```

## 🔧 Configuración de Variables

### Desarrollo
```yaml
# docker-compose.override.yml
environment:
  - NODE_ENV=development
  - DATABASE_URL=file:/app/dev.db
  - JWT_SECRET=dev-secret-key-change-in-production
```

### Producción
```yaml
# docker-compose.yml
environment:
  - NODE_ENV=production
  - DATABASE_URL=file:/app/data/prod.db
  - JWT_SECRET=${JWT_SECRET}
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

## 🗄️ Base de Datos

### SQLite (Desarrollo/Producción básica)
- **Archivo:** `./backend/data/dev.db` (desarrollo) / `./backend/data/prod.db` (producción)
- **Persistencia:** Volume Docker
- **Backup:** `docker-compose exec backend npm run backup-db`

### PostgreSQL (Producción escalable)
```bash
# Activar PostgreSQL
docker-compose --profile postgres up -d

# Variables necesarias
POSTGRES_PASSWORD=tu-password-segura
```

## 🐛 Debugging

### Desarrollo
- **Hot reload:** Automático en cambios de código
- **Debug port:** 9229 (conectar con VS Code)
- **Logs:** `docker-compose --profile dev logs backend -f`

### Producción
- **Health checks:** Automáticos cada 30s
- **Logs:** `docker-compose logs backend -f`
- **Debug:** `docker-compose exec backend sh`

## 📊 Monitoreo

### Métricas incluidas
- **Prometheus metrics:** `/metrics` endpoint
- **Health checks:** `/health` endpoint
- **Logs:** Winston con rotación diaria

### Ver métricas
```bash
# Acceder a métricas
curl http://localhost:3001/metrics

# Ver logs
docker-compose logs backend | grep -i error
```

## 🚀 CI/CD con GitHub Actions

El proyecto incluye workflows de GitHub Actions para:

```yaml
# .github/workflows/ci-cd.yml
- Build y test automatizados
- Despliegue automático a staging/producción
- Security scanning
- Performance tests
```

## 🔒 Seguridad

### Producción
- ✅ Contenedores no privilegiados
- ✅ Secrets via variables de entorno
- ✅ Redes Docker aisladas
- ✅ Actualizaciones automáticas con Dependabot

### Checklist de seguridad
- [ ] Cambiar JWT_SECRET en producción
- [ ] Configurar POSTGRES_PASSWORD segura
- [ ] Habilitar SSL/HTTPS
- [ ] Configurar firewall
- [ ] Monitoreo de logs

## 🛠️ Troubleshooting

### Problemas comunes

**"Port already in use"**
```bash
# Liberar puertos
docker-compose --profile dev down
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**"No space left on device"**
```bash
# Limpiar Docker
docker system prune -a
docker volume prune
```

**"Database connection failed"**
```bash
# Verificar permisos
docker-compose exec backend ls -la data/
docker-compose exec backend chmod 777 data/
```

**Contenedores no inician**
```bash
# Ver logs detallados
docker-compose --profile dev up --build
docker-compose logs
```

## 📈 Escalabilidad

### Horizontal scaling
```bash
# Más instancias de backend
docker-compose up -d --scale backend=3

# Load balancer (nginx)
docker-compose --profile production up nginx-proxy
```

### Base de datos
- **SQLite:** Máx. 1 escritor concurrente
- **PostgreSQL:** Múltiples conexiones concurrentes
- **Redis:** Para cache/session (futuro)

## 📚 Recursos adicionales

- [Docker Compose docs](https://docs.docker.com/compose/)
- [Docker best practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js en Docker](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [React en Docker](https://mherman.org/blog/dockerizing-a-react-app/)

## 🤝 Contribución

1. **Instalar Docker Desktop**
2. **Probar desarrollo:** `docker-compose --profile dev up`
3. **Verificar producción:** `docker-compose up -d`
4. **Reportar issues** con logs: `docker-compose logs`

---

## 📞 Soporte

Si tienes problemas con Docker:

1. Verifica que Docker Desktop esté corriendo
2. Revisa los logs: `docker-compose logs`
3. Limpia y reconstruye: `docker-compose down && docker-compose up --build`
4. Consulta los [Docker logs](#debugging)

¡Feliz desarrollo con Docker! 🐳