import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Reusable image upload component for Supabase Storage.
 * 
 * Props:
 *  - bucket: string — Supabase Storage bucket name
 *  - folder: string — subfolder path (e.g. car id)
 *  - multiple: boolean — allow multiple files
 *  - value: string | string[] — current URL(s)
 *  - onChange: (urls: string | string[]) => void
 *  - label: string — field label
 */
export default function ImageUpload({ bucket, folder = '', multiple = false, value, onChange, label = 'Upload Image' }) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Normalize value to array
    const urls = multiple
        ? (Array.isArray(value) ? value : (value ? [value] : []))
        : (value ? [value] : []);

    const handleFiles = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        try {
            const newUrls = [];

            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                const filePath = folder ? `${folder}/${fileName}` : fileName;

                const { error } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file, { cacheControl: '3600', upsert: false });

                if (error) throw error;

                const { data: urlData } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath);

                newUrls.push(urlData.publicUrl);
            }

            if (multiple) {
                onChange([...urls, ...newUrls]);
            } else {
                onChange(newUrls[0]);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image. Make sure the storage bucket exists.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e) => {
        handleFiles(Array.from(e.target.files));
        e.target.value = ''; // Reset input
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(Array.from(e.dataTransfer.files));
    };

    const removeImage = (index) => {
        if (multiple) {
            const updated = urls.filter((_, i) => i !== index);
            onChange(updated);
        } else {
            onChange('');
        }
    };

    return (
        <div className="mb-4">
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {label}
                </label>
            )}

            {/* Preview existing images */}
            {urls.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                    {urls.map((url, i) => (
                        <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                            <img
                                src={url}
                                alt={`Upload ${i + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload zone */}
            {(multiple || urls.length === 0) && (
                <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`
                        flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all
                        ${dragOver
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }
                        ${uploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    {uploading ? (
                        <>
                            <Loader2 size={24} className="text-blue-500 animate-spin mb-1" />
                            <span className="text-xs text-slate-500">Uploading...</span>
                        </>
                    ) : (
                        <>
                            <Upload size={24} className="text-slate-400 mb-1" />
                            <span className="text-xs text-slate-500">
                                Click or drag to upload {multiple ? 'images' : 'an image'}
                            </span>
                        </>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple={multiple}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            )}
        </div>
    );
}
