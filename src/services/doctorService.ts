/**
 * Service for handling doctor-related API calls
 */

export interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  licenseNumber?: string;
  contactInfo?: string;
}

/**
 * Fetches all available doctors
 */
export const getDoctors = async (): Promise<Doctor[]> => {
  try {
    const response = await fetch('/api/doctors', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch doctors');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
};

/**
 * Fetches a specific doctor by ID
 */
export const getDoctorById = async (doctorId: string): Promise<Doctor | null> => {
  try {
    const response = await fetch(`/api/doctors/${doctorId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch doctor');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching doctor ${doctorId}:`, error);
    return null;
  }
};
