'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, FileText, Download, Eye } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Prescription, getPatientPrescriptions, downloadPrescription } from '@/services/prescriptionService';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import './PrescriptionsList.css'; // We'll use CSS instead of Tailwind

const ITEMS_PER_PAGE = 5;

export default function PrescriptionsList() {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        // Check if we have a valid session with user ID
        if (!session?.user?.id) {
          toast({
            title: "Authentication required",
            description: "Please sign in to view your prescriptions.",
            variant: "destructive",
          });
          router.push('/signin');
          return;
        }

        // Use the authenticated user's ID
        const patientId = session.user.id;
        const response = await getPatientPrescriptions(patientId);
        
        if (response.success && response.data) {
          setPrescriptions(response.data);
          setTotalPages(Math.ceil(response.data.length / ITEMS_PER_PAGE));
        } else {
          // Handle different error types
          if (response.error?.type === 'UNAUTHORIZED') {
            toast({
              title: "Session expired",
              description: "Please sign in again to view your prescriptions.",
              variant: "destructive",
            });
            // Redirect to signin page (not login)
            router.push('/signin');
          } else {
            toast({
              title: "Error",
              description: response.error?.message || "Failed to load prescriptions. Please try again later.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        toast({
          title: "Error",
          description: "Failed to load prescriptions. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [session, toast, router]);

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

  const handleViewDetails = (prescriptionId: string) => {
    router.push(`/prescriptions/${prescriptionId}`);
  };

  const handleDownload = async (prescriptionId: string) => {
    try {
      const result = await downloadPrescription(prescriptionId);
      
      if (result.success && result.url) {
        // Create an anchor element and trigger download
        const a = document.createElement('a');
        a.href = result.url;
        a.download = `prescription-${prescriptionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(result.url);
        document.body.removeChild(a);
      } else {
        throw new Error(result.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Could not download the prescription. Please try again later.",
        variant: "destructive",
      });
    }
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
                <span>{new Date(prescription.issueDate).toLocaleDateString()}</span>
              </div>
              <div className={`prescription-status status-${prescription.status.toLowerCase()}`}>
                {prescription.status}
              </div>
            </div>
            <div className="prescription-title">
              <h3>{prescription.items[0]?.name || 'Prescription'}</h3>
              <p>Prescribed by {prescription.doctorName}</p>
            </div>
          </div>
          <div className="prescription-body">
            <div className="prescription-details">
              {prescription.pharmacy && (
                <p><strong>Pharmacy:</strong> {prescription.pharmacy}</p>
              )}
              <p><strong>Medications:</strong> {prescription.items.length}</p>
              {prescription.items.length > 0 && (
                <p><strong>Instructions:</strong> {prescription.items[0].instructions}</p>
              )}
            </div>
            {prescription.imageUrl && (
              <div className="prescription-image">
                <div className="image-preview-container">
                  <Image
                    src={prescription.imageUrl}
                    alt="Prescription image"
                    fill
                    className="prescription-img"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="prescription-actions">
            <Button 
              variant="outline" 
              size="sm" 
              className="action-button"
              onClick={() => handleViewDetails(prescription.id)}
            >
              <Eye size={16} />
              View Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="action-button"
              onClick={() => handleDownload(prescription.id)}
            >
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
