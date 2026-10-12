import React, { useState, useRef, useEffect } from 'react';
import { Clock, Check, X, ChevronDown } from 'lucide-react';

const PRESET_HOURS = [
    '07', '08', '09', '10', '11', '12',
    '13', '14', '15', '16', '17', '18', '19', '20', '21'
];

const PRESET_MINUTES = [
    '00', '05', '10', '15', '20', '25',
    '30', '35', '40', '45', '50', '55'
];

const QUICK_PRESETS = [
    '08:00', '09:00', '10:00', '11:00',
    '13:00', '14:00', '15:00', '16:00'
];

export default function TimePicker({
    value = '',
    onChange,
    placeholder = 'Pilih Waktu',
    required = false,
    className = '',
    id,
    name
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Parse value (HH:mm)
    const [hour, setHour] = useState(() => {
        if (value && value.includes(':')) {
            return value.split(':')[0].padStart(2, '0');
        }
        return '';
    });

    const [minute, setMinute] = useState(() => {
        if (value && value.includes(':')) {
            return value.split(':')[1].padStart(2, '0');
        }
        return '';
    });

    useEffect(() => {
        if (value && value.includes(':')) {
            const [h, m] = value.split(':');
            setHour(h ? h.padStart(2, '0') : '');
            setMinute(m ? m.padStart(2, '0') : '');
        } else if (!value) {
            setHour('');
            setMinute('');
        }
    }, [value]);

    // Close on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSelectQuick = (time) => {
        onChange?.(time);
        const [h, m] = time.split(':');
        setHour(h);
        setMinute(m);
        setIsOpen(false);
    };

    const handleHourClick = (h) => {
        setHour(h);
        const currentMin = minute || '00';
        setMinute(currentMin);
        onChange?.(`${h}:${currentMin}`);
    };

    const handleMinuteClick = (m) => {
        setMinute(m);
        const currentHour = hour || '08';
        setHour(currentHour);
        onChange?.(`${currentHour}:${m}`);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setHour('');
        setMinute('');
        onChange?.('');
    };

    const displayValue = value ? `${value} WIB` : '';

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input Trigger Button (No native browser time wheel!) */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                className={`w-full px-3 py-2 text-xs bg-white rounded-xl border flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
                    isOpen
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'border-slate-300 hover:border-slate-400'
                } ${!value ? 'text-slate-400' : 'text-slate-800 font-semibold'}`}
            >
                <div className="flex items-center space-x-2 truncate">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{displayValue || placeholder}</span>
                </div>
                <div className="flex items-center space-x-1 shrink-0 ml-1">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Hapus waktu"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Hidden input for HTML form validation if required */}
            <input
                type="text"
                name={name}
                id={id}
                value={value}
                required={required}
                onChange={() => {}}
                className="sr-only"
                tabIndex={-1}
            />

            {/* Modern Custom Dropdown Popover */}
            {isOpen && (
                <div className="absolute left-0 right-0 sm:right-auto sm:w-72 mt-1.5 p-3 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Pilih Waktu (WIB)</span>
                        </span>
                        {value && (
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                {value} WIB
                            </span>
                        )}
                    </div>

                    {/* Quick Presets */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jam Populer</p>
                        <div className="grid grid-cols-4 gap-1">
                            {QUICK_PRESETS.map((t) => (
                                <button
                                    type="button"
                                    key={t}
                                    onClick={() => handleSelectQuick(t)}
                                    className={`py-1 px-1.5 text-[11px] font-bold rounded-lg border transition-all text-center ${
                                        value === t
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                            : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-200'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dual Columns: Jam & Menit */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        {/* Kolom Jam */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam</span>
                                <span className="text-[10px] font-bold text-indigo-600">{hour || '--'}</span>
                            </div>
                            <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
                                {PRESET_HOURS.map((h) => (
                                    <button
                                        type="button"
                                        key={h}
                                        onClick={() => handleHourClick(h)}
                                        className={`w-full py-1 px-2 text-xs font-semibold rounded-lg text-left transition-colors flex items-center justify-between ${
                                            hour === h
                                                ? 'bg-indigo-600 text-white font-bold'
                                                : 'hover:bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        <span>{h}:00</span>
                                        {hour === h && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Kolom Menit */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menit</span>
                                <span className="text-[10px] font-bold text-indigo-600">:{minute || '--'}</span>
                            </div>
                            <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
                                {PRESET_MINUTES.map((m) => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => handleMinuteClick(m)}
                                        className={`w-full py-1 px-2 text-xs font-semibold rounded-lg text-left transition-colors flex items-center justify-between ${
                                            minute === m
                                                ? 'bg-indigo-600 text-white font-bold'
                                                : 'hover:bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        <span>:{m}</span>
                                        {minute === m && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Selesai / Konfirmasi */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Format 24 Jam</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-xs"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
