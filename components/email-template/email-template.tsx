import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
}

export function EmailTemplate({ firstName }: EmailTemplateProps) {
  return (
    <div
      style={{
        backgroundColor: "#0f172a",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "40px",
          border: "1px solid #1f2937",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "20px",
            color: "#ffffff",
          }}
        >
          Welcome, {firstName}! 🟢
        </h1>

        <p
          style={{
            fontSize: "18px",
            lineHeight: "30px",
            color: "#d1d5db",
          }}
        >
          Your spot on the Quest waitlist has been secured.
        </p>

        <p
          style={{
            fontSize: "16px",
            lineHeight: "28px",
            color: "#9ca3af",
            marginTop: "24px",
          }}
        >
          Here is what happens next:
        </p>

        <ul
          style={{
            color: "#d1d5db",
            lineHeight: "32px",
            paddingLeft: "20px",
            marginTop: "10px",
          }}
        >
          <li>You will get early access when we launch</li>
          <li>Founding member pricing locked in for life</li>
          <li>Exclusive updates as we build Quest</li>
        </ul>

        <div
          style={{
            marginTop: "40px",
            padding: "24px",
            backgroundColor: "#0b1220",
            borderRadius: "12px",
            border: "1px solid #1e293b",
          }}
        >
          <h2
            style={{
              fontSize: "22px",
              marginBottom: "16px",
              color: "#ffffff",
            }}
          >
            What is Quest?
          </h2>

          <p
            style={{
              fontSize: "16px",
              lineHeight: "28px",
              color: "#cbd5e1",
            }}
          >
            Quest scans 13,000+ cryptocurrencies 24/7 and surfaces trending
            coins, unusual market activity, and high-potential opportunities
            before the crowd notices them.
          </p>

          <p
            style={{
              fontSize: "16px",
              lineHeight: "28px",
              color: "#cbd5e1",
              marginTop: "20px",
            }}
          >
            No more checking multiple apps.
            <br />
            No more missing opportunities because information came too late.
          </p>

          <p
            style={{
              fontSize: "16px",
              lineHeight: "28px",
              color: "#ffffff",
              marginTop: "20px",
              fontWeight: "bold",
            }}
          >
            One dashboard. Real-time signals. Zero noise.
          </p>
        </div>

        <div
          style={{
            marginTop: "40px",
            textAlign: "center",
          }}
        >
          <a
            href="https://quest-xs.vercel.app"
            style={{
              display: "inline-block",
              padding: "14px 28px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              textDecoration: "none",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            Visit Quest
          </a>
        </div>

        <p
          style={{
            marginTop: "40px",
            color: "#94a3b8",
            fontSize: "15px",
            lineHeight: "26px",
          }}
        >
          We’re building fast and launch is coming soon.
          <br />
          Stay tuned — this is going to be worth the wait.
        </p>

        <p
          style={{
            marginTop: "30px",
            color: "#ffffff",
            fontWeight: "bold",
          }}
        >
          — Dave & The Quest Team
        </p>

        <hr
          style={{
            marginTop: "40px",
            borderColor: "#1f2937",
          }}
        />

        <p
          style={{
            marginTop: "20px",
            fontSize: "12px",
            color: "#6b7280",
            lineHeight: "20px",
          }}
        >
          You are receiving this email because you joined the Quest waitlist at
          https://quest-xs.vercel.app
        </p>
      </div>
    </div>
  );
}
