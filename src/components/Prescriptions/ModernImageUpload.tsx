'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import './ModernImageUpload.css';

interface ModernImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  imagePreview: string | null;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

export default function ModernImageUpload({
  onImageSelect,
  onImageRemove,
  imagePreview,
  acceptedTypes = "image/png, image/jpeg, application/pdf",
  maxSizeMB = 5
}: ModernImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const fileType = file.type.toLowerCase();
    const acceptedTypesArray = acceptedTypes.split(',').map(type => type.trim().toLowerCase());
    
    if (!acceptedTypesArray.includes(fileType)) {
      setError(`Invalid file type. Supported formats: ${acceptedTypes}`);
      return false;
    }
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return false;
    }
    
    return true;
  };

  const handleFile = (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    onImageSelect(file);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="modern-upload-container">
      {!imagePreview ? (
        <>
          <div
            className={`upload-area ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <Upload className="upload-icon" />
            <h3 className="upload-text">
              Drag and drop your prescription image or click to browse
            </h3>
            <p className="upload-hint">
              Supports PNG, JPG, PDF up to {maxSizeMB}MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="upload-input"
              accept={acceptedTypes}
              onChange={handleFileChange}
            />
          </div>
          
          {error && (
            <div className="upload-error">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}
        </>
      ) : (
        <div className="preview-container">
          <img src={imagePreview} alt="Prescription preview" className="preview-image" />
          <div className="preview-overlay"></div>
          <div className="preview-actions">
            <button className="action-button remove" onClick={onImageRemove} title="Remove">
              <X size={20} />
            </button>
          </div>
          {fileName && (
            <div className="file-info">
              <div className="file-name">{fileName}</div>
              {fileSize && <div className="file-size">{fileSize}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
