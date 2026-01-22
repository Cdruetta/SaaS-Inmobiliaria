#!/bin/bash

echo "🚀 Script de Despliegue Rápido - SaaS Inmobiliario"
echo "=================================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml no encontrado. Ejecuta desde la raíz del proyecto."
    exit 1
fi

echo "📋 Checklist de despliegue:"
echo "✅ Código commiteado en GitHub"
echo "✅ Base de datos Neon configurada"
echo "✅ Variables de entorno listas"
echo "✅ Dockerfiles actualizados"
echo ""

echo "🌐 Pasos para desplegar en Render:"
echo ""
echo "1️⃣ Ve a: https://dashboard.render.com"
echo "2️⃣ Click 'New' → 'Blueprint'"
echo "3️⃣ Conecta tu repositorio GitHub"
echo "4️⃣ Render detectará render.yaml automáticamente"
echo ""

echo "🔧 Variables de entorno que configurar:"
echo ""
echo "BACKEND:"
echo "  DATABASE_URL=postgresql://tu-usuario:tu-password@ep-damp-poetry-ac4cbz85-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
echo "  JWT_SECRET=tu-clave-secreta-muy-segura"
echo "  NODE_ENV=production"
echo "  PORT=3001"
echo ""

echo "FRONTEND:"
echo "  VITE_API_BASE_URL=https://tu-backend.onrender.com"
echo ""

echo "🎯 URLs resultantes:"
echo "  Backend: https://tu-proyecto-backend.onrender.com"
echo "  Frontend: https://tu-proyecto-frontend.onrender.com"
echo ""

echo "⚡ Comandos útiles después del despliegue:"
echo ""
echo "# Ver logs del backend:"
echo "render logs --service tu-proyecto-backend"
echo ""
echo "# Ver logs del frontend:"
echo "render logs --service tu-proyecto-frontend"
echo ""
echo "# Reiniciar servicios:"
echo "render restart --service tu-proyecto-backend"
echo "render restart --service tu-proyecto-frontend"
echo ""

echo "📖 Lee DEPLOYMENT-README.md para instrucciones detalladas"
echo ""
echo "🎉 ¡Tu SaaS inmobiliario estará online en minutos!"