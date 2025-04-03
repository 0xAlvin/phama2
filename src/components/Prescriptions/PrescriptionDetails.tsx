'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  ChevronLeft, 
  Download,
  FilePlus
} from 'lucide-react';
import { getPrescriptionById, downloadPrescription } from '@/services/prescriptionService';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import './PrescriptionsList.css';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
}

interface Prescription {
  id: string;
  doctorName: string;
  doctorContact: string | undefined;
  issueDate: string;
  expiryDate: string | null | undefined;
  status: string; // This stays the same but we'll normalize it when displaying
  notes: string | undefined;
  items: Medication[];
  imageUrl: string | undefined;
  pharmacyName: string | undefined;
}

interface PrescriptionDetailsProps {
  prescriptionId: string;
  onBack?: () => void;
}

const PrescriptionDetails: React.FC<PrescriptionDetailsProps> = ({ 
  prescriptionId,
  onBack 
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPrescriptionById(prescriptionId);
        if (data) {
          setPrescription(data);
        } else {
          setError('Failed to load prescription details');
          toast({
            title: "Error",
            description: "Could not load prescription details",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error('Error fetching prescription details:', err);
        setError('An error occurred while loading prescription details');
        toast({
          title: "Error",
          description: "Failed to load prescription details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (prescriptionId) {
      fetchPrescription();
    }
  }, [prescriptionId, toast]);

  const handleDownload = async () => {
    try {
      if (!prescription) return;
      
      const result = await downloadPrescription(prescription.id);
      if (result.success && result.url) {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = `prescription-${prescription.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(result.url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "Prescription downloaded successfully",
        });
      } else {
        throw new Error(result.error || 'Download failed');
      }
    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast({
        title: "Download Failed",
        description: "Could not download the prescription. Please try again",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleRefill = () => {
    router.push(`/dashboard/prescriptions/refill/${prescriptionId}`);
  };

  // Add this helper function to normalize status values
  const normalizeStatus = (status: string): string => {
    // Convert to uppercase for comparison
    const uppercaseStatus = status.toUpperCase();
    
    // Map to standardized values
    if (uppercaseStatus === 'ACTIVE') return 'ACTIVE';
    if (uppercaseStatus === 'PENDING') return 'PENDING';
    if (uppercaseStatus === 'FILLED' || uppercaseStatus === 'COMPLETED') return 'FILLED';
    if (uppercaseStatus === 'EXPIRED') return 'EXPIRED';
    if (uppercaseStatus === 'REJECTED') return 'REJECTED';
    
    // Return original if not matched
    return status;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p>Loading prescription details...</p>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <FilePlus size={48} opacity={0.5} />
        </div>
        <h3>Prescription not found</h3>
        <p>{error || 'The requested prescription could not be found'}</p>
        <Button onClick={handleBack}>Go back</Button>
      </div>
    );
  }

  const formattedIssueDate = new Date(prescription.issueDate).toLocaleDateString();
  const formattedExpiryDate = prescription.expiryDate 
    ? new Date(prescription.expiryDate).toLocaleDateString() 
    : 'No expiration date';

  return (
    <div className="prescription-details-container">
      <div className="prescription-details-header">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack} 
          className="back-button"
        >
          <ChevronLeft size={16} />
          Back to Prescriptions
        </Button>
        
        <div className="prescription-details-actions">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="action-button"
          >
            <Download size={16} />
            Download
          </Button>
          
          {prescription.status !== 'EXPIRED' && prescription.status !== 'FILLED' && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleRefill}
              className="action-button"
            >
              <FilePlus size={16} />
              Request Refill
            </Button>
          )}
        </div>
      </div>

      <div className="prescription-details-content">
        <div className="prescription-details-info">
          <div className="prescription-info-header">
            <div>
              <h2 className="prescription-info-title">
                Prescription Details
              </h2>
              <div className="prescription-info-subtitle">
                <span className="prescription-info-doctor">
                  Prescribed by Dr. {prescription.doctorName}
                </span>
                <span className={`prescription-status status-${normalizeStatus(prescription.status).toLowerCase()}`}>
                  {normalizeStatus(prescription.status)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="prescription-info-card">
            <div className="prescription-info-section">
              <h3 className="prescription-section-title">General Information</h3>
              <div className="prescription-info-grid">
                <div className="prescription-info-item">
                  <span className="info-label">Issue Date</span>
                  <span className="info-value">
                    <Calendar className="inline-icon" /> {formattedIssueDate}
                  </span>
                </div>
                <div className="prescription-info-item">
                  <span className="info-label">Expiry Date</span>
                  <span className="info-value">
                    <Clock className="inline-icon" /> {formattedExpiryDate}
                  </span>
                </div>
                <div className="prescription-info-item">
                  <span className="info-label">Doctor</span>
                  <span className="info-value">
                    <User className="inline-icon" /> {prescription.doctorName}
                  </span>
                </div>
                {prescription.doctorContact && (
                  <div className="prescription-info-item">
                    <span className="info-label">Contact</span>
                    <span className="info-value">
                      <Phone className="inline-icon" /> {prescription.doctorContact}
                    </span>
                  </div>
                )}
                {prescription.pharmacyName && (
                  <div className="prescription-info-item">
                    <span className="info-label">Pharmacy</span>
                    <span className="info-value">{prescription.pharmacyName}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="prescription-info-section">
              <h3 className="prescription-section-title">Medications</h3>
              {prescription.items && prescription.items.length > 0 ? (
                <div className="medications-list">
                  {prescription.items.map((medication, index) => (
                    <div className="medication-item" key={index}>
                      <h4 className="medication-title">{medication.name}</h4>
                      <div className="medication-details">
                        <div className="med-detail">
                          <span className="med-label">Dosage</span>
                          <span>{medication.dosage}</span>
                        </div>
                        <div className="med-detail">
                          <span className="med-label">Frequency</span>
                          <span>{medication.frequency}</span>
                        </div>
                        {medication.duration && (
                          <div className="med-detail">
                            <span className="med-label">Duration</span>
                            <span>{medication.duration}</span>
                          </div>
                        )}
                        {medication.quantity && (
                          <div className="med-detail">
                            <span className="med-label">Quantity</span>
                            <span>{medication.quantity}</span>
                          </div>
                        )}
                      </div>
                      {medication.instructions && (
                        <div className="med-instructions">
                          <span className="med-label">Instructions</span>
                          <p>{medication.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-medications">No medications listed.</p>
              )}
            </div>
            
            {prescription.notes && (
              <div className="prescription-info-section">
                <h3 className="prescription-section-title">Notes</h3>
                <p className="prescription-notes">{prescription.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        {prescription.imageUrl && (
          <div className="prescription-image-section">
            <h3 className="prescription-section-title">Prescription Image</h3>
            <div className="prescription-image-container">
              <Image
                src={prescription.imageUrl}
                alt="Prescription"
                fill
                className="prescription-full-image"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDetails;
