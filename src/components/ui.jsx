import React from 'react';
import { X } from 'lucide-react';

export const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false, size = 'md', type = 'button' }) => {
    const baseStyle = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";
    const sizes = {
        sm: "px-3 py-1.5 text-xs gap-1.5",
        md: "px-5 py-2.5 text-sm gap-2",
        lg: "px-7 py-3.5 text-base gap-2"
    };
    const variants = {
        primary: "bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-lg shadow-brand-500/20 focus:ring-brand-500",
        secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500",
        danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 focus:ring-red-500",
        success: "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 focus:ring-emerald-500",
        ghost: "hover:bg-slate-800 text-slate-400 hover:text-white focus:ring-slate-500",
        outline: "border border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300 focus:ring-brand-500"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}
            disabled={disabled}
        >
            {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
            {children}
        </button>
    );
};

export const Card = ({ title, value, icon: Icon, subtext, color = "brand" }) => {
    const colorMap = {
        brand: { bg: 'from-brand-500/20 to-brand-600/5', icon: 'text-brand-400', border: 'border-brand-500/10' },
        green: { bg: 'from-emerald-500/20 to-emerald-600/5', icon: 'text-emerald-400', border: 'border-emerald-500/10' },
        purple: { bg: 'from-purple-500/20 to-purple-600/5', icon: 'text-purple-400', border: 'border-purple-500/10' },
        orange: { bg: 'from-orange-500/20 to-orange-600/5', icon: 'text-orange-400', border: 'border-orange-500/10' },
        blue: { bg: 'from-blue-500/20 to-blue-600/5', icon: 'text-blue-400', border: 'border-blue-500/10' },
        red: { bg: 'from-red-500/20 to-red-600/5', icon: 'text-red-400', border: 'border-red-500/10' },
    };
    const c = colorMap[color] || colorMap.brand;

    return (
        <div className={`stat-card bg-gradient-to-br ${c.bg} backdrop-blur-sm p-6 border ${c.border} glow-brand`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-400 tracking-wide uppercase">{title}</p>
                    <h3 className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-slate-800/80 ${c.icon}`}>
                    <Icon size={24} />
                </div>
            </div>
            {subtext && (
                <div className="mt-4 pt-3 border-t border-slate-800/50">
                    <span className="text-xs font-medium text-slate-500">{subtext}</span>
                </div>
            )}
        </div>
    );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const maxWidth = size === 'lg' ? 'max-w-4xl' : size === 'xl' ? 'max-w-6xl' : 'max-w-lg';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div
                className={`glass rounded-2xl shadow-2xl shadow-black/30 w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-slide-up`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-slate-800/50 sticky top-0 glass z-10 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const Input = ({ label, className = '', ...props }) => (
    <div className={`mb-4 ${className}`}>
        {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
        <input
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all outline-none text-sm"
            {...props}
        />
    </div>
);

export const Select = ({ label, options, className = '', ...props }) => (
    <div className={`mb-4 ${className}`}>
        {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
        <select
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all outline-none text-sm appearance-none cursor-pointer"
            {...props}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
            ))}
        </select>
    </div>
);
