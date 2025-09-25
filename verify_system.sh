#!/bin/bash

echo "🔍 Verificando Sistema de Humanizador de Ensayos"
echo "================================================"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Backend
echo -e "\n📡 Verificando Backend..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/)
if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Backend funcionando en http://localhost:8000"
else
    echo -e "${RED}✗${NC} Backend no responde"
fi

# Verificar endpoint de humanización
echo -e "\n🤖 Verificando endpoint de humanización..."
HUMANIZE_TEST=$(curl -s -X POST http://localhost:8000/api/humanize \
  -H "Content-Type: application/json" \
  -d '{"text":"prueba","budget":0.3}' \
  -o /dev/null -w "%{http_code}")
if [ "$HUMANIZE_TEST" = "200" ]; then
    echo -e "${GREEN}✓${NC} Endpoint de humanización funcionando"
else
    echo -e "${RED}✗${NC} Endpoint de humanización con problemas"
fi

# Verificar endpoint de detección
echo -e "\n🔍 Verificando endpoint de detección de IA..."
DETECT_TEST=$(curl -s -X POST http://localhost:8000/api/detect \
  -H "Content-Type: application/json" \
  -d '{"text":"Este es un texto de prueba para verificar el funcionamiento del detector."}' \
  -o /dev/null -w "%{http_code}")
if [ "$DETECT_TEST" = "200" ]; then
    echo -e "${GREEN}✓${NC} Endpoint de detección funcionando"
else
    echo -e "${RED}✗${NC} Endpoint de detección con problemas"
fi

# Verificar Frontend
echo -e "\n💻 Verificando Frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Frontend funcionando en http://localhost:5173"
else
    echo -e "${RED}✗${NC} Frontend no responde"
fi

echo -e "\n================================================"
echo "📊 Resumen:"
echo "- Backend API: http://localhost:8000"
echo "- Frontend App: http://localhost:5173"
echo ""
echo "🚀 Para usar la aplicación:"
echo "1. Abre http://localhost:5173 en tu navegador"
echo "2. Usa la pestaña 'Humanizador' para humanizar textos"
echo "3. Usa la pestaña 'Detector IA' para detectar textos generados por IA"
echo ""
echo "💡 Niveles de humanización:"
echo "- Standard: 1 pase (~85% humano)"
echo "- Ultimate: 3 pases (95%+ humano)"
