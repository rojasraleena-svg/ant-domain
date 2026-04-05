import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "蚁域";
export const size = { width: 32, height: 32 };
export const contentType = "image/svg+xml";

export default function Icon() {
  return new ImageResponse(
    (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 背景圆 */}
        <circle cx="16" cy="16" r="15" fill="#B4712E" />
        <circle cx="16" cy="16" r="13" fill="#D4943A" />

        {/* 蚂蚁身体 */}
        {/* 腹部（大椭圆） */}
        <ellipse cx="16" cy="21" rx="7.5" ry="4.5" fill="#3D2314" stroke="#2A1810" strokeWidth="0.8" />
        {/* 胸部（圆） */}
        <circle cx="16" cy="12" r="5" fill="#3D2314" stroke="#2A1810" strokeWidth="0.8" />

        {/* 触角 */}
        <path d="M13 8 Q10 4 8 6" stroke="#3D2314" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M19 8 Q22 4 24 6" stroke="#3D2314" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* 腿 */}
        <g stroke="#3D2314" strokeWidth="1.1" strokeLinecap="round">
          <line x1="9" y1="20" x2="5" y2="25" />
          <line x1="9" y1="21" x2="4" y2="24" />
          <line x1="9" y1="22" x2="6" y2="27" />

          <line x1="23" y1="20" x2="27" y2="25" />
          <line x1="23" y1="21" x2="28" y2="24" />
          <line x1="23" y1="22" x2="26" y2="27" />
        </g>
      </svg>
    ),
    {
      width: 32,
      height: 32,
    }
  );
}
