import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Trello, Settings as SettingsIcon, Hexagon } from 'lucide-react';
import { cn } from '../components/Toast';

const navItems = [
    { path: '/', icon: Users, label: 'Serviços' },
    { path: '/status', icon: Trello, label: 'Status' },
    { path: '/financeiro', icon: LayoutDashboard, label: 'Financeiro' },
    { path: '/configuracoes', icon: SettingsIcon, label: 'Configurações' },
];

export const AppLayout: React.FC = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 glass z-40 border-r border-gray-200 dark:border-primary-500/10">
                <div className="flex items-center gap-3 px-6 py-8">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/30 glow-purple">
                        <Hexagon size={24} className="fill-current opacity-20 absolute" />
                        <Hexagon size={20} />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-primary-300 text-glow-purple">
                        GESTÃO EXPANDIX
                    </span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 group relative overflow-hidden mb-1",
                                    isActive
                                        ? "text-white bg-primary-600 shadow-lg shadow-primary-600/40 glow-purple"
                                        : "text-gray-600 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-primary-500/10"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={20} className={cn("transition-all duration-300", isActive && "scale-110 drop-shadow-[0_0_8px_#ffffff80]")} />
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen relative p-4 md:p-8">
                <div className="max-w-7xl mx-auto h-full">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 glass border-t border-gray-200 dark:border-primary-500/10 z-50 px-2 py-2 flex items-center justify-around pb-safe">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 gap-1",
                                isActive
                                    ? "text-primary-600 dark:text-primary-400"
                                    : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-primary-400"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                isActive && "bg-primary-100 dark:bg-primary-500/20 shadow-[0_0_15px_#a855f733]"
                            )}>
                                <item.icon size={22} className={cn(isActive && "scale-110")} />
                            </div>
                            <span className="text-[10px] font-bold tracking-wide">
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
};
