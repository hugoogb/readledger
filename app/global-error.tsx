"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#0a0a0a",
          color: "#e5e5e5",
        }}
      >
        <div style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "1rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "1.5rem",
            }}
          >
            ⚠
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#a3a3a3",
              marginBottom: "1.5rem",
              lineHeight: 1.5,
            }}
          >
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#737373",
                marginBottom: "1.5rem",
              }}
            >
              Digest: {error.digest}
            </p>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <button
              onClick={reset}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#6366f1",
                color: "#fff",
                borderRadius: "0.75rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                border: "1px solid #333",
                borderRadius: "0.75rem",
                fontWeight: 500,
                color: "#e5e5e5",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
