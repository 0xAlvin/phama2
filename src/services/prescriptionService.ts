import imageService from './imageService';
import { db } from '@/lib/db';
import { prescriptions, pharmacies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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
 * Results for downloading a prescription
 */
export interface PrescriptionResult {
  success: boolean;
  error?: string;
  url?: string;
}

/**
 * Service for handling prescription-related operations
 */
export const prescriptionService = {
  /**
   * Create a new prescription
   */
  async createPrescription(data: any, image?: File | null): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      let imageUrl: string | undefined = undefined;
      
      // Upload image if provided
      if (image) {
        const uploadResult = await imageService.uploadImage(
          image, 
          `prescriptions/${data.patientId}`
        );
        imageUrl = uploadResult.publicUrl;
      }
      
      // Complete prescription data with image URL if available
      const completeData = {
        ...data,
        imageUrl: imageUrl || null
      };
      
      // Make API call to create prescription
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData)
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
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },
  
  /**
   * Fetch prescriptions for a patient
   */
  async getPatientPrescriptions(patientId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/patient/prescriptions?patientId=${patientId}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }
      
      const data = await response.json();
      return data.prescriptions || [];
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return [];
    }
  },
  
  /**
   * Fetch list of pharmacies
   */
  async getPharmacies(): Promise<any[]> {
    try {
      // Use direct DB access server-side, or API call client-side
      if (typeof window === 'undefined') {
        // Server-side logic
        return await db.select({
          id: pharmacies.id,
          name: pharmacies.name,
          phone: pharmacies.phone,
          email: pharmacies.email
        }).from(pharmacies);
      } else {
        // Client-side logic
        const response = await fetch('/api/pharmacies', {
          method: 'GET'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch pharmacies');
        }
        
        const data = await response.json();
        return data.pharmacies || [];
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      return [];
    }
  }
};

/**
 * Download prescription document
 */
export const downloadPrescription = async (id: string): Promise<PrescriptionResult> => {
  try {
    const response = await fetch(`/api/prescriptions/${id}/download`);
    
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

/**
 * Fetches a specific prescription by ID
 */
export const getPrescriptionById = async (id: string): Promise<Prescription | null> => {
  try {
    const response = await fetch(`/api/prescriptions/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch prescription');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching prescription ${id}:`, error);
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
    imageUrl?: string;
  },
  prescriptionImage?: File | null
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    let imageUrl = formData.imageUrl;

    // Upload image if provided
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

    const data = await response.json();
    return data.pharmacies || [];
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    return [];
  }
};

import { Prescription as DBPrescription } from '@/types/prescription';

// Get all prescriptions for a specific user
export async function getPrescriptionsForUser(userId: string): Promise<DBPrescription[]> {
  try {
    // This is now server-side only code
    const prescriptions = await db.query(
      'SELECT * FROM prescriptions WHERE userId = $1 ORDER BY createdAt DESC',
      [userId]
    );
    
    return prescriptions;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch prescriptions');
  }
}

// Create a new prescription (renamed to avoid duplication)
export async function createPrescriptionInDb(
  prescriptionData: Omit<DBPrescription, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DBPrescription> {
  try {
    // This is now server-side only code
    const [newPrescription] = await db.query(
      `INSERT INTO prescriptions (
        userId, medicationName, dosage, instructions, doctorName,
        pharmacyName, pharmacyId, prescribedDate, status, refills
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        prescriptionData.userId,
        prescriptionData.medicationName,
        prescriptionData.dosage,
        prescriptionData.instructions,
        prescriptionData.doctorName,
        prescriptionData.pharmacyName,
        prescriptionData.pharmacyId || null,
        prescriptionData.prescribedDate,
        prescriptionData.status,
        prescriptionData.refills || 0
      ]
    );
    
    return newPrescription;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to create prescription');
  }
}
