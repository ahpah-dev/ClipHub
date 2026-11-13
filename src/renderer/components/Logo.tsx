import React from 'react';

interface LogoProps {
  size?: number;
}

export const ClipHubLogo: React.FC<LogoProps> = ({ size = 28 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id="chBgGrad" x1="48" y1="32" x2="464" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="50%" stopColor="#131B31" />
          <stop offset="100%" stopColor="#090D18" />
        </linearGradient>
        <radialGradient id="chAmbient" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
          <stop offset="55%" stopColor="#818CF8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#090D18" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="chStroke" x1="64" y1="64" x2="448" y2="448" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.48" />
          <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="chPrismBack" x1="120" y1="120" x2="360" y2="390" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id="chPrismFront" x1="175" y1="145" x2="390" y2="375" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.96" />
          <stop offset="48%" stopColor="#BAE6FD" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="chSpark" x1="340" y1="100" x2="410" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>

      <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#chBgGrad)" />
      <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#chAmbient)" />
      <rect x="25.5" y="25.5" width="461" height="461" rx="110.5" stroke="url(#chStroke)" strokeWidth="4" />

      <rect
        x="92"
        y="106"
        width="328"
        height="300"
        rx="52"
        fill="#FFFFFF"
        fillOpacity="0.04"
        stroke="#FFFFFF"
        strokeOpacity="0.14"
        strokeWidth="3"
      />
      <rect
        x="128"
        y="148"
        width="166"
        height="216"
        rx="34"
        fill="url(#chPrismBack)"
        stroke="#BAE6FD"
        strokeOpacity="0.5"
        strokeWidth="3"
      />
      <path
        d="M214 156.5C214 142.8 229.1 134.5 240.7 141.8L374.2 225.3C385.1 232.1 385.1 247.9 374.2 254.7L240.7 338.2C229.1 345.5 214 337.2 214 323.5V156.5Z"
        transform="translate(0, 16)"
        fill="url(#chPrismFront)"
        stroke="#FFFFFF"
        strokeOpacity="0.72"
        strokeWidth="3"
      />
      <path
        d="M366 108L373.5 130.5L396 138L373.5 145.5L366 168L358.5 145.5L336 138L358.5 130.5L366 108Z"
        fill="url(#chSpark)"
      />
    </svg>
  );
};
