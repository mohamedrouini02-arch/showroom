import React from 'react';
import { XCircle } from 'lucide-react';

export const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false, size = 'md', type = 'button' }) => {
    const baseStyle = "flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizes = {
        sm: "px-2 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
        secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
        danger: "bg-red-50 hover:bg-red-100 text-red-600 focus:ring-red-500 dark:bg-red-900/20 dark:hover:bg-red-900/30",
        success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
        whatsapp: "bg-green-500 hover:bg-green-600 text-white focus:ring-green-400",
        outline: "border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}
            disabled={disabled}
        >
            {Icon && <Icon size={size === 'sm' ? 14 : 18} className="mr-2" />}
            {children}
        </button>
    );
};

export const Card = ({ title, value, icon: Icon, trend, subtext, color = "blue" }) => {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
        green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
        red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
            {subtext && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={`font-medium ${trend === 'up' ? 'text-green-600' : 'text-slate-500'}`}>
                        {subtext}
                    </span>
                </div>
            )}
        </div>
    );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const maxWidth = size === 'lg' ? 'max-w-4xl' : 'max-w-lg';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <XCircle size={24} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const Input = ({ label, className, ...props }) => (
    <div className={`mb-4 ${className}`}>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors disabled:bg-slate-100 disabled:text-slate-500"
            {...props}
        />
    </div>
);

export const Select = ({ label, options, className, ...props }) => (
    <div className={`mb-4 ${className}`}>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <select
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors"
            {...props}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);
