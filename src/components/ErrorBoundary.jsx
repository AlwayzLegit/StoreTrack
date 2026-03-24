import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, you could send this to a logging service like Sentry
    console.error("StorTrack ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: "#090B11", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontFamily: "'DM Sans', system-ui, sans-serif", padding: 20,
        }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h2 style={{ color: "#E2E5F0", fontSize: 20, fontWeight: 700, margin: "0 0 12px" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#545870", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              An unexpected error occurred. Your data is safe — please refresh the page to continue.
            </p>
            <details style={{ textAlign: "left", background: "#111318", borderRadius: 10, padding: 16, border: "1px solid #1C1F2E", marginBottom: 24 }}>
              <summary style={{ color: "#545870", fontSize: 12, cursor: "pointer", marginBottom: 8 }}>Error details</summary>
              <pre style={{ color: "#E05555", fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "12px 28px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #5B8DEF, #7B65F0)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
