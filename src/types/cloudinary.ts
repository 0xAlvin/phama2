export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
}

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  resource_type: string;
  asset_id: string;
  url: string;
}

export interface CloudinaryImageInfo {
  id: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: number;
  format?: string;
  effect?: string;
}
