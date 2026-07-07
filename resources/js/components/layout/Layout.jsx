import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardSection from '../dashboard/DashboardSection';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { pathname } = useLocation();
    const isDashboard = pathname === '/';

    const toggleSidebar = () => setSidebarOpen((open) => !open);

    return (
        <div className="min-h-screen h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
            <AnimatePresence initial={false}>
                {sidebarOpen && (
                    <motion.div
                        key="desktop-sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 288, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        className="hidden lg:block shrink-0 overflow-hidden h-screen"
                    >
                        <Sidebar onTogglePanel={toggleSidebar} />
                    </motion.div>
                )}
            </AnimatePresence>

            {mobileOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
                    <Sidebar mobile onClose={() => setMobileOpen(false)} onTogglePanel={() => setMobileOpen(false)} />
                </>
            )}

            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <Header
                    onMenuClick={() => setMobileOpen(true)}
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />

                {isDashboard && (
                    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
                        <DashboardSection />
                    </div>
                )}

                {isDashboard ? (
                    <main className="hidden" aria-hidden="true">
                        <Outlet />
                    </main>
                ) : (
                    <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 lg:p-6">
                        <Outlet />
                    </main>
                )}

                <footer className="mt-auto shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                    © {new Date().getFullYear()} Wantex — Excellence en confection textile | v1.0.0
                </footer>
            </div>
        </div>
    );
}
