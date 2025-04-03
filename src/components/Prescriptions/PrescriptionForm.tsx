'use client';

import React, { useState, useEffect } from 'react';
import { FileText, User, Calendar, Plus, Trash2 } from 'lucide-react';
import ModernImageUpload from './ModernImageUpload';
import SimpleDateInput from './SimpleDateInput'; // Import the new date input
import { createPrescription, getPharmacies } from '@/services/prescriptionService';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Listbox, ListboxItem } from "@/components/ui/listbox"

import './PrescriptionForm.css';

interface Pharmacy {
  id: string;
  name: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
}

interface FormData {
  doctorName: string;
  doctorContact?: string;
  issueDate?: Date;
  expiryDate?: Date;
  medications: Medication[];
  notes?: string;
  sendToPharmacy: boolean;
  pharmacyId?: string;
  status: string; // Add status field
}

export default function PrescriptionForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    doctorName: '',
    doctorContact: '',
    issueDate: new Date(),
    expiryDate: null,
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: '',
    sendToPharmacy: false,
    pharmacyId: '',
    status: 'active', // Default status
  });
  
  useEffect(() => {
    // Check if user is authenticated
    if (!session?.user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a prescription.",
        variant: "destructive",
      });
      router.push('/signin');
    }
    
    // Fetch pharmacies
    const fetchPharmacies = async () => {
      try {
        setLoadingPharmacies(true);
        const pharmaciesData = await getPharmacies();
        setPharmacies(pharmaciesData);
      } catch (error) {
        console.error('Error fetching pharmacies:', error);
        toast({
          title: "Error",
          description: "Failed to load pharmacies. Some features may be limited.",
          variant: "destructive",
        });
      } finally {
        setLoadingPharmacies(false);
      }
    };
    
    fetchPharmacies();
  }, [session, router, toast]);
  
  const handleImageSelect = (file: File) => {
    setPrescriptionImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleImageRemove = () => {
    setPrescriptionImage(null);
    setImagePreview(null);
  };
  
  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  };
  
  const removeMedication = (index: number) => {
    if (formData.medications.length > 1) {
      const updatedMedications = [...formData.medications];
      updatedMedications.splice(index, 1);
      setFormData({
        ...formData,
        medications: updatedMedications
      });
    }
  };
  
  const handleMedicationChange = (index: number, field: keyof Medication, value: string | number) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const handleDateChange = (field: 'issueDate' | 'expiryDate', value: { day: string; month: string; year: string }) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.doctorName) {
      newErrors.doctorName = 'Doctor name is required';
    }
    
    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }
    
    formData.medications.forEach((medication, index) => {
      if (!medication.name) {
        newErrors[`medication-${index}-name`] = 'Medication name is required';
      }
      if (!medication.dosage) {
        newErrors[`medication-${index}-dosage`] = 'Dosage is required';
      }
      if (!medication.frequency) {
        newErrors[`medication-${index}-frequency`] = 'Frequency is required';
      }
    });
    
    if (formData.sendToPharmacy && !formData.pharmacyId) {
      newErrors.pharmacyId = 'Please select a pharmacy';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    setLoading(true);

    try {
      // Get the patient ID from the session
      if (!session?.user?.id) {
        throw new Error('Authentication required to create prescriptions');
      }
      
      const patientId = session.user.id;
      
      // Format data for API
      const prescriptionData = {
        patientId,
        doctorName: formData.doctorName,
        doctorContact: formData.doctorContact || undefined,
        issueDate: formData.issueDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        expiryDate: formData.expiryDate?.toISOString().split('T')[0],
        medications: formData.medications.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration || undefined,
          quantity: med.quantity || 1, // Default quantity to 1
          instructions: med.instructions || undefined,
        })),
        notes: formData.notes || undefined,
        pharmaciesId: formData.sendToPharmacy ? formData.pharmacyId : undefined,
        status: formData.status, // Include status
      };

      // Submit the prescription
      const result = await createPrescription(prescriptionData, prescriptionImage);
      
      if (result.success) {
        toast({
          title: "Prescription submitted",
          description: formData.sendToPharmacy 
            ? "Your prescription has been sent to the pharmacy"
            : "Your prescription has been saved",
        });

        // Redirect to the prescriptions list
        router.push('/dashboard/prescriptions');
      } else {
        throw new Error(result.error || 'Failed to create prescription');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was a problem submitting your prescription",
        variant: "destructive",
      });
      console.error('Error submitting prescription:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  
  // ...existing render code...

  // Replace the pharmacy selection dropdown with the dynamically loaded pharmacies
  const renderPharmacySelect = () => (
    <div className="form-row">
      <label className="form-label">Select Pharmacy</label>
      {loadingPharmacies ? (
        <div className="loading-text">Loading pharmacies...</div>
      ) : (
        <select
          name="pharmacyId"
          className={`select-field ${errors.pharmacyId ? 'border-destructive' : ''}`}
          value={formData.pharmacyId}
          onChange={handleChange}
          disabled={loadingPharmacies}
        >
          <option value="">Select a pharmacy...</option>
          {pharmacies.map(pharmacy => (
            <option key={pharmacy.id} value={pharmacy.id}>
              {pharmacy.name}
            </option>
          ))}
        </select>
      )}
      {errors.pharmacyId && (
        <p className="error-text">{errors.pharmacyId}</p>
      )}
    </div>
  );

  return (
    <div className="prescription-form-container">
      <h1 className="prescription-form-title">Create New Prescription</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Left Column */}
          <div>
            <div className="form-section">
              <h2 className="section-title">
                <FileText size={18} />
                Prescription Image (Optional)
              </h2>
              
              <ModernImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                imagePreview={imagePreview}
              />
            </div>
            
            <div className="form-section mt-4">
              <h2 className="section-title">
                <User size={18} />
                Doctor Information
              </h2>
              
              <div className="form-row">
                <label className="form-label">Doctor Name</label>
                <input
                  type="text"
                  name="doctorName"
                  className={`input-field ${errors.doctorName ? 'border-destructive' : ''}`}
                  placeholder="Dr. John Smith"
                  value={formData.doctorName}
                  onChange={handleChange}
                />
                {errors.doctorName && (
                  <div className="error-text">{errors.doctorName}</div>
                )}
              </div>
              
              <div className="form-row">
                <label className="form-label">Doctor Contact (Optional)</label>
                <input
                  type="text"
                  name="doctorContact"
                  className="input-field"
                  placeholder="Phone or email"
                  value={formData.doctorContact}
                  onChange={handleChange}
                />
              </div>
              
              <div className="date-fields-grid">
                <SimpleDateInput
                  label="Issue Date"
                  value={formData.issueDate || { day: '', month: '', year: '' }}
                  onChange={(value) => handleDateChange('issueDate', value)}
                  error={errors.issueDate}
                  required
                />
                
                <SimpleDateInput
                  label="Expiry Date"
                  value={formData.expiryDate || { day: '', month: '', year: '' }}
                  onChange={(value) => handleDateChange('expiryDate', value)}
                />
              </div>
            </div>
            
            <div className="form-section mt-4">
              <h2 className="section-title">Additional Notes (Optional)</h2>
              <textarea
                name="notes"
                className="textarea-field"
                placeholder="Add any additional information for the pharmacy or patient"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>
          
          {/* Right Column */}
          <div>
            <div className="form-section">
              <div className="flex justify-between items-center mb-4">
                <h2 className="section-title">
                  <Calendar size={18} />
                  Medications
                </h2>
                <button
                  type="button"
                  className="btn btn-secondary flex items-center gap-2"
                  onClick={addMedication}
                >
                  <Plus size={16} />
                  Add Medication
                </button>
              </div>
              
              {formData.medications.map((medication, index) => (
                <div key={index} className="medication-card">
                  <div className="medication-header">
                    <h3 className="medication-title">Medication #{index + 1}</h3>
                    {index > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary p-1"
                        onClick={() => removeMedication(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="form-row">
                    <label className="form-label">Medication Name</label>
                    <input
                      type="text"
                      className={`input-field ${errors[`medication-${index}-name`] ? 'border-destructive' : ''}`}
                      placeholder="e.g., Amoxicillin"
                      value={medication.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                    />
                    {errors[`medication-${index}-name`] && (
                      <p className="error-text">{errors[`medication-${index}-name`]}</p>
                    )}
                  </div>
                  
                  <div className="medication-grid">
                    <div className="form-row">
                      <label className="form-label">Dosage</label>
                      <input
                        type="text"
                        className={`input-field ${errors[`medication-${index}-dosage`] ? 'border-destructive' : ''}`}
                        placeholder="e.g., 500mg"
                        value={medication.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      />
                      {errors[`medication-${index}-dosage`] && (
                        <p className="error-text">{errors[`medication-${index}-dosage`]}</p>
                      )}
                    </div>
                    
                    <div className="form-row">
                      <label className="form-label">Frequency</label>
                      <input
                        type="text"
                        className={`input-field ${errors[`medication-${index}-frequency`] ? 'border-destructive' : ''}`}
                        placeholder="e.g., 3 times daily"
                        value={medication.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                      />
                      {errors[`medication-${index}-frequency`] && (
                        <p className="error-text">{errors[`medication-${index}-frequency`]}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="medication-grid">
                    <div className="form-row">
                      <label className="form-label">Duration (Optional)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., 7 days"
                        value={medication.duration}
                        onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-row">
                      <label className="form-label">Quantity (Optional)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="e.g., 21"
                        value={medication.quantity || ''}
                        onChange={(e) => handleMedicationChange(index, 'quantity', e.target.valueAsNumber || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <label className="form-label">Instructions (Optional)</label>
                    <textarea
                      className="textarea-field"
                      placeholder="e.g., Take with food, avoid alcohol"
                      value={medication.instructions}
                      onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                    ></textarea>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="form-section mt-4">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="sendToPharmacy"
                  name="sendToPharmacy"
                  className="checkbox-field"
                  checked={formData.sendToPharmacy}
                  onChange={handleCheckboxChange}
                />
                <div className="checkbox-label">
                  <label htmlFor="sendToPharmacy" className="checkbox-text">
                    Send to pharmacy
                  </label>
                  <p className="checkbox-hint">
                    Send this prescription directly to a pharmacy for fulfillment
                  </p>
                </div>
              </div>

              {formData.sendToPharmacy && renderPharmacySelect()}
            </div>

            <div className="form-row">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="select-field"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'pending' | 'filled' | 'expired' })}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="filled">Filled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            
            <div className="actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Prescription'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
