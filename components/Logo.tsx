import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = React.memo(({ className = "", size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} filter drop-shadow-[0_0_12px_rgba(0,246,255,0.5)]`}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F6FF" />
          <stop offset="100%" stopColor="#585FD8" />
        </linearGradient>
      </defs>
      
      <path 
        d="M25 75 A 32 32 0 1 1 72 45" 
        stroke="url(#logo-gradient)" 
        strokeWidth="6" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      <path 
        d="M25 75 L52 45 L79 75" 
        stroke="url(#logo-gradient)" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      <circle cx="72" cy="45" r="4.5" fill="url(#logo-gradient)" />
      
      <line x1="79" y1="36" x2="88" y2="28" stroke="url(#logo-gradient)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="83" y1="45" x2="93" y2="45" stroke="url(#logo-gradient)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="79" y1="54" x2="88" y2="62" stroke="url(#logo-gradient)" strokeWidth="4.5" strokeLinecap="round" />
      
      <rect x="42" y="65" width="5.5" height="10" rx="1.5" fill="url(#logo-gradient)" opacity="0.6" />
      <rect x="50" y="55" width="5.5" height="20" rx="1.5" fill="url(#logo-gradient)" />
      <rect x="58" y="68" width="5.5" height="7" rx="1.5" fill="url(#logo-gradient)" opacity="0.6" />
    </svg>
  );
});

Logo.displayName = 'Logo';
export default Logo;