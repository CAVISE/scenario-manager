import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function setStoreError(error: Error | null) {
  import('../../../../../store').then(({ useEditorStore }) => {
    useEditorStore.getState().setError(error);
  });
}

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
