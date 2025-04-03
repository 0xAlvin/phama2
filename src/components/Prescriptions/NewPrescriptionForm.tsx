"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FilePlus, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon 
} from 'lucide-react';
// Use conditional imports to prevent build errors
let zodResolver: any;
let useForm: any;
let useFieldArray: any;
let z: any;

if (typeof window !== 'undefined') {
  // Only load these modules on the client side
  import('react-hook-form').then((module) => {
    useForm = module.useForm;
    useFieldArray = module.useFieldArray;
  });
  
  import('zod').then((module) => {
    z = module.default;
  });
  
  import('@hookform/resolvers/zod').then((module) => {
    zodResolver = module.zodResolver;
  });
}

import { Separator } from '@/components/ui/separator';
import SimpleDateInput from './SimpleDateInput';
import ModernImageUpload from './ModernImageUpload';

import './NewPrescriptionForm.css';

// Define interfaces and types
interface Pharmacy {
  id: string;
  name: string;
}

// Helper function to format dates properly for the API
const formatDateForAPI = (date: Date | null): string | undefined => {
  if (!date) return undefined;
  
  try {
    // Check if it's a valid date object
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn("Invalid date object:", date);
      return undefined;
    }
    
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date for API:", error);
    return undefined;
  }
};

// Instead, define API fetch functions directly in this component:
async function fetchPharmacies() {
  try {
    const response = await fetch('/api/pharmacies', {
      method: 'GET',
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch pharmacies: ${response.status} ${response.statusText}`);
      // Return mock data as fallback
      return [
        { id: '1', name: 'Downtown Pharmacy' },
        { id: '2', name: 'Community Pharmacy' },
        { id: '3', name: 'City Health Pharmacy' }
      ];
    }
    
    const data = await response.json();
    return data.pharmacies || [];
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    // Return mock data as fallback
    return [
      { id: '1', name: 'Downtown Pharmacy' },
      { id: '2', name: 'Community Pharmacy' },
      { id: '3', name: 'City Health Pharmacy' }
    ];
  }
}

async function submitPrescription(formData: any, image: File | null) {
  try {
    let imageUrl: string | undefined = undefined;
    
    // Upload image if provided
    if (image) {
      const formData = new FormData();
      formData.append('file', image);
      const uploadResponse = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Failed to upload image');
      }
      
      const uploadResult = await uploadResponse.json();
      imageUrl = uploadResult.fileUrl;
    }
    
    // Create the request payload with the image URL
    const payload = {
      ...formData,
      imageUrl
    };
    
    console.log("Sending payload to API:", JSON.stringify(payload, null, 2));
    
    const response = await fetch('/api/prescriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Server error response:', result);
      throw new Error(result.error || result.details || 'Failed to create prescription');
    }
    
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error creating prescription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred while creating prescription' 
    };
  }
}

export default function NewPrescriptionForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const [formState, setFormState] = useState({
    doctorName: '',
    doctorContact: '',
    issueDate: new Date(),
    expiryDate: null as Date | null,
    medications: [{ 
      name: '', 
      dosage: '', 
      frequency: '', 
      duration: '', 
      quantity: 1, 
      instructions: '' 
    }],
    notes: '',
    sendToPharmacy: false,
    pharmacyId: '',
    status: 'active'
  });

  // For debugging
  useEffect(() => {
    console.log("Form state updated:", { 
      sendToPharmacy: formState.sendToPharmacy, 
      pharmacyId: formState.pharmacyId 
    });
  }, [formState.sendToPharmacy, formState.pharmacyId]);

  // Fetch pharmacies
  useEffect(() => {
    const loadPharmacies = async () => {
      setLoadingPharmacies(true);
      try {
        const data = await fetchPharmacies();
        setPharmacies(data);
      } catch (error) {
        console.error('Error loading pharmacies:', error);
        // Use fallback data
        setPharmacies([
          { id: '1', name: 'Downtown Pharmacy' },
          { id: '2', name: 'Community Pharmacy' },
          { id: '3', name: 'City Health Pharmacy' }
        ]);
        toast({
          title: "Couldn't load pharmacies",
          description: "Using default pharmacy list instead",
          variant: "destructive",
        });
      } finally {
        setLoadingPharmacies(false);
      }
    };

    loadPharmacies();
  }, []);

  // Handle image upload
  const handleImageUpload = (file: File) => {
    setPrescriptionImage(file);
    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
  };

  // Add another medication
  const handleAddMedication = () => {
    setFormState(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' }
      ]
    }));
  };

  // Remove a medication
  const handleRemoveMedication = (index: number) => {
    setFormState(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle medication field changes
  const handleMedicationChange = (index: number, field: string, value: string | number) => {
    setFormState(prev => {
      const updatedMedications = [...prev.medications];
      updatedMedications[index] = {
        ...updatedMedications[index],
        [field]: value
      };
      return {
        ...prev,
        medications: updatedMedications
      };
    });
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      sendToPharmacy: checked,
      // If unchecking, reset the pharmacyId
      pharmacyId: checked ? prev.pharmacyId : ''
    }));
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    console.log(`Setting ${name} to:`, value);
    // Directly update state without using previous state to avoid any closure issues
    setFormState({
      ...formState,
      [name]: value
    });
  };

  // Handle date change
  const handleDateChange = (field: 'issueDate' | 'expiryDate', date: Date | null) => {
    setFormState(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add console log for debugging
    console.log("Form submission - form state:", formState);
    
    // Validate required fields
    if (!formState.doctorName.trim()) {
      toast({
        title: "Missing information",
        description: "Doctor name is required",
        variant: "destructive",
      });
      return;
    }

    if (formState.medications.length === 0) {
      toast({
        title: "Missing information",
        description: "At least one medication is required",
        variant: "destructive",
      });
      return;
    }

    // Validate each medication
    for (const med of formState.medications) {
      if (!med.name.trim() || !med.dosage.trim() || !med.frequency.trim()) {
        toast({
          title: "Missing information",
          description: "Medication name, dosage, and frequency are required for all medications",
          variant: "destructive",
        });
        return;
      }
    }

    if (formState.sendToPharmacy && !formState.pharmacyId) {
      toast({
        title: "Missing information",
        description: "Please select a pharmacy",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the patient ID from the session
      if (!session?.user?.id) {
        throw new Error('Authentication required to create prescriptions');
      }
      
      const patientId = session.user.id;
      
      // Format dates properly and ensure they're strings, not Date objects
      const issueDate = formatDateForAPI(formState.issueDate) || new Date().toISOString().split('T')[0];
      const expiryDate = formatDateForAPI(formState.expiryDate);
      
      console.log("Formatted dates for API:", { issueDate, expiryDate });
      
      // Format data for API making sure all properties are serializable
      const prescriptionData = {
        patientId,
        doctorName: formState.doctorName.trim(),
        doctorContact: formState.doctorContact?.trim() || undefined,
        issueDate,
        expiryDate,
        status: formState.status || 'active',
        medications: formState.medications.map(med => ({
          name: med.name.trim(),
          dosage: med.dosage.trim(),
          frequency: med.frequency.trim(),
          duration: med.duration?.trim() || undefined,
          quantity: Number(med.quantity) || 1,
          instructions: med.instructions?.trim() || undefined,
        })),
        notes: formState.notes?.trim() || undefined,
        pharmaciesId: formState.sendToPharmacy ? formState.pharmacyId : undefined,
      };
      
      // Stringify the data *before* logging it, to ensure we see what's actually being sent
      const serializedData = JSON.stringify(prescriptionData);
      console.log("Sending data to API:", serializedData);
      
      // Use submitPrescription instead of createPrescription
      const result = await submitPrescription(JSON.parse(serializedData), prescriptionImage); // Parse it back to an object
      
      if (result.success) {
        toast({
          title: "Prescription submitted",
          description: formState.sendToPharmacy
            ? "Your prescription has been sent to the pharmacy"
            : "Your prescription has been saved",
        });
        
        // Redirect to prescriptions list
        router.push('/dashboard/prescriptions?tab=my-prescriptions');
      } else {
        throw new Error(result.error || 'Failed to create prescription');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was a problem submitting your prescription",
        variant: "destructive",
      });
      console.error('Error submitting prescription:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validation for form submission
  const isFormValid = () => {
    // Check doctor name
    if (!formState.doctorName.trim()) return false;
    
    // Check medications
    if (!formState.medications.length) return false;
    
    for (const med of formState.medications) {
      if (!med.name.trim() || !med.dosage.trim() || !med.frequency.trim()) {
        return false;
      }
    }
    
    // Check pharmacy if sending to pharmacy
    if (formState.sendToPharmacy && !formState.pharmacyId) {
      return false;
    }
    
    return true;
  };

  return (
    <div className="new-prescription-form">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3 className="section-title">Doctor Information</h3>
          <div className="form-grid">
            <div className="form-item">
              <label className="form-label">Doctor's Name*</label>
              <Input 
                name="doctorName"
                placeholder="Enter doctor's name"
                value={formState.doctorName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-item">
              <label className="form-label">Doctor's Contact</label>
              <Input 
                name="doctorContact"
                placeholder="Phone or email (optional)"
                value={formState.doctorContact}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">Medications*</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAddMedication}
              className="add-button"
            >
              <Plus size={16} />
              Add Medication
            </Button>
          </div>
          
          {formState.medications.map((medication, index) => (
            <div key={index} className="medication-form-item">
              <div className="medication-header">
                <h4>Medication #{index + 1}</h4>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMedication(index)}
                    className="remove-button"
                  >
                    <Trash2 size={16} />
                    Remove
                  </Button>
                )}
              </div>

              <div className="form-grid">
                <div className="form-item">
                  <label className="form-label">Medication Name*</label>
                  <Input 
                    placeholder="Enter medication name"
                    value={medication.name}
                    onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-item">
                  <label className="form-label">Dosage*</label>
                  <Input 
                    placeholder="e.g. 10mg"
                    value={medication.dosage}
                    onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-item">
                  <label className="form-label">Frequency*</label>
                  <Input 
                    placeholder="e.g. Twice daily"
                    value={medication.frequency}
                    onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                    required
                  />
                </div>

                <div className="form-item">
                  <label className="form-label">Duration</label>
                  <Input 
                    placeholder="e.g. 14 days"
                    value={medication.duration}
                    onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-item">
                  <label className="form-label">Quantity</label>
                  <Input 
                    type="number"
                    min="1"
                    placeholder="Number of units"
                    value={medication.quantity}
                    onChange={(e) => handleMedicationChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div className="form-item">
                  <label className="form-label">Instructions</label>
                  <Textarea 
                    placeholder="Special instructions (optional)"
                    className="resize-none"
                    value={medication.instructions}
                    onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        <div className="form-section">
          <h3 className="section-title">Additional Information</h3>
          <div className="form-grid">
            <div className="form-item">
              <label className="form-label">Notes</label>
              <Textarea 
                name="notes"
                placeholder="Additional notes for this prescription"
                className="resize-none"
                value={formState.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="upload-section">
            <label className="form-label">Prescription Image</label>
            <ModernImageUpload 
              onFileSelected={handleImageUpload}
              previewUrl={imagePreview}
              accept="image/*"
              maxSizeMB={5}
            />
            <div className="text-xs text-muted-foreground mt-2">
              Upload a photo or scan of your physical prescription (optional)
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="form-section">
          <h3 className="section-title">Pharmacy Options</h3>
          <div className="checkbox-container">
            <Checkbox 
              checked={formState.sendToPharmacy}
              onCheckedChange={handleCheckboxChange}
              id="sendToPharmacy"
            />
            <div className="space-y-1 leading-none ml-2">
              <label htmlFor="sendToPharmacy" className="form-label cursor-pointer">Send to Pharmacy</label>
              <p className="text-sm text-muted-foreground">
                Send this prescription directly to a pharmacy for filling
              </p>
            </div>
          </div>

          {formState.sendToPharmacy && (
            <div className="form-item mt-4">
              <label className="form-label">Select Pharmacy*</label>
              {/* Replace Select with a native select for better compatibility */}
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formState.pharmacyId}
                onChange={(e) => handleSelectChange('pharmacyId', e.target.value)}
                disabled={loadingPharmacies}
              >
                <option value="">Select a pharmacy</option>
                {pharmacies.map(pharmacy => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.name}
                  </option>
                ))}
              </select>
              {formState.sendToPharmacy && !formState.pharmacyId && (
                <p className="form-message">Please select a pharmacy</p>
              )}
            </div>
          )}
        </div>

        <div className="form-actions">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !isFormValid()}
          >
            {loading ? (
              <>Submitting...</>
            ) : (
              <>
                <FilePlus className="w-4 h-4 mr-2" />
                Save Prescription
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
