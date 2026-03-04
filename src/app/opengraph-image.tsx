import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Conexão Play — 365 Conexões por Ano"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://horizons-cdn.hostinger.com/069f5e4f-58ed-423f-9c80-0c6cd4f85a01/eddfc832ca27ba52405ce133d722146f.jpg"
          alt=""
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(30,58,138,0.7) 0%, rgba(15,23,42,0.8) 50%, rgba(88,28,135,0.7) 100%)",
          }}
        />

        {/* Bottom gradient */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "50%",
            background:
              "linear-gradient(to top, rgba(2,6,23,0.95), transparent)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            textAlign: "center",
            padding: "40px",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "999px",
              padding: "8px 20px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase" as const,
                color: "#bfdbfe",
              }}
            >
              Networking Premium
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 0.95,
            }}
          >
            <span
              style={{
                fontSize: "80px",
                fontWeight: 900,
                color: "white",
                letterSpacing: "-3px",
              }}
            >
              Tenha 365
            </span>
            <span
              style={{
                fontSize: "80px",
                fontWeight: 900,
                letterSpacing: "-3px",
                background: "linear-gradient(to right, #bfdbfe, white, #bfdbfe)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              conexões
            </span>
            <span
              style={{
                fontSize: "80px",
                fontWeight: 900,
                color: "white",
                letterSpacing: "-3px",
              }}
            >
              por ano
            </span>
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "24px",
              color: "#cbd5e1",
              marginTop: "28px",
              fontWeight: 300,
            }}
          >
            O seu ano de transformação e negócios
          </p>
        </div>
      </div>
    ),
    { ...size }
  )
}
