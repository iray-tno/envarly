import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Without this, an uncaught render error anywhere in the tree unmounts the
 * whole app and leaves a blank white window with no way to diagnose it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught render error", error, info);
    this.setState({ info });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "24px",
          fontFamily: "sans-serif",
          color: "#e5e5e5",
          background: "#1a1a1a",
          height: "100vh",
          overflow: "auto",
        }}
      >
        <h1 style={{ fontSize: "16px", margin: 0 }}>Envarly crashed</h1>
        <p style={{ fontSize: "13px", opacity: 0.8, margin: 0 }}>
          Please restart the app. If this keeps happening, copy the details below and report it.
        </p>
        <pre style={{ fontSize: "11px", whiteSpace: "pre-wrap", margin: 0 }}>
          {error.message}
          {"\n"}
          {error.stack}
          {info?.componentStack}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            alignSelf: "flex-start",
            padding: "6px 12px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
