import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

function renderIcon(Icon, className = 'w-3.5 h-3.5') {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    const IconComponent = Icon;
    return <IconComponent className={className} />;
}

export default function CustomSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Pilih Opsi',
    className = '',
    dropdownClassName = '',
    disabled = false,
    icon = null,
    align = 'auto', // 'auto' | 'left' | 'right'
    fullWidth = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [computedAlign, setComputedAlign] = useState(align === 'right' ? 'right' : 'left');
    const containerRef = useRef(null);

    // Calculate smart alignment
    useEffect(() => {
        if (!isOpen) return;
        if (align === 'auto') {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                // If there's less than 260px space on the right, align right to prevent overflow
                if (window.innerWidth - rect.left < 260) {
                    setComputedAlign('right');
                } else {
                    setComputedAlign('left');
                }
            }
        } else {
            setComputedAlign(align);
        }
    }, [isOpen, align]);

    // Close on click outside or Escape key
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
            document.addEventListener('touchstart', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    const handleSelect = (val) => {
        if (typeof onChange === 'function') {
            onChange(val);
        }
        setIsOpen(false);
    };

    const alignClasses = computedAlign === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left';

    return (
        <div
            ref={containerRef}
            className={`relative inline-block text-left ${fullWidth ? 'w-full' : 'w-full sm:w-auto'}`}
        >
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    disabled
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : isOpen
                        ? 'bg-white border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs text-slate-900'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/90 text-slate-700 shadow-2xs'
                } ${className}`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon ? (
                        <span className="shrink-0 text-indigo-600">
                            {renderIcon(selectedOption.icon, 'w-3.5 h-3.5')}
                        </span>
                    ) : icon ? (
                        <span className="shrink-0 text-slate-400">
                            {renderIcon(icon, 'w-3.5 h-3.5')}
                        </span>
                    ) : null}

                    {selectedOption?.colorDot && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOption.colorDot}`} />
                    )}

                    <span className={`truncate ${!selectedOption ? 'text-slate-400 font-normal' : 'text-slate-800'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>

                <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={`absolute z-50 mt-1.5 ${alignClasses} ${
                        fullWidth ? 'w-full' : 'min-w-full sm:min-w-[240px]'
                    } max-h-72 overflow-y-auto custom-scrollbar bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-1.5 animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}
                >
                    <div className="space-y-0.5">
                        {options.map((opt) => {
                            const isSelected = String(opt.value) === String(value);

                            return (
                                <button
                                    key={String(opt.value)}
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer select-none ${
                                        isSelected
                                            ? 'bg-indigo-50 text-indigo-900 font-bold'
                                            : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900 font-medium'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        {opt.icon && (
                                            <span
                                                className={`p-1 rounded-lg shrink-0 ${
                                                    opt.iconBg || (isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500')
                                                }`}
                                            >
                                                {renderIcon(opt.icon, 'w-3.5 h-3.5')}
                                            </span>
                                        )}

                                        {opt.colorDot && (
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${opt.colorDot}`} />
                                        )}

                                        <div className="truncate">
                                            <div className="truncate">{opt.label}</div>
                                            {opt.sublabel && (
                                                <div className="text-[10px] text-slate-400 font-normal truncate">
                                                    {opt.sublabel}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
