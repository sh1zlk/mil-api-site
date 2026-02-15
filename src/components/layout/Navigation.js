import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Radio, Settings, BarChart3 } from 'lucide-react';

const Navigation = () => {
    const location = useLocation();

    const navLinks = [
        { path: '/', label: 'Моніторинг', icon: Radio },
        { path: '/analytics', label: 'Аналітика', icon: BarChart3 },
        { path: '/admin', label: 'Адміністрування', icon: Settings }
    ];

    return (
        <nav className="bg-gray-800 border-b border-gray-600">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-green-400" />
                        <span className="text-white font-bold text-lg">Система моніторингу</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {navLinks.map(({ path, label, icon: Icon }) => {
                            const isActive = location.pathname === path;
                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                        isActive
                                            ? 'bg-green-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium">{label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;