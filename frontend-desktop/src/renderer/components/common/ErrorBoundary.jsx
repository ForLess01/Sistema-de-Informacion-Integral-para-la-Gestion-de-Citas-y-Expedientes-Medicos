import React, { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    
    if (hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-[200px] bg-red-50 border border-red-100 rounded-xl p-6 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {this.props.fallbackTitle || "Algo salió mal"}
            </h3>
            <p className="text-gray-600 mb-4">
              {this.props.fallbackMessage || "Se produjo un error en este componente"}
            </p>
            
            {this.props.showDetails && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-left overflow-auto max-h-[200px] text-sm text-gray-700">
                <p className="font-bold mb-2">Error: {error?.toString()}</p>
                <p className="whitespace-pre-wrap">
                  {errorInfo?.componentStack}
                </p>
              </div>
            )}
            
            {this.props.retryButton && (
              <button 
                onClick={this.props.onRetry}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
