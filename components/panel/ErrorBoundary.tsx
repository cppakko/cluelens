import React, { Component, ReactNode } from 'react';
import ErrorPage from './ErrorPage';
import i18next from 'i18next';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  compact?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorPage
          message={this.state.error?.message || i18next.t('error.renderError')}
          compact={this.props.compact}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
