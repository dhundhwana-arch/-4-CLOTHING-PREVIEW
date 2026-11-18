import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface PreviewErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of the subtree when a render error occurs. */
  fallback: (error: Error) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

/**
 * Rendering error boundary around the WebGL canvas subtree. A render-time
 * failure (driver crash, context loss surfacing as a throw, programming
 * error) degrades to the fallback UI instead of a blank page.
 */
export class PreviewErrorBoundary extends Component<PreviewErrorBoundaryProps, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}
