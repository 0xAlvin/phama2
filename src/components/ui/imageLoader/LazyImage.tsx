'use client';

import { useState, useEffect } from 'react';
import Image, { StaticImageData } from 'next/image';
import styles from './LazyImage.module.css';

interface LazyImageProps {
    src: string | StaticImageData;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    priority?: boolean;
    quality?: number;
    style?: React.CSSProperties;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
}

export function LazyImage({
    src,
    alt,
    width,
    height,
    className,
    objectFit = 'cover',
    priority = false,
    quality = 75,
    placeholder,
    blurDataURL,
    ...props
}: LazyImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [currentSrc, setCurrentSrc] = useState<string | StaticImageData>(
        typeof src === 'string' && src.startsWith('data:') 
            ? '' 
            : src
    );
    
    // Generate blurDataURL for Cloudinary images if not provided
    const cloudinaryBlurURL = typeof src === 'string' && 
        src.includes('cloudinary') && 
        !blurDataURL ? 
        src.replace('/upload/', '/upload/w_40,e_blur:1000/') : 
        blurDataURL;
    
    useEffect(() => {
        // Update src if it changes
        if (typeof src === 'string' && src.startsWith('data:')) {
            // This is a base64 image, we'll handle it directly
            setCurrentSrc('');
        } else {
            setCurrentSrc(src);
        }
    }, [src]);

    return (
        <div 
            className={`${styles.imageContainer} ${className || ''} ${isLoading ? styles.loading : styles.loaded}`}
            style={{ 
                width: width ? `${width}px` : '100%',
                height: height ? `${height}px` : 'auto',
            }}
        >
            {currentSrc && (
                <Image
                    src={currentSrc}
                    alt={alt}
                    width={width}
                    height={height}
                    className={styles.image}
                    style={{ 
                        objectFit, 
                        ...props.style 
                    }}
                    priority={priority}
                    quality={quality}
                    onLoad={() => setIsLoading(false)}
                    placeholder={placeholder}
                    blurDataURL={cloudinaryBlurURL}
                    {...props}
                />
            )}
            {isLoading && <div className={styles.loadingPlaceholder} />}
        </div>
    );
}
