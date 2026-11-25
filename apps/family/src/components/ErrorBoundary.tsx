import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    if (import.meta.env.DEV) {
      console.error("App ErrorBoundary caught:", error);
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main
        role="alert"
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#f7f1e2",
          color: "#1e293b",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        <section
          style={{
            maxWidth: "440px",
            width: "100%",
            background: "#ffffff",
            borderRadius: "24px",
            padding: "28px 24px",
            boxShadow: "0 12px 32px rgba(30, 41, 59, 0.08)",
            textAlign: "center"
          }}
        >
          <h1 style={{ fontSize: "22px", margin: "0 0 12px" }}>
            小芽需要休息一下 · Little Sprout needs a moment
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.6, margin: "0 0 20px", color: "#475569" }}>
            刚才页面遇到了一点小问题，你的学习记录仍安全保存在本机。请点下方按钮重试或刷新页面。
            <br />
            Something unexpected happened. Your local progress is still safe. Please retry or reload.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                minHeight: "44px",
                padding: "10px 20px",
                borderRadius: "999px",
                border: "none",
                background: "#0f766e",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              重试 / Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                minHeight: "44px",
                padding: "10px 20px",
                borderRadius: "999px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#1e293b",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              刷新页面 / Reload
            </button>
          </div>
        </section>
      </main>
    );
  }
}
