# Gestión de Base de Datos

Este documento explica cómo gestionar la base de datos de desarrollo de manera segura.

## 📋 Scripts Disponibles

### `npm run db:setup`
- **Propósito**: Inicializar la base de datos solo si no existe
- **Comportamiento**: Crea las tablas y datos iniciales únicamente si la BD no existe
- **Uso**: Primera vez que configuras el proyecto
- **Seguro**: ✅ No elimina datos existentes

### `npm run db:backup`
- **Propósito**: Crear un backup de la base de datos actual
- **Comportamiento**: Copia la BD a la carpeta `backups/` con timestamp
- **Uso**: Antes de hacer cambios importantes
- **Seguro**: ✅ No modifica la base de datos

### `npm run db:reset`
- **Propósito**: Resetear completamente la base de datos
- **Comportamiento**: ⚠️ ELIMINA TODOS LOS DATOS y crea datos de prueba
- **Uso**: Cuando necesitas empezar desde cero en desarrollo
- **Peligroso**: ❌ Elimina todos los datos existentes

## 🚀 Flujo de Trabajo Recomendado

### Primera vez:
```bash
npm run db:setup
```

### Desarrollo normal:
```bash
npm run dev  # Los cambios se mantienen
```

### Antes de cambios importantes:
```bash
npm run db:backup  # Crear backup
# Hacer tus cambios
```

### Si necesitas resetear todo:
```bash
npm run db:backup  # ⚠️ IMPORTANTE: Crear backup primero
npm run db:reset   # ⚠️ Esto elimina todos los datos
```

## 📁 Estructura de Archivos

```
backend/
├── dev.db              # Base de datos principal
├── dev.db-wal         # Archivo WAL de SQLite
├── dev.db-shm         # Archivo SHM de SQLite
├── backups/           # Directorio de backups
│   ├── backup-2024-01-07T10-30-00.db
│   └── ...
├── setup-database.js  # Inicialización (solo si no existe)
├── reset-database.js  # Reset completo (peligroso)
└── backup-database.js # Crear backups
```

## ⚠️ Advertencias Importantes

1. **Nunca ejecutes `npm run db:reset` sin backup previo**
2. **`npm run db:setup` es seguro y se puede ejecutar múltiples veces**
3. **`npm run db:backup` es tu amigo - úsalo frecuentemente**
4. **Los backups se guardan en `backups/` con timestamp**

## 🔧 Solución de Problemas

### "No puedo crear propiedades"
```bash
# Verificar que la BD existe
ls -la dev.db

# Si no existe, inicializar
npm run db:setup

# Si existe pero tiene problemas, hacer backup y reset
npm run db:backup
npm run db:reset
```

### "Perdí mis datos"
```bash
# Ver backups disponibles
ls -la backups/

# Restaurar el backup más reciente
cp backups/$(ls -t backups/ | head -1) dev.db
```

### "Necesito actualizar el esquema"
```bash
# Los cambios en el esquema se manejan automáticamente
# por los scripts de setup/reset
npm run db:reset  # ⚠️ Solo si es necesario
```

## 📞 Contacto

Si tienes problemas con la base de datos, recuerda:
1. Crear backup antes de cualquier cambio
2. Usar `npm run db:setup` para inicialización segura
3. `npm run db:reset` solo como último recurso