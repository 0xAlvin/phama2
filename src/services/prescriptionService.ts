/**
 * Service for handling prescription-related API calls
 */

import { ApiError } from '@/types/api';

export interface PrescriptionItem {
  id: string;
  medicationId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

export interface Prescription {
  id: string;
  doctorName: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  notes: string;
  imageUrl?: string;
  pharmacy?: string;
  items: PrescriptionItem[];
}

/**
 * Custom API response type with error handling
 */
export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  error?: {
    message: string;
    type: 'UNAUTHORIZED' | 'NOT_FOUND' | 'SERVER_ERROR' | 'UNKNOWN';
  };
}

/**
 * Fetches prescriptions for a specific patient
 */
export async function getPatientPrescriptions(patientId: string): Promise<ApiResponse<Prescription[]>> {
  try {
    const response = await fetch(`/api/patient/prescriptions?patientId=${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || 'Failed to fetch prescriptions';
      
      // Handle specific error status codes
      if (response.status === 401) {
        return {
          success: false, 
          error: {
            message: 'You are not authorized to view these prescriptions. Please log in again.',
            type: 'UNAUTHORIZED'
          }
        };
      } else if (response.status === 404) {
        return {
          success: false,
          error: {
            message: 'Prescriptions not found',
            type: 'NOT_FOUND'
          }
        };
      } else if (response.status >= 500) {
        return {
          success: false,
          error: {
            message: 'Server error occurred. Please try again later.',
            type: 'SERVER_ERROR'
          }
        };
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`API Error: ${errorMessage}`);
      }
      
      throw {
        message: errorMessage,
        type: 'UNKNOWN'
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.log('Error in getPatientPrescriptions service:', 
      typeof error === 'string' ? error : error instanceof Error ? error.message : 'Unknown error');
    
    return {
      success: false,
      error: {
        message: typeof error === 'string' ? error : 
                 (error as any)?.message || 'Unknown error occurred while fetching prescriptions',
        type: (error as any)?.type || 'UNKNOWN'
      }
    };
  }
}

/**
 * Fetches a specific prescription by ID
 */
export const getPrescriptionById = async (prescriptionId: string): Promise<Prescription | null> => {
  try {
    const response = await fetch(`/api/prescriptions/${prescriptionId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch prescription');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching prescription ${prescriptionId}:`, error);
    return null;
  }
};

/**
 * Creates a new prescription request
 */
export const createPrescriptionRequest = async (
  patientId: string,
  doctorName: string,
  medications: { name: string; dosage: string; instructions: string }[]
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const response = await fetch('/api/prescriptions/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId,
        doctorName,
        medications,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create prescription request');
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error creating prescription request:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Creates a new prescription
 */
export const createPrescription = async (
  formData: {
    patientId: string;
    doctorName: string;
    doctorContact?: string;
    issueDate: string;
    expiryDate?: string;
    medications: {
      name: string;
      dosage: string;
      frequency: string;
      duration?: string;
      quantity?: number;
      instructions?: string;
    }[];
    notes?: string;
    pharmacyId?: string;
    imageUrl?: string; // Added imageUrl to the formData
  },
  prescriptionImage?: File | null
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    let imageUrl = formData.imageUrl;

    // Upload image if provided and not already uploaded
    if (prescriptionImage && !imageUrl) {
      const uploadResult = await uploadPrescriptionImage(prescriptionImage);
      if (uploadResult.success && uploadResult.fileUrl) {
        imageUrl = uploadResult.fileUrl;
      } else {
        throw new Error(uploadResult.error || 'Failed to upload prescription image');
      }
    }

    // Create the request payload with the image URL
    const payload = {
      ...formData,
      imageUrl
    };
    
    const response = await fetch('/api/prescriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create prescription');
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error creating prescription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred while creating prescription' 
    };
  }
};

/**
 * Uploads a prescription image
 */
export const uploadPrescriptionImage = async (file: File): Promise<{ success: boolean; fileUrl?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/prescriptions/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }
    
    const data = await response.json();
    return { success: true, fileUrl: data.fileUrl };
  } catch (error) {
    console.error('Error uploading prescription image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while uploading image'
    };
  }
};

/**
 * Fetches a list of available pharmacies
 */
export const getPharmacies = async () => {
  try {
    const response = await fetch('/api/pharmacies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pharmacies');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    return [];
  }
};

/**
 * Download prescription document
 */
export const downloadPrescription = async (prescriptionId: string): Promise<{ success: boolean, url?: string, error?: string }> => {
  try {
    const response = await fetch(`/api/prescriptions/${prescriptionId}/download`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to download prescription');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    return { success: true, url };
  } catch (error) {
    console.error('Error downloading prescription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
