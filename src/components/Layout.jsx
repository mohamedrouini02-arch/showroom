import React from 'react';
import {
    Car,
    Users,
    Briefcase,
    LayoutDashboard,
    Key,
    DollarSign,
    Calendar
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children, title }) {
    const location = useLocation();
    const activeTab = location.pathname.substring(1) || 'dashboard';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'inventory', label: 'Inventory', icon: Car, path: '/inventory' },
        { id: 'sales', label: 'Sales', icon: DollarSign, path: '/sales' },
        { id: 'rentals', label: 'Rentals', icon: Key, path: '/rentals' },
        { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/appointments' },
        { id: 'customers', label: 'Customers', icon: Briefcase, path: '/customers' },
        { id: 'hr', label: 'Staff', icon: Users, path: '/hr' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 flex font-sans text-slate-100">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-20 lg:w-72 flex-col flex-shrink-0 border-r border-slate-800/50 bg-slate-950">
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-slate-800/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <Car className="text-white" size={20} />
                    </div>
                    <div className="ml-3 hidden lg:block">
                        <span className="font-bold text-lg block leading-none text-white tracking-tight">Wahid Auto</span>
                        <span className="text-xs text-slate-500 font-medium">Bazoul, Jijel</span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-3 lg:px-4 space-y-1">
                    {navItems.map(item => {
                        const isActive = activeTab === item.id || (item.id === 'dashboard' && location.pathname === '/');
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-xl transition-all duration-200 group ${
                                    isActive
                                        ? 'bg-gradient-to-r from-brand-600/20 to-brand-500/5 text-brand-400 border border-brand-500/20 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                }`}
                            >
                                <item.icon size={20} className={isActive ? 'text-brand-400' : 'group-hover:text-slate-300'} />
                                <span className="ml-3 hidden lg:block text-sm font-medium">{item.label}</span>
                                {isActive && <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 hidden lg:block">
                    <div className="glass-light rounded-xl p-4">
                        <p className="text-xs text-slate-500 font-medium">Showroom Manager</p>
                        <p className="text-xs text-slate-600 mt-1">v2.0 — PWA Ready</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden h-screen pb-16 md:pb-0">
                <header className="h-16 md:h-20 glass border-b border-slate-800/50 flex items-center justify-between px-5 md:px-8 flex-shrink-0">
                    <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                        {title || (activeTab === 'hr' ? 'Human Resources' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                            Online
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-800/50 z-40 safe-area-pb">
                <nav className="flex justify-around items-center h-16 px-2">
                    {navItems.slice(0, 5).map(item => {
                        const isActive = activeTab === item.id || (item.id === 'dashboard' && location.pathname === '/');
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                                    isActive
                                        ? 'text-brand-400'
                                        : 'text-slate-600'
                                }`}
                            >
                                <item.icon size={20} />
                                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
