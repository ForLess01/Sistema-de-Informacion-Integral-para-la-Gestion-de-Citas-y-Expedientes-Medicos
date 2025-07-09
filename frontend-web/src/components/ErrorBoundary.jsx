import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Algo salió mal
            </h1>
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error al cargar la aplicación.
            </p>
            <details className="text-sm text-gray-500">
              <summary className="cursor-pointer">Detalles del error</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                {this.state.error && this.state.error.toString()}
              </pre>
            </details>
            <button
              onClick={() => {
                // Limpiar localStorage y recargar
                localStorage.clear();
                window.location.reload();
              }}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Limpiar caché y reiniciar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
