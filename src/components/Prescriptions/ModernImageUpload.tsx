"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import "./ModernImageUpload.css"; // Add this import

interface ModernImageUploadProps {
  onFileSelected: (file: File) => void;
  previewUrl?: string | null;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export default function ModernImageUpload({
  onFileSelected,
  previewUrl = null,
  accept = "image/*",
  maxSizeMB = 5,
  className = "",
}: ModernImageUploadProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    validateAndProcessFile(files[0]);
  };

  const validateAndProcessFile = (file: File) => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (convert MB to bytes)
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `Please upload an image smaller than ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    // Pass the valid file to the parent component
    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    validateAndProcessFile(files[0]);
  };

  const handleClearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileSelected(new File([], "")); // Send an empty file to clear
  };

  return (
    <div className={`image-upload-container ${className}`}>
      {previewUrl ? (
        <div className="preview-container">
          <div className="preview-image-container">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="preview-image"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="clear-button"
              onClick={handleClearImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="upload-icon" />
          <div className="upload-text">
            <p>Drag & drop an image or click to browse</p>
            <span>Maximum file size: {maxSizeMB}MB</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            className="file-input"
          />
        </div>
      )}
    </div>
  );
}
