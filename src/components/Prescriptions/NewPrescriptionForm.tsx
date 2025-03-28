'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Plus, Trash2, Upload } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PharmacySelector from './PharmacySelector';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: number;
  instructions: string;
}

interface PrescriptionFormData {
  doctorName: string;
  doctorContact: string;
  issueDate: Date | undefined;
  expiryDate: Date | undefined;
  medications: Medication[];
  notes: string;
  pharmacyId: string;
  sendToPharmacy: boolean;
}

export default function NewPrescriptionForm() {
  const { toast } = useToast();
  const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<PrescriptionFormData>({
    doctorName: '',
    doctorContact: '',
    issueDate: undefined,
    expiryDate: undefined,
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: '',
    pharmacyId: '',
    sendToPharmacy: false
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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
      // In a real app, submit the form data and image to your API
      console.log('Form data:', formData);
      console.log('Prescription image:', prescriptionImage);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Prescription submitted",
        description: formData.sendToPharmacy 
          ? "Your prescription has been sent to the pharmacy"
          : "Your prescription has been saved",
      });

      // Reset form
      setFormData({
        doctorName: '',
        doctorContact: '',
        issueDate: undefined,
        expiryDate: undefined,
        medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        notes: '',
        pharmacyId: '',
        sendToPharmacy: false
      });
      setPrescriptionImage(null);
      setImagePreview(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your prescription",
        variant: "destructive",
      });
      console.error('Error submitting prescription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="p-4 border-dashed border-2">
              <div className="text-center space-y-4">
                <h3 className="font-medium">Upload Prescription Image</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a clear photo or scan of your prescription
                </p>

                {!imagePreview ? (
                  <div className="flex items-center justify-center">
                    <label htmlFor="prescription-image" className="cursor-pointer">
                      <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center">
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium">Click to upload</span>
                        <span className="text-xs text-muted-foreground mt-1">PNG, JPG or PDF</span>
                      </div>
                      <input
                        id="prescription-image"
                        type="file"
                        accept="image/png, image/jpeg, application/pdf"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Prescription preview"
                      className="max-h-60 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor Name</Label>
                <Input 
                  id="doctorName"
                  name="doctorName"
                  placeholder="Dr. John Smith"
                  value={formData.doctorName}
                  onChange={handleChange}
                  className={errors.doctorName ? 'border-destructive' : ''}
                />
                {errors.doctorName && (
                  <p className="text-sm text-destructive">{errors.doctorName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorContact">Doctor Contact (Optional)</Label>
                <Input 
                  id="doctorContact"
                  name="doctorContact"
                  placeholder="Phone or email"
                  value={formData.doctorContact}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formData.issueDate && "text-muted-foreground",
                          errors.issueDate && "border-destructive"
                        )}
                      >
                        {formData.issueDate ? (
                          format(formData.issueDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.issueDate}
                        onSelect={(date) => setFormData({ ...formData, issueDate: date })}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.issueDate && (
                    <p className="text-sm text-destructive">{errors.issueDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Expiry Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formData.expiryDate && "text-muted-foreground"
                        )}
                      >
                        {formData.expiryDate ? (
                          format(formData.expiryDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.expiryDate}
                        onSelect={(date) => setFormData({ ...formData, expiryDate: date })}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Medications</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addMedication}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Medication
              </Button>
            </div>

            {formData.medications.map((medication, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Medication #{index + 1}</h4>
                  {index > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeMedication(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Medication Name</Label>
                    <Input 
                      placeholder="e.g., Amoxicillin"
                      value={medication.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      className={errors[`medication-${index}-name`] ? 'border-destructive' : ''}
                    />
                    {errors[`medication-${index}-name`] && (
                      <p className="text-sm text-destructive">{errors[`medication-${index}-name`]}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Dosage</Label>
                      <Input 
                        placeholder="e.g., 500mg"
                        value={medication.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        className={errors[`medication-${index}-dosage`] ? 'border-destructive' : ''}
                      />
                      {errors[`medication-${index}-dosage`] && (
                        <p className="text-sm text-destructive">{errors[`medication-${index}-dosage`]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Input 
                        placeholder="e.g., 3 times daily"
                        value={medication.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                        className={errors[`medication-${index}-frequency`] ? 'border-destructive' : ''}
                      />
                      {errors[`medication-${index}-frequency`] && (
                        <p className="text-sm text-destructive">{errors[`medication-${index}-frequency`]}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Duration (Optional)</Label>
                      <Input 
                        placeholder="e.g., 7 days"
                        value={medication.duration}
                        onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantity (Optional)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 21"
                        value={medication.quantity || ''}
                        onChange={(e) => handleMedicationChange(index, 'quantity', e.target.valueAsNumber || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Special Instructions (Optional)</Label>
                    <Textarea 
                      placeholder="e.g., Take with food, avoid alcohol" 
                      className="resize-none"
                      value={medication.instructions}
                      onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            ))}

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea 
                id="notes"
                name="notes"
                placeholder="Any additional information for the pharmacy" 
                className="resize-none h-20"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-start space-x-3 space-y-0">
            <Checkbox
              id="sendToPharmacy"
              checked={formData.sendToPharmacy}
              onCheckedChange={(checked) => setFormData({ ...formData, sendToPharmacy: !!checked })}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="sendToPharmacy">
                Send to pharmacy
              </Label>
              <p className="text-sm text-muted-foreground">
                Send this prescription directly to a pharmacy for fulfillment
              </p>
            </div>
          </div>

          {formData.sendToPharmacy && (
            <div className="space-y-2">
              <Label>Select Pharmacy</Label>
              <PharmacySelector 
                value={formData.pharmacyId} 
                onChange={(value) => setFormData({ ...formData, pharmacyId: value })} 
              />
              {errors.pharmacyId && (
                <p className="text-sm text-destructive">{errors.pharmacyId}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Prescription'}
          </Button>
        </div>
      </div>
    </form>
  );
}
