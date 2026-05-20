interface Props {
  className?: string;
  size?: number;
}

export default function SchoolLogo({ className = "w-8 h-8", size = 24 }: Props) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      width={size}
      height={size}
    >
      {/* Neoclassical building structure */}
      <path 
        d="M12 2L2 7V9H22V7L12 2Z" 
        fill="url(#logo-grad-primary)" 
      />
      <rect x="4" y="10" width="2" height="8" rx="0.5" fill="url(#logo-grad-primary)" />
      <rect x="9" y="10" width="2" height="8" rx="0.5" fill="url(#logo-grad-primary)" />
      <rect x="13" y="10" width="2" height="8" rx="0.5" fill="url(#logo-grad-primary)" />
      <rect x="18" y="10" width="2" height="8" rx="0.5" fill="url(#logo-grad-primary)" />
      <rect x="2" y="19" width="20" height="3" rx="1" fill="url(#logo-grad-primary)" />
      
      {/* Premium Rising Stock trend arrow cutting through the school facade */}
      <path 
        d="M5 16L10 11L13 14L21 5.5" 
        stroke="#F04452" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M17 5.5H21V9.5" 
        stroke="#F04452" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      <defs>
        <linearGradient id="logo-grad-primary" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#475569" /> {/* Slate 600 */}
          <stop offset="100%" stopColor="#0F172A" /> {/* Slate 900 */}
        </linearGradient>
      </defs>
    </svg>
  );
}
