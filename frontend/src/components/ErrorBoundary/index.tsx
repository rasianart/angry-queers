import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='p-5 mx-5 border-2 border-dashed border-red-400 rounded-lg text-center bg-red-50 text-red-700'>
          <h2>⚠️ Something went wrong</h2>
          <p className='mb-4'>
            There was an error loading the Safety Map component.
          </p>
          <details className='text-left max-w-md mx-auto'>
            <summary className='cursor-pointer font-medium mb-2'>
              Error Details (click to expand)
            </summary>
            <pre className='text-xs bg-gray-100 p-2 rounded overflow-auto'>
              {this.state.error?.message || 'Unknown error'}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className='mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
