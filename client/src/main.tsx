import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserRouter } from 'react-router-dom';
import { initSentry } from './lib/sentry';
import App from './App';
import './styles/globals.css';

// Initialize Sentry before rendering
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">:(</div>
            <h1 className="text-xl font-semibold text-slate-800 mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-600 mb-4">
              We've been notified and are working on a fix.
            </p>
            {import.meta.env.DEV && error instanceof Error && (
              <pre className="text-left text-xs bg-red-50 text-red-800 p-3 rounded mb-4 overflow-auto">
                {error.message}
              </pre>
            )}
            <button
              onClick={resetError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}
      onError={(error) => {
        console.error('React Error Boundary caught:', error);
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
