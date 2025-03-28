'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import styles from './ImageUploader.module.css';
import imageService from '@/lib/services/imageService';
import { CloudinaryImageInfo } from '@/types/cloudinary';
import { LazyImage } from '../imageLoader/LazyImage';

interface ImageUploaderProps {
  initialImage?: string;
  onImageUploaded?: (imageInfo: CloudinaryImageInfo) => void;
  onError?: (error: Error) => void;
  folder?: string;
  className?: string;
  maxSizeMB?: number;
}

export function ImageUploader({
  initialImage,
  onImageUploaded,
  onError,
  folder = 'phamapp',
  className = '',
  maxSizeMB = 5
}: ImageUploaderProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }
    
    // Reset states
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Simulate progress (since we can't track actual Cloudinary upload progress here)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 200);
      
      // Convert to buffer or use base64
      const base64 = await toBase64(file);
      
      // Upload to Cloudinary
      const uploadResult = await imageService.uploadImage(base64 as string, folder);
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Notify parent
      if (onImageUploaded) {
        onImageUploaded(uploadResult);
      }
      
      // Use the Cloudinary URL
      setImage(uploadResult.secureUrl);
      setTimeout(() => setIsUploading(false), 500);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
      
      if (onError) {
        onError(err);
      }
    }
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className={`${styles.uploaderContainer} ${className}`}>
      <div 
        className={`${styles.uploader} ${image ? styles.hasImage : ''}`} 
        onClick={handleClick}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className={styles.fileInput}
          accept="image/*"
          onChange={handleFileChange}
        />
        
        {isUploading ? (
          <div className={styles.uploadingContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className={styles.uploadingText}>
              Uploading... {Math.round(uploadProgress)}%
            </p>
          </div>
        ) : image ? (
          <div className={styles.imagePreviewContainer}>
            <LazyImage 
              src={image} 
              alt="Uploaded preview" 
              className={styles.imagePreview}
              objectFit="cover"
            />
            <button 
              className={styles.removeButton}
              onClick={handleRemove}
              title="Remove image"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className={styles.placeholderContent}>
            <ImageIcon className={styles.placeholderIcon} />
            <p className={styles.placeholderText}>Click to upload image</p>
            <p className={styles.placeholderSubtext}>or drag and drop</p>
          </div>
        )}
      </div>
      
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}

// Helper to convert File to base64
const toBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};
