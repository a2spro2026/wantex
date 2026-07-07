export default function LogoIcon({ className = 'w-full h-full' }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <defs>
                <linearGradient id="wantex-icon-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4A1942" />
                    <stop offset="55%" stopColor="#831843" />
                    <stop offset="100%" stopColor="#BE185D" />
                </linearGradient>
                <linearGradient id="wantex-icon-thread" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDF2F8" />
                    <stop offset="100%" stopColor="#F9A8D4" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="10" fill="url(#wantex-icon-bg)" />
            <path
                d="M10 32 C12.5 22 14 27 16.5 23 C19 19 20.5 25 23 21 C25.5 17 27 22 29.5 19 C32 16 33.5 21 36 18"
                fill="none"
                stroke="url(#wantex-icon-thread)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line x1="35" y1="12" x2="31" y2="34" stroke="#FBCFE8" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="35.5" cy="11" rx="1.2" ry="2" fill="#F9A8D4" transform="rotate(28 35.5 11)" />
            <text x="24" y="30" textAnchor="middle" fill="#FFFFFF" fontFamily="Georgia, serif" fontSize="16" fontWeight="700">
                W
            </text>
        </svg>
    );
}
