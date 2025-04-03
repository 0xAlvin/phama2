import React from 'react';
import { Prescription } from '@/types/prescription';
import '@/styles/prescriptions.css';
import { getStatusClass, getStatusDisplayText } from '@/lib/utils/prescriptionUtils';

interface PrescriptionsListProps {
  prescriptions: Prescription[];
}

const PrescriptionsList: React.FC<PrescriptionsListProps> = ({ prescriptions }) => {
  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="prescriptions-empty">
        <p>You don't have any prescriptions yet.</p>
      </div>
    );
  }

  return (
    <div className="prescriptions-list">
      <h3>Your Prescriptions</h3>
      
      <div className="prescriptions-grid">
        {prescriptions.map((prescription) => (
          <div key={prescription.id} className="prescription-card">
            <div className="prescription-header">
              <h4>{prescription.medicationName}</h4>
              <span className={`status-badge ${getStatusClass(prescription.status)}`}>
                {getStatusDisplayText(prescription.status)}
              </span>
            </div>
            
            <div className="prescription-details">
              <p><strong>Doctor:</strong> {prescription.doctorName}</p>
              <p><strong>Pharmacy:</strong> {prescription.pharmacyName}</p>
              <p><strong>Dosage:</strong> {prescription.dosage}</p>
              <p><strong>Instructions:</strong> {prescription.instructions}</p>
              {prescription.refills !== undefined && (
                <p><strong>Refills:</strong> {prescription.refills}</p>
              )}
              <p><strong>Prescribed:</strong> {new Date(prescription.prescribedDate).toLocaleDateString()}</p>
            </div>
            
            <div className="prescription-actions">
              <button className="btn-secondary">Request Refill</button>
              <button className="btn-outline">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrescriptionsList;
