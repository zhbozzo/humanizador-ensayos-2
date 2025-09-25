# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Humanizador de Ensayos** is an AI-powered academic text humanization tool designed to make AI-generated or academic texts appear more naturally human-written while preserving important entities like numbers, dates, and citations. The primary goal is to help texts pass AI detection tools like GPT Zero and Turnitin.

### Technology Stack
- **Backend**: FastAPI (Python 3.11+) with OpenAI GPT-4 integration
- **Frontend**: React 18 + TypeScript with Vite and Tailwind CSS
- **Architecture**: Monorepo with separate frontend and backend directories

## Common Development Commands

### Backend Development
```bash
# Navigate to backend and activate environment
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.template .env
# Edit .env to add OPENAI_API_KEY if available

# Run development server
uvicorn main:app --reload

# Run all tests
pytest tests/ -v

# Run specific test categories
pytest tests/test_integration.py::TestEntityPreservation -v
pytest tests/test_integration.py::TestBudgetCompliance -v
pytest tests/test_integration.py::TestMetricsCalculation -v

# Test basic setup without dependencies
python test_setup.py
```

### Frontend Development
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Quick Start Both Services
```bash
# Backend (Terminal 1)
cd backend && uvicorn main:app --reload

# Frontend (Terminal 2)  
cd frontend && npm run dev
```

## Code Architecture

### Backend Architecture (FastAPI)

The backend follows a modular architecture with clear separation of concerns:

**Core Modules (`backend/modules/`):**
- `entity_extractor.py` - Identifies and preserves academic entities (numbers, dates, citations, proper names)
- `text_rewriter.py` - Integrates with OpenAI GPT-4 to humanize text while respecting constraints
- `metrics_calculator.py` - Calculates text quality metrics and generates diffs

**Main Application (`backend/main.py`):**
- FastAPI application with CORS configuration
- Single main endpoint: `POST /api/humanize`
- Orchestrates the three-step process: extract → rewrite → calculate metrics
- Handles both full API mode and demo mode (without OpenAI key)

**Data Flow:**
1. Text input → Entity extraction and freezing with placeholders
2. Frozen text → OpenAI rewriting with specialized anti-detection prompt
3. Rewritten text → Entity restoration and verification
4. Final text → Metrics calculation and diff generation

### Frontend Architecture (React + TypeScript)

**Component Structure (`frontend/src/components/`):**
- `HumanizerInterface.tsx` - Main interface orchestrating user interactions
- `InputSection.tsx` - Text input, controls, and configuration options
- `ResultsSection.tsx` - Tabbed results display (Result, Diff, Metrics)

**Type Definitions (`frontend/src/types/api.ts`):**
- Strongly typed API interfaces matching backend models
- Request/Response types for type safety

**Services (`frontend/src/services/api.ts`):**
- API client for backend communication
- Error handling and response parsing

### Key Entity Preservation System

The entity extraction system uses regex patterns to identify and preserve:
- Numbers and percentages: `85%`, `1,234`, `0.5`
- Years: `2020-2099` (4-digit years)
- Dates: Multiple Spanish formats (`dd/mm/yyyy`, `dd de mes de yyyy`, etc.)
- Academic citations: `(Author, 2020)`, `(García et al., 2019)`
- References: `[1]`, `(2)`
- URLs and DOIs

**Preservation Process:**
1. Extract entities with unique placeholders (`__ENTITY_N_hash__`)
2. Send text with placeholders to OpenAI
3. Restore original entities in final output
4. Verify all entities were preserved correctly

### OpenAI Integration Strategy

The text rewriter uses a specialized system prompt designed to:
- Make text appear naturally human-written
- Avoid typical AI patterns (perfect structures, formal transitions)
- Use natural Spanish connectors and expressions
- Introduce subtle human-like imperfections
- Maintain academic level while sounding conversational
- Respect budget constraints (max % of text changed)

**Prompt Engineering Focus:**
- Specific instructions to evade AI detection tools
- Emphasis on natural Spanish language patterns
- Budget compliance with token-level change tracking
- Entity preservation with strict no-modification rules

## Environment Configuration

### Backend Environment Variables (.env)
```env
OPENAI_API_KEY=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  # Optional - demo mode without it
DEBUG=True
HOST=localhost
PORT=8000
FRONTEND_URL=http://localhost:5173  # Important for CORS
```

### Demo Mode Behavior
Without OpenAI API key:
- Returns original text unchanged
- Calculates real metrics on input text
- Shows appropriate demo warnings
- Allows full interface testing

## Testing Strategy

The backend includes comprehensive integration tests covering:
- **Entity Preservation**: Ensures all academic entities remain unchanged
- **Budget Compliance**: Verifies changes don't exceed specified limits  
- **Metrics Accuracy**: Validates calculation consistency and precision

**Test Categories:**
```bash
# All tests
pytest tests/ -v

# Entity preservation tests
pytest tests/test_integration.py::TestEntityPreservation -v

# Budget compliance tests  
pytest tests/test_integration.py::TestBudgetCompliance -v

# Metrics calculation tests
pytest tests/test_integration.py::TestMetricsCalculation -v
```

## Metrics and Quality Assessment

The system calculates four key metrics:
- **Change Ratio**: Levenshtein distance-based measurement of text modification
- **Rare Word Ratio**: Density of complex words (>12 characters, non-stopwords)
- **Average Sentence Length**: Mean words per sentence
- **LIX Index**: Spanish-adapted readability score

## API Endpoints

### `POST /api/humanize`
Main humanization endpoint accepting:
```json
{
  "text": "string",
  "budget": 0.2,  // 0-1, max proportion of text to change
  "preserve_entities": true,
  "respect_style": false,
  "style_sample": "string|null"
}
```

Returns processed text with metrics, diff, and processing alerts.

### `GET /health`
Simple health check endpoint.

## Development Best Practices

### When Working with Entity Preservation
- Always test with academic texts containing numbers, dates, and citations
- Verify entities are restored correctly after processing
- Check entity verification doesn't throw false positives

### When Modifying the Rewriter
- Test with different budget levels (0.1, 0.2, 0.3)
- Ensure output respects budget constraints
- Validate that anti-detection strategies remain effective

### When Updating Metrics
- Ensure calculations are stable and deterministic
- Test edge cases (empty text, very short text, very long text)
- Verify LIX scores are reasonable for Spanish academic texts

## Troubleshooting Common Issues

### CORS Errors
Verify `FRONTEND_URL` in backend `.env` matches frontend URL (typically `http://localhost:5173`).

### Module Import Errors (Backend)
Ensure virtual environment is activated and dependencies installed:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### TypeScript Compilation Errors (Frontend)
Check for missing dependencies or type mismatches:
```bash
cd frontend
npm install
npm run build  # Check for compilation errors
```

### API Key Related Issues
- Without API key: System runs in demo mode (expected behavior)
- Invalid API key: Check OpenAI API key format and permissions
- Rate limiting: Handle OpenAI rate limits gracefully

## File Structure Reference

```
backend/
├── modules/
│   ├── entity_extractor.py    # Academic entity detection and preservation
│   ├── text_rewriter.py       # OpenAI integration with anti-detection prompt
│   └── metrics_calculator.py  # Text quality metrics and diff generation
├── tests/
│   └── test_integration.py    # Comprehensive integration tests
├── main.py                    # FastAPI application and API endpoints
├── requirements.txt           # Python dependencies
└── .env.template             # Environment variables template

frontend/
├── src/
│   ├── components/           # React components (Interface, Input, Results)
│   ├── services/            # API client and error handling
│   ├── types/              # TypeScript type definitions
│   └── App.tsx             # Main application component
├── package.json            # Node.js dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
└── vite.config.ts         # Vite build configuration
```
