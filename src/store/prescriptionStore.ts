import { create } from 'zustand';
import { Prescription } from '@/types/prescription';

interface PrescriptionState {
  prescriptions: Prescription[];
  loading: boolean;
  error: string | null;
  fetchPrescriptions: (userId: string) => Promise<Prescription[]>;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const usePrescriptionStore = create<PrescriptionState>((set) => ({
  prescriptions: [],
  loading: false,
  error: null,
  
  fetchPrescriptions: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Fetch prescriptions from API endpoint
      const response = await fetch(`/api/prescriptions?userId=${userId}`, {
        // Add headers to ensure we get JSON back
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Handle error responses properly
      if (!response.ok) {
        // Try to parse error as JSON first
        let errorMessage = `Failed to fetch prescriptions: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          // If JSON parsing fails, try to get text
          const errorText = await response.text();
          if (errorText) {
            // Don't log the entire HTML document if that's what we got
            errorMessage = errorText.length > 100 
              ? `${errorText.substring(0, 100)}... (truncated)`
              : errorText;
          }
        }
        
        console.error('Error response:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse the JSON response with error handling
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      set({ 
        prescriptions: data.prescriptions || [],
        loading: false 
      });
      
      return data.prescriptions || [];
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false
      });
      return [];
    }
  },
  
  addPrescription: async (prescription) => {
    try {
      set({ loading: true, error: null });
      
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(prescription),
      });
      
      // Handle error responses properly
      if (!response.ok) {
        let errorMessage = 'Failed to add prescription';
        
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If JSON parsing fails, try to get text
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const newPrescription = await response.json();
      
      set((state) => ({
        prescriptions: [...state.prescriptions, newPrescription],
        loading: false
      }));
    } catch (error) {
      console.error('Error adding prescription:', error);
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false
      });
    }
  },
}));
