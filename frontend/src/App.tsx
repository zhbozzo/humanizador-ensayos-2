import { useState } from 'react'
import HumanizerInterface from './components/HumanizerInterface'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Humanizador de Ensayos
          </h1>
          <p className="text-gray-600 mt-2">
            Transforma tu texto académico manteniendo naturalidad y preservando datos importantes
          </p>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <HumanizerInterface />
      </main>
      
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>Humanizador de Ensayos v1.0.0 - Código abierto bajo licencia MIT</p>
        </div>
      </footer>
    </div>
  )
}

export default App
