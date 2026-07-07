import LogoIcon from './LogoIcon';

export function LoginBrandLogo({ large = false }) {
    const box = large ? 'w-16 h-16' : 'w-14 h-14';

    return (
        <div className={`${box} relative shrink-0`}>
            <div className={`${box} rounded-2xl p-[2px] bg-gradient-to-br from-brand-navy via-pink-800 to-brand-orange shadow-xl shadow-black/30 overflow-hidden`}>
                <LogoIcon className="w-full h-full rounded-[14px]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-orange border-2 border-slate-900 flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="currentColor" aria-hidden="true">
                    <path d="M6 1.5L7 4.5H10L7.75 6.25L8.5 9.5L6 7.75L3.5 9.5L4.25 6.25L2 4.5H5L6 1.5Z" />
                </svg>
            </div>
        </div>
    );
}

export function LoginBranding({ compact = false }) {
    const sloganGlow = 'drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]';
    const textGlow = 'drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]';

    return (
        <div className={compact ? 'text-center mb-8' : ''}>
            <div className={`flex items-center gap-4 ${compact ? 'justify-center' : ''}`}>
                <LoginBrandLogo large={!compact} />
                <div className={compact ? '' : 'pt-1'}>
                    <h1 className={`font-black tracking-wide leading-none text-white ${sloganGlow} ${compact ? 'text-2xl' : 'text-4xl xl:text-5xl'}`}>
                        WAN<span className="text-pink-300">TEX</span>
                    </h1>
                    <p className={`text-[10px] sm:text-xs text-white uppercase tracking-[0.25em] mt-1.5 font-semibold ${textGlow}`}>
                        ERP de gestion textile
                    </p>
                </div>
            </div>

            <p className={`text-white font-bold ${sloganGlow} ${compact ? 'text-sm mt-4' : 'text-lg xl:text-2xl mt-8'} leading-snug`}>
                <span className="text-pink-200">Pilotez votre atelier de confection</span>
                {' '}
                <span className="text-white">en toute simplicité.</span>
            </p>

            <p className={`text-white/95 leading-relaxed ${textGlow} ${compact ? 'text-xs mt-3 max-w-xs mx-auto' : 'text-sm xl:text-base mt-4 max-w-md'}`}>
                Stocks, commandes, production… le tout dans{' '}
                <span className="text-pink-200 font-bold">Wantex</span>.
            </p>
        </div>
    );
}
