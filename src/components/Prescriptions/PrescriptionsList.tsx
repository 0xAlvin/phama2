'use client';

import React, { useEffect, useState } from 'react';
import { Prescription } from '@/types/prescription';
import { ChevronLeft, ChevronRight, Calendar, FileText, Download, Eye } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';

// Mock data - replace with actual API call in production
const mockPrescriptions: Prescription[] = Array(25).fill(null).map((_, i) => ({
  id: `presc-${i+1}`,
  dateIssued: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
  medication: ['Amoxicillin 500mg', 'Ibuprofen 400mg', 'Cetirizine 10mg'][i % 3],
  doctor: ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'][i % 3],
  status: ['Pending', 'Filled', 'Expired'][i % 3] as 'Pending' | 'Filled' | 'Expired',
  imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  pharmacy: ['Downtown Pharmacy', 'MedExpress', 'HealthPlus'][i % 3],
  instructions: 'Take one tablet three times daily with food.'
}));

const ITEMS_PER_PAGE = 5;

export default function PrescriptionsList() {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    // Simulate API call
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setPrescriptions(mockPrescriptions);
        setTotalPages(Math.ceil(mockPrescriptions.length / ITEMS_PER_PAGE));
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  // Get current page items
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = prescriptions.slice(indexOfFirstItem, indexOfLastItem);

  const handlePreviousPage = () => {
    setCurrentPage(old => Math.max(old - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(old => Math.min(old + 1, totalPages));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (prescriptions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <FileText size={48} opacity={0.5} />
        </div>
        <h3>No prescriptions found</h3>
        <p>You don't have any prescriptions yet. When you do, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="prescriptions-list">
      {currentItems.map((prescription) => (
        <div key={prescription.id} className="prescription-card">
          <div className="prescription-header">
            <div className="prescription-meta">
              <div className="prescription-date">
                <Calendar className="icon-sm" />
                <span>{new Date(prescription.dateIssued).toLocaleDateString()}</span>
              </div>
              <div className={`prescription-status status-${prescription.status.toLowerCase()}`}>
                {prescription.status}
              </div>
            </div>
            <div className="prescription-title">
              <h3>{prescription.medication}</h3>
              <p>Prescribed by {prescription.doctor}</p>
            </div>
          </div>
          <div className="prescription-body">
            <div className="prescription-details">
              <p><strong>Pharmacy:</strong> {prescription.pharmacy}</p>
              <p><strong>Instructions:</strong> {prescription.instructions}</p>
            </div>
            <div className="prescription-image">
              <Button variant="ghost" size="sm" className="image-preview-button">
                <div className="image-preview-container">
                  <Image
                    src={prescription.imageUrl}
                    alt="Prescription image"
                    fill
                    className="prescription-img"
                  />
                </div>
              </Button>
            </div>
          </div>
          <div className="prescription-actions">
            <Button variant="outline" size="sm" className="action-button">
              <Eye size={16} />
              View Details
            </Button>
            <Button variant="outline" size="sm" className="action-button">
              <Download size={16} />
              Download
            </Button>
          </div>
        </div>
      ))}
      
      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <div className="pagination-controls">
            <Button 
              onClick={handlePreviousPage} 
              disabled={currentPage === 1} 
              variant="outline" 
              size="sm" 
              className="pagination-button"
            >
              <ChevronLeft size={18} />
              <span className="sr-only">Previous</span>
            </Button>
            <Button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages} 
              variant="outline" 
              size="sm" 
              className="pagination-button"
            >
              <ChevronRight size={18} />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
