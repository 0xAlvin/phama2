import React from 'react';
import { Metadata } from 'next';
import PrescriptionForm from '@/components/Prescriptions/PrescriptionForm';

export const metadata: Metadata = {
  title: 'Create New Prescription | PhamApp',
  description: 'Create a new prescription for your medication needs',
};

export default function NewPrescriptionPage() {
  return (
    <div className="container mx-auto py-6">
      <PrescriptionForm />
    </div>
  );
}
