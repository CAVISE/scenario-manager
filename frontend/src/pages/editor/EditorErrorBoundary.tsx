import { Component, type ErrorInfo } from 'react';
import { Props, setStoreError, State } from './EditorErrorBoundary.types';

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[EditorErrorBoundary]', error, info.componentStack);
    setStoreError(error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
