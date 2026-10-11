'use client';

import React from 'react';
import { ApiError } from '../../lib/api';
import { AlertCircle, RefreshCw, ServerCrash, AlertTriangle } from 'lucide-react';

interface ErrorPanelProps {
  error: Error | ApiError | null;
  onRetry: () => void;
}

export function ErrorPanel({ error, onRetry }: ErrorPanelProps) {
  if (!error) return null;

  const apiError = error as ApiError;
  const isUnavailable = apiError.isUnavailable;
  const isUnsupportedSchema = apiError.isUnsupportedSchema;

  return (
    <div
      role="alert"
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0d14]/90 backdrop-blur-md p-6"
    >
      <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow accent */}
        <div
          className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isUnsupportedSchema ? 'bg-amber-500' : 'bg-rose-500'
          }`}
        />

        <div className="flex justify-center mb-5">
          {isUnavailable ? (
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <ServerCrash className="w-8 h-8" />
            </div>
          ) : isUnsupportedSchema ? (
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
          {isUnavailable
            ? 'Service Unavailable'
            : isUnsupportedSchema
            ? 'Incompatible Schema Version'
            : 'Failed to Load Graph Data'}
        </h2>

        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
          {isUnavailable
            ? 'The backend graph service is currently unreachable or starting up. Please verify the FastAPI service is running.'
            : isUnsupportedSchema
            ? `The backend returned schema version "${apiError.schemaVersion}", which is incompatible with this client version. Please update or refresh the browser.`
            : error.message || 'An unexpected error occurred while communicating with the backend.'}
        </p>

        {isUnsupportedSchema ? (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-colors shadow-lg shadow-amber-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Application</span>
          </button>
        ) : (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-lg shadow-blue-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    </div>
  );
}
