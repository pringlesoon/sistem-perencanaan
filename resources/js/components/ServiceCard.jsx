import React from 'react';
import { Palette, Megaphone, Gift, Video, Camera, ArrowRight } from 'lucide-react';

const iconMap = {
    Palette,
    Megaphone,
    Gift,
    Video,
    Camera,
};

const themeStyles = {
    D: {
        gradient: 'from-indigo-500 to-purple-600',
        lightBg: 'bg-indigo-50/70',
        border: 'border-indigo-100 hover:border-indigo-300',
        badge: 'bg-indigo-100 text-indigo-700',
        shadow: 'hover:shadow-indigo-100',
        button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    P: {
        gradient: 'from-sky-500 to-blue-600',
        lightBg: 'bg-sky-50/70',
        border: 'border-sky-100 hover:border-sky-300',
        badge: 'bg-sky-100 text-sky-700',
        shadow: 'hover:shadow-sky-100',
        button: 'bg-sky-600 hover:bg-sky-700 text-white',
    },
    S: {
        gradient: 'from-amber-500 to-orange-600',
        lightBg: 'bg-amber-50/70',
        border: 'border-amber-100 hover:border-amber-300',
        badge: 'bg-amber-100 text-amber-800',
        shadow: 'hover:shadow-amber-100',
        button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    M: {
        gradient: 'from-emerald-500 to-teal-600',
        lightBg: 'bg-emerald-50/70',
        border: 'border-emerald-100 hover:border-emerald-300',
        badge: 'bg-emerald-100 text-emerald-800',
        shadow: 'hover:shadow-emerald-100',
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    L: {
        gradient: 'from-rose-500 to-pink-600',
        lightBg: 'bg-rose-50/70',
        border: 'border-rose-100 hover:border-rose-300',
        badge: 'bg-rose-100 text-rose-800',
        shadow: 'hover:shadow-rose-100',
        button: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
};

export default function ServiceCard({ service, onSelect }) {
    const IconComponent = iconMap[service.icon] || Palette;
    const theme = themeStyles[service.code] || themeStyles.D;

    return (
        <div
            onClick={() => onSelect(service.code)}
            className={`group relative bg-white rounded-2xl border ${theme.border} p-6 shadow-sm hover:shadow-xl ${theme.shadow} transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between`}
        >
            <div>
                {/* Header: Icon & Code Badge */}
                <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${theme.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-2">
                        {service.active_requests_count > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                {service.active_requests_count} aktif
                            </span>
                        )}
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${theme.badge}`}>
                            [{service.code}]
                        </span>
                    </div>
                </div>

                {/* Name & Description */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {service.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {service.description}
                </p>
            </div>

            {/* Action Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
                <button className={`px-4 py-2 w-full rounded-xl flex items-center justify-center space-x-2 font-bold text-xs transition-all duration-300 ${theme.button}`}>
                    <span>Ajukan Permohonan</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
