import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import LogoIcon from './LogoIcon';

const TAGLINE = "Excellence en confection textile";

const sizes = { sm: 'w-8 h-8', md: 'w-11 h-11', lg: 'w-16 h-16' };

function BrandText({ pageTitle, dark = false }) {
    return (
        <div className="min-w-0">
            <div className={`font-bold text-lg leading-tight tracking-wide truncate ${dark ? 'text-white' : 'text-brand-navy dark:text-white'}`}>
                WAN<span className="text-brand-orange">TEX</span>
            </div>
            {pageTitle ? (
                <div className={`text-[11px] font-medium truncate mt-0.5 ${dark ? 'text-pink-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {pageTitle}
                </div>
            ) : (
                <div className={`text-[10px] leading-tight max-w-[180px] ${dark ? 'text-pink-200/80' : 'text-slate-500 dark:text-slate-400'}`}>
                    {TAGLINE}
                </div>
            )}
        </div>
    );
}

export default function Logo({ size = 'md', showText = true }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`${sizes[size]} relative rounded-xl overflow-hidden shadow-lg shadow-pink-900/25 shrink-0`}>
                <LogoIcon className="w-full h-full" />
            </div>
            {showText && <BrandText />}
        </div>
    );
}

export function SidebarBrand({ pageTitle }) {
    return (
        <NavLink to="/" className="flex items-center gap-3 group">
            <motion.div
                whileHover={{ scale: 1.06, rotate: 2 }}
                whileTap={{ scale: 0.97 }}
                className="relative w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-pink-900/30 shrink-0"
            >
                <LogoIcon className="w-full h-full" />
                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
            </motion.div>
            <BrandText pageTitle={pageTitle} dark />
        </NavLink>
    );
}

export function NavbarBrand({ pageTitle }) {
    return (
        <div className="navbar-brand group flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <NavLink to="/">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-lg shadow-pink-900/25 shrink-0"
                >
                    <LogoIcon className="w-full h-full" />
                    <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
                </motion.div>
            </NavLink>

            <div className="min-w-0 hidden sm:block border-l border-slate-200 dark:border-slate-700 pl-3">
                <div className="font-bold text-base sm:text-lg leading-tight tracking-wide truncate">
                    <span className="text-brand-navy dark:text-white">WAN</span>
                    <span className="text-brand-orange">TEX</span>
                </div>
                {pageTitle && (
                    <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">
                        {pageTitle}
                    </div>
                )}
            </div>

            {pageTitle && (
                <div className="sm:hidden text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
                    {pageTitle}
                </div>
            )}
        </div>
    );
}
