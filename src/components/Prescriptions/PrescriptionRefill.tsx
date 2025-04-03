'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import PharmacySelector from './PharmacySelector';
import { useToast } from '@/components/ui/use-toast';
import { Prescription } from '@/lib/hooks/use-prescriptions';

interface PrescriptionRefillProps {
  prescription: Prescription | null;
}

export default function PrescriptionRefill({ prescription }: PrescriptionRefillProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pharmacyId, setPharmacyId] = useState<string>('');
  const [deliveryOption, setDeliveryOption] = useState<string>('pickup');
  const [useDefaultAddress, setUseDefaultAddress] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!pharmacyId) {
      toast({
        title: "Error",
        description: "Please select a pharmacy",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // In a real app, submit the refill request to your API
      console.log("Submitting refill request:", {
        prescriptionId: prescription?.id,
        pharmacyId,
        deliveryOption,
        useDefaultAddress,
        notes
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Refill request submitted",
        description: `Your prescription refill has been sent to the selected pharmacy.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your refill request",
        variant: "destructive",
      });
      console.error('Error submitting refill request:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!prescription) {
    return <div>No prescription selected</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontWeight: '500', fontSize: '16px' }}>Prescription Details</h3>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
          {prescription.medications.join(', ')} • Prescribed by Dr. {prescription.doctorName}
        </p>
      </div>

      <Separator />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Label>Select Pharmacy</Label>
          <PharmacySelector value={pharmacyId} onChange={setPharmacyId} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Label>Delivery Options</Label>
          <RadioGroup defaultValue="pickup" onValueChange={setDeliveryOption} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', paddingTop: '8px' }}>
            <div>
              <RadioGroupItem value="pickup" id="pickup" />
              <Label
                htmlFor="pickup"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '4px',
                  border: '2px solid #e9e9e9',
                  padding: '16px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Pickup</span>
                <span style={{ fontSize: '12px', color: '#666' }}>Free • In store</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="standard" id="standard" />
              <Label
                htmlFor="standard"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '4px',
                  border: '2px solid #e9e9e9',
                  padding: '16px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Standard Delivery</span>
                <span style={{ fontSize: '12px', color: '#666' }}>KES 399 • 2-3 days</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="express" id="express" />
              <Label
                htmlFor="express"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '4px',
                  border: '2px solid #e9e9e9',
                  padding: '16px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Express Delivery</span>
                <span style={{ fontSize: '12px', color: '#666' }}>KES 799 • Same day</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {deliveryOption !== 'pickup' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingTop: '4px' }}>
            <Checkbox
              id="use-default-address"
              checked={useDefaultAddress}
              onCheckedChange={(checked) => setUseDefaultAddress(checked as boolean)}
            />
            <div style={{ display: 'grid', gap: '4px' }}>
              <Label
                htmlFor="use-default-address"
                style={{ fontSize: '14px', fontWeight: '500', lineHeight: '1' }}
              >
                Use default delivery address
              </Label>
                <p style={{ fontSize: '12px', color: '#666' }}>
                123 Kimathi Street, South C, Nairobi 00100, Kenya
                </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any special instructions or notes for the pharmacy..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ resize: 'none', height: '96px' }}
          />
        </div>
      </div>

      <Button
        type="submit"
        style={{ width: '100%' }}
        disabled={loading || !pharmacyId}
      >
        {loading ? "Submitting..." : "Submit Refill Request"}
      </Button>
    </form>
  );
}
