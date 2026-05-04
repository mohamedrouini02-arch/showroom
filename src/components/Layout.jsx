import React from 'react';
import {
    Car,
    Users,
    Briefcase,
    LayoutDashboard,
    Key,
    MapPin
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children, title }) {
    const location = useLocation();
    const activeTab = location.pathname.substring(1) || 'dashboard';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'inventory', label: 'Inventory', icon: Car, path: '/inventory' },
        { id: 'hr', label: 'Staff & HR', icon: Users, path: '/hr' },
        { id: 'customers', label: 'Customers', icon: Briefcase, path: '/customers' },
        { id: 'rentals', label: 'Rentals', icon: Key, path: '/rentals' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans text-slate-900 dark:text-slate-100">
            {/* Sidebar */}
            <div className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 transition-all duration-300">
                <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
                    <Car className="text-blue-500" size={28} />
                    <div className="ml-3 hidden lg:block">
                        <span className="font-bold text-lg block leading-none">Wahid Auto</span>
                        <span className="text-xs text-slate-400">Bazoul, Jijel</span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-2 lg:px-4 space-y-1">
                    {navItems.map(item => {
                        const isActive = activeTab === item.id || (item.id === 'dashboard' && location.pathname === '/');
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <item.icon size={20} />
                                <span className="ml-3 hidden lg:block">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden h-screen">
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 lg:px-8">
                    <h1 className="text-xl font-semibold capitalize text-slate-800 dark:text-white">
                        {title || (activeTab === 'hr' ? 'Human Resources' : activeTab)}
                    </h1>
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <MapPin size={16} />
                        <span>Bazoul, Jijel, Algeria</span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
