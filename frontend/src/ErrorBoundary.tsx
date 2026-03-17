import React from 'react';

interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, background: '#0a0a14',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'monospace', padding: 24, gap: 16,
        }}>
          <div style={{ fontSize: 48 }}>🚨</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>Something went wrong</div>
          <div style={{
            background: '#1a1a2e', padding: 16, borderRadius: 8,
            color: '#f87171', fontSize: 13, maxWidth: 480, wordBreak: 'break-word',
          }}>
            {this.state.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 28px', background: '#06b6d4', border: 'none',
              borderRadius: 24, color: '#fff', fontWeight: 'bold', cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
