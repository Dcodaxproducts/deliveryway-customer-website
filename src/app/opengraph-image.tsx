import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Deliveryway fresh food delivery";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const getPublicImageDataUrl = async (filename: string) => {
  const imageBuffer = await readFile(join(process.cwd(), "public", filename));

  return `data:image/png;base64,${imageBuffer.toString("base64")}`;
};

export default async function Image() {
  const [heroImage, logoImage] = await Promise.all([
    getPublicImageDataUrl("hero.png"),
    getPublicImageDataUrl("logo.png"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#120a08",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <img
          src={heroImage}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.72,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(9, 9, 10, 0.88) 0%, rgba(9, 9, 10, 0.62) 48%, rgba(206, 24, 27, 0.32) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "72px 84px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 86,
                height: 86,
                borderRadius: 28,
                background: "#ffffff",
                boxShadow: "0 20px 55px rgba(0, 0, 0, 0.24)",
            }}
          >
            <img
                src={logoImage}
                alt=""
                width={54}
                height={58}
                style={{
                  width: 54,
                  height: 58,
                  objectFit: "contain",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  letterSpacing: 0,
                }}
              >
                Deliveryway
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                Fresh meals, warm service
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div
              style={{
                display: "flex",
                maxWidth: 780,
                fontSize: 84,
                lineHeight: 0.92,
                fontWeight: 900,
                letterSpacing: 0,
              }}
            >
              Taste the American style
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 700,
                fontSize: 30,
                lineHeight: 1.32,
                fontWeight: 600,
                color: "rgba(255,255,255,0.86)",
              }}
            >
              Order delivery or pickup, explore live offers, and save your favourites from your local kitchen.
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                alignSelf: "flex-start",
                borderRadius: 999,
                background: "#ce181b",
                padding: "18px 28px",
                fontSize: 24,
                fontWeight: 800,
                boxShadow: "0 18px 45px rgba(206, 24, 27, 0.34)",
              }}
            >
              Order now
              <span style={{ fontSize: 28 }}>→</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
