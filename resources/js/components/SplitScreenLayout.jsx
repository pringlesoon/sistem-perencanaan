import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Clock, AlertCircle, FileCheck, PhoneCall } from 'lucide-react';

export default function SplitScreenLayout({ service, children }) {
    const [mobileRulesOpen, setMobileRulesOpen] = useState(false);

    // Format simple markdown into styled elements
    const renderFormattedRules = (text) => {
        if (!text) return <p className="text-xs text-slate-400">Belum ada aturan main yang ditetapkan.</p>;

        const lines = text.split('\n');
        return (
            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                {lines.map((line, idx) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('### ')) {
                        return (
                            <h4 key={idx} className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 pt-2">
                                {trimmed.replace('### ', '')}
                            </h4>
                        );
                    }
                    if (/^\d+\.\s/.test(trimmed)) {
                        const match = trimmed.match(/^(\d+\.)\s*(.*)/);
                        return (
                            <div key={idx} className="flex space-x-2 items-start pl-1 mt-1.5">
                                <span className="font-bold text-indigo-600 shrink-0">{match[1]}</span>
                                <span className="text-slate-700" dangerouslySetInnerHTML={{ __html: formatBold(match[2]) }} />
                            </div>
                        );
                    }
                    if (/^[a-z]\.\s/i.test(trimmed)) {
                        const match = trimmed.match(/^([a-z]\.)\s*(.*)/i);
                        return (
                            <div key={idx} className="flex space-x-2 items-start pl-4">
                                <span className="font-bold text-slate-500 shrink-0">{match[1]}</span>
                                <span className="text-slate-700" dangerouslySetInnerHTML={{ __html: formatBold(match[2]) }} />
                            </div>
                        );
                    }
                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        return (
                            <div key={idx} className="flex space-x-2 items-start pl-5">
                                <span className="text-indigo-400 font-bold shrink-0">•</span>
                                <span className="text-slate-600" dangerouslySetInnerHTML={{ __html: formatBold(trimmed.slice(2)) }} />
                            </div>
                        );
                    }
                    if (trimmed === '') return null;
                    return <p key={idx} className="text-slate-600" dangerouslySetInnerHTML={{ __html: formatBold(trimmed) }} />;
                })}
            </div>
        );
    };

    const formatBold = (str) => {
        return str.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Mobile Accordion Toggle (< 768px) PRD Section 9.2 */}
            <div className="md:hidden mb-4 bg-white rounded-xl border border-indigo-100 shadow-xs overflow-hidden">
                <button
                    type="button"
                    onClick={() => setMobileRulesOpen(!mobileRulesOpen)}
                    className="w-full px-4 py-3 bg-indigo-50/70 text-indigo-900 flex items-center justify-between font-bold text-xs"
                >
                    <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span>Syarat & Ketentuan Layanan [{service?.code}]</span>
                    </div>
                    {mobileRulesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {mobileRulesOpen && (
                    <div className="p-4 bg-white border-t border-indigo-100">
                        {renderFormattedRules(service?.rules_text)}
                    </div>
                )}
            </div>

            {/* Desktop Split-Screen Grid (40% Left : 60% Right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Kolom Kiri (40%): Aturan Main & Ketentuan */}
                <div className="hidden md:block md:col-span-5 sticky top-24 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-slate-900">Aturan Main & Ketentuan</h3>
                                <p className="text-[11px] text-slate-500">{service?.name}</p>
                            </div>
                        </div>

                        <div className="prose prose-xs max-w-none">
                            {renderFormattedRules(service?.rules_text)}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                            <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-600">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Status dipantau via menu <strong>Tracking</strong></span>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-600">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Isi data dengan lengkap untuk mempercepat proses</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan (60%): Formulir Permohonan */}
                <div className="col-span-1 md:col-span-7">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
