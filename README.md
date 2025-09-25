# Humanizador de Ensayos

Un MVP para humanizar textos académicos manteniendo naturalidad y preservando entidades importantes como cifras, fechas y citas.

## 🎯 Objetivo

Este proyecto está diseñado específicamente para hacer que textos académicos pasen desapercibidos por detectores de IA como GPT Zero o Turnitin, manteniendo la calidad y precisión del contenido original.

## 🏗️ Arquitectura

### Stack Tecnológico

**Frontend:**
- React 18 con TypeScript
- Vite como build tool
- Tailwind CSS para estilos
- API REST para comunicación

**Backend:**
- FastAPI (Python 3.11+)
- OpenAI GPT-4 para humanización
- Preservación inteligente de entidades
- Cálculo de métricas de legibilidad

**Estructura del Monorepo:**
```
humanizador-ensayos/
├── frontend/          # Aplicación React
├── backend/           # API FastAPI
├── LICENSE           # Licencia MIT
└── README.md         # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Python 3.11 o superior
- Node.js 18 o superior
- npm o yarn
- Clave API de OpenAI (opcional para modo demo)

### Configuración del Backend

1. **Navegar al directorio del backend:**
   ```bash
   cd backend
   ```

2. **Crear entorno virtual:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\\Scripts\\activate
   ```

3. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno:**
   ```bash
   cp .env.template .env
   ```
   
   Editar el archivo `.env` y añadir tu clave API:
   ```
   OPENAI_API_KEY=tu_clave_openai_aqui
   DEBUG=True
   HOST=localhost
   PORT=8000
   FRONTEND_URL=http://localhost:5173
   ```

5. **Ejecutar el servidor:**
   ```bash
   uvicorn main:app --reload
   ```
   
   La API estará disponible en: http://localhost:8000

### Configuración del Frontend

1. **Navegar al directorio del frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   
   La aplicación estará disponible en: http://localhost:5173

### Billing con Paddle (Sandbox)

1. Copia `frontend/env.example` a `frontend/.env` y rellena `VITE_PADDLE_CLIENT_TOKEN` y precios `VITE_PRICE_*`.
2. Copia `node-auth/env.example` a `node-auth/.env` y rellena `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`.
3. En Paddle Dashboard → Checkout settings: define `Default payment link = https://localhost/`.
4. Arranca el backend Node Auth:
   ```bash
   cd node-auth
   npm run dev
   ```
5. En `/pricing`, pulsa “Suscribirse” y completa un pago de prueba. Verifica que `user_profiles` refleja `status`, `plan`, `billing_period`, `plan_renews_at`, `price_id`, `paddle_*`.

Para ir a producción: cambia `VITE_PADDLE_ENV=production`, usa tokens/secretos de live y actualiza el Default payment link al dominio real.

## 📖 Uso

### Interfaz de Usuario

La aplicación presenta una interfaz simple con:

1. **Textarea principal:** Para pegar el texto académico a humanizar
2. **Slider de grado de edición:** Control de 0-30% para ajustar la intensidad de los cambios
3. **Checkboxes de configuración:**
   - **Preservar cifras/fechas/citas:** Activado por defecto
   - **Respetar mi estilo:** Para mantener el estilo personal
4. **Muestra de estilo:** Campo opcional que aparece al activar "Respetar mi estilo"
5. **Botón "Humanizar":** Procesa el texto

### Resultados

Los resultados se muestran en tres pestañas:

1. **Resultado:** El texto humanizado final con botón para copiar
2. **Diferencias:** Comparación visual mostrando cambios en verde (añadido) y rojo (eliminado)
3. **Métricas:** Estadísticas del procesamiento:
   - Porcentaje de cambio
   - Ratio de palabras raras
   - Longitud media de oración
   - Índice LIX (legibilidad)

## 🔧 API Endpoints

### POST /api/humanize

Endpoint principal para humanizar textos.

**Request Body:**
```json
{
  "text": "string",
  "budget": 0.2,
  "preserve_entities": true,
  "respect_style": false,
  "style_sample": "string|null"
}
```

**Response:**
```json
{
  "result": "string",
  "diff": [
    {
      "type": "insert|delete|equal",
      "token": "..."
    }
  ],
  "metrics": {
    "change_ratio": 0.18,
    "rare_word_ratio": 0.06,
    "avg_sentence_len": 19.4,
    "lix": 41.2
  },
  "alerts": ["Se preservaron 12 cifras y 4 citas."]
}
```

### GET /health

Verificación de estado del servicio.

**Response:**
```json
{
  "status": "healthy"
}
```

## 🧪 Testing

### Tests del Backend

Ejecutar la suite completa de tests:

```bash
cd backend
pytest tests/ -v
```

Los tests incluyen:
- **Preservación de entidades:** Verificar que cifras, fechas y citas se mantengan
- **Cumplimiento del budget:** Comprobar que los cambios respeten los límites
- **Cálculo estable de métricas:** Validar precisión de las métricas

### Tests Específicos

```bash
# Solo tests de entidades
pytest tests/test_integration.py::TestEntityPreservation -v

# Solo tests de budget
pytest tests/test_integration.py::TestBudgetCompliance -v

# Solo tests de métricas
pytest tests/test_integration.py::TestMetricsCalculation -v
```

## 🎨 Características Principales

### Preservación Inteligente de Entidades

El sistema preserva automáticamente:
- Números y porcentajes (85%, 1,234, etc.)
- Años de 4 dígitos (2020-2099)
- Fechas en múltiples formatos (dd/mm/yyyy, dd-mm-yyyy, etc.)
- Citas académicas ((Autor, 2020), (García et al., 2019))
- Referencias numéricas ([1], (2))
- URLs y DOIs

### Humanización Avanzada

- **Budget controlado:** Limita los cambios al porcentaje especificado
- **Preservación del significado:** No altera el contenido factual
- **Estilo natural:** Evita patrones típicos de IA
- **Conectores naturales:** Usa transiciones humanas
- **Variación sintáctica:** Sin léxico extraño

### Métricas de Calidad

- **Change Ratio:** Proporción exacta de texto modificado
- **Rare Word Ratio:** Medida de complejidad léxica
- **Average Sentence Length:** Longitud media de oraciones
- **LIX Index:** Índice de legibilidad para español

## 🔧 Modo Demo

Sin clave API de OpenAI, la aplicación funciona en modo demo:
- Devuelve el texto original sin modificar
- Calcula métricas reales
- Muestra advertencias apropiadas
- Permite probar la interfaz completa

## 📁 Estructura del Proyecto

```
backend/
├── modules/
│   ├── entity_extractor.py    # Extracción y preservación de entidades
│   ├── text_rewriter.py       # Reescritura con OpenAI
│   └── metrics_calculator.py  # Cálculo de métricas
├── tests/
│   └── test_integration.py    # Tests de integración
├── main.py                    # Aplicación FastAPI
├── requirements.txt           # Dependencias Python
└── .env.template             # Template de configuración

frontend/
├── src/
│   ├── components/           # Componentes React
│   ├── services/            # Servicios API
│   ├── types/              # Tipos TypeScript
│   └── App.tsx             # Componente principal
├── tailwind.config.js       # Configuración Tailwind
└── package.json            # Dependencias Node.js
```

## 🚨 Consideraciones de Seguridad

- Las claves API nunca se exponen en el frontend
- Variables de entorno para configuración sensible
- Validación de entrada en backend
- Manejo seguro de errores

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## ⚡ Comandos Rápidos

```bash
# Ejecutar backend
cd backend && uvicorn main:app --reload

# Ejecutar frontend
cd frontend && npm run dev

# Ejecutar tests
cd backend && pytest tests/ -v

# Instalar dependencias backend
cd backend && pip install -r requirements.txt

# Instalar dependencias frontend
cd frontend && npm install
```

## 🔍 Troubleshooting

### Error de CORS
Si encuentras errores de CORS, verifica que `FRONTEND_URL` en el `.env` coincida con la URL del frontend.

### Error de módulos Python
Asegúrate de estar en el entorno virtual correcto:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Error de API Key
Sin clave API, la aplicación funciona en modo demo. Para funcionalidad completa, añade una clave válida de OpenAI en el archivo `.env`.

## 📞 Soporte

Para reportar bugs o solicitar features, por favor abre un issue en el repositorio de GitHub.
