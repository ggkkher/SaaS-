'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null, base64: string | null) => void;
  preview?: string;
  error?: string;
}

export default function FileUpload({
  label,
  accept = 'image/*',
  maxSize = 5,
  onFileSelect,
  preview,
  error,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file) {
      onFileSelect(null, null);
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      onFileSelect(null, null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onFileSelect(file, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
          isDragActive
            ? 'border-primary-light bg-primary-light bg-opacity-5'
            : 'border-gray-300 hover:border-primary-light'
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
          className="hidden"
          id={`file-input-${Math.random()}`}
        />

        <label
          htmlFor={`file-input-${Math.random()}`}
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="w-8 h-8 text-primary-light" />
          <span className="text-sm font-medium text-gray-700">
            Datei hier ziehen oder klicken
          </span>
          <span className="text-xs text-gray-500">
            (Max. {maxSize}MB)
          </span>
        </label>
      </div>

      {preview && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Vorschau:</p>
          <img
            src={preview}
            alt="Logo Preview"
            className="max-w-xs h-auto rounded-lg border border-gray-300"
          />
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
