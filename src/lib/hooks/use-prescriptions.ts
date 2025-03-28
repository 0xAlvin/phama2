'use client';

import { useState, useEffect } from 'react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  doctorName: string;
  doctorContact?: string;
  medications: string[];
  medicationDetails: Medication[];
  issueDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'filled' | 'pending';
  notes?: string;
  imageUrl?: string;
}

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPrescriptions() {
      try {
        // In a real app, you would fetch from your API
        // Simulating API response with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockPrescriptions: Prescription[] = [
          {
            id: '1',
            doctorName: 'Sarah Johnson',
            doctorContact: '(555) 123-4567',
            medications: ['Lisinopril', 'Metformin'],
            medicationDetails: [
              {
                name: 'Lisinopril',
                dosage: '10mg',
                frequency: 'Once daily',
                duration: '90 days',
                instructions: 'Take in the morning with water'
              },
              {
                name: 'Metformin',
                dosage: '500mg',
                frequency: 'Twice daily',
                duration: '90 days',
                instructions: 'Take with meals'
              }
            ],
            issueDate: new Date('2023-10-15'),
            expiryDate: new Date('2024-01-15'),
            status: 'active',
            notes: 'Patient reports improved blood pressure control. Continue current regimen.'
          },
          {
            id: '2',
            doctorName: 'Michael Chen',
            doctorContact: '(555) 987-6543',
            medications: ['Amoxicillin'],
            medicationDetails: [
              {
                name: 'Amoxicillin',
                dosage: '500mg',
                frequency: 'Three times daily',
                duration: '10 days',
                instructions: 'Complete the full course even if feeling better'
              }
            ],
            issueDate: new Date('2023-11-05'),
            expiryDate: new Date('2023-12-05'),
            status: 'filled',
            imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
          },
          {
            id: '3',
            doctorName: 'Jennifer Williams',
            doctorContact: '(555) 234-5678',
            medications: ['Atorvastatin'],
            medicationDetails: [
              {
                name: 'Atorvastatin',
                dosage: '20mg',
                frequency: 'Once daily at bedtime',
                duration: '30 days',
                instructions: 'Take with or without food'
              }
            ],
            issueDate: new Date('2023-09-20'),
            expiryDate: new Date('2023-10-20'),
            status: 'expired',
            notes: 'Follow up required after 30 days to check cholesterol levels.'
          }
        ];
        
        setPrescriptions(mockPrescriptions);
        setIsLoading(false);
      } catch (error) {
        setError(error as Error);
        setIsLoading(false);
      }
    }
    
    fetchPrescriptions();
  }, []);

  return { prescriptions, isLoading, error };
}
