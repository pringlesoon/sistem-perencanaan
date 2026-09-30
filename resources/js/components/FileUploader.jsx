import React, { useState } from 'react';
import { UploadCloud, File, X, AlertCircle, CheckCircle } from 'lucide-react';

const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function FileUploader({ files, setFiles }) {
    const [dragActive, setDragActive] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleFiles = (newFiles) => {
        setErrorMsg(null);
        const validList = [];

        for (const file of Array.from(newFiles)) {
            // Cek ekstensi
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
                setErrorMsg(`File "${file.name}" tidak diizinkan. Tipe file yang didukung: PDF, JPG, PNG, DOCX.`);
                return;
            }

            // Cek ukuran
            if (file.size > MAX_SIZE_BYTES) {
                setErrorMsg(`File "${file.name}" melebihi ukuran maksimal ${MAX_SIZE_MB}MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
                return;
            }

            validList.push(file);
        }

        setFiles(prev => [...prev, ...validList]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
                Lampiran Dokumen / Materi Pendukung
            </label>

            {/* Drag & Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                    dragActive
                        ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
            >
                <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-700">
                            Tarik berkas ke sini atau <span className="text-indigo-600 underline">pilih dari perangkat</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Maksimal 10MB per berkas (Format: PDF, JPG, PNG, DOCX)
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Feedback */}
            {errorMsg && (
                <div className="flex items-center space-x-2 text-xs p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* File List Preview */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Berkas Terpilih ({files.length}):
                    </p>
                    <div className="space-y-1.5">
                        {files.map((file, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs"
                            >
                                <div className="flex items-center space-x-2.5 truncate">
                                    <File className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                        ({(file.size / 1024).toFixed(0)} KB)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                                    title="Hapus berkas"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
