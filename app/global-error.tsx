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
          backgroundColor: "#f6f2e9",
          color: "#1d1b18",
        }}
      >
        <div style={{ maxWidth: "28rem", width: "100%" }}>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "1.875rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#6f675b",
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
                color: "#6f675b",
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
                backgroundColor: "#1f4a3a",
                color: "#fbf8f1",
                borderRadius: "6px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                border: "1px solid #cfc4b0",
                borderRadius: "6px",
                fontWeight: 500,
                color: "#1d1b18",
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
