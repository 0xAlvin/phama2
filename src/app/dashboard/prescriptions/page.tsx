"use client"

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PrescriptionsList from '@/components/Prescriptions/PrescriptionsList';
import NewPrescriptionForm from '@/components/Prescriptions/NewPrescriptionForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { FileText, FilePlus, AlertCircle } from 'lucide-react';
import PageHeaderTitle from '@/components/Dashboard/PageHeaderTitle';
import LoadingSpinner from '@/components/ui/loading-spinner';
import '@/styles/components.css';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Prescription } from '@/types/prescription';

// Remove direct import of prescriptionStore which imports db modules
// import { usePrescriptionStore } from '@/store/prescriptionStore';

export default function PrescriptionsPage() {
  // Replace store with local state
  // const { prescriptions, fetchPrescriptions, loading, error } = usePrescriptionStore();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'my-prescriptions');

  useEffect(() => {
    if (session?.user?.id) {
      fetchPrescriptionsData(session.user.id);
    }
  }, [session?.user?.id]);

  // Separate API fetch function to replace the store
  const fetchPrescriptionsData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/prescriptions?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle 404 (No prescriptions found) gracefully without treating it as an error
      if (response.status === 404) {
        setPrescriptions([]);
        setLoading(false);
        return;
      }

      // For other non-OK responses, handle as errors
      if (!response.ok) {
        const errorMessage = `Failed to fetch prescriptions (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab changes from URL parameters
  useEffect(() => {
    if (tabParam && (tabParam === 'my-prescriptions' || tabParam === 'new-prescription')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/prescriptions?tab=${value}`);
  };

  return (
    <DashboardLayout>
      <div className="prescriptions-container">
        <div className="sticky-header">
          <PageHeaderTitle 
            title="Prescriptions" 
            description="Manage your medical prescriptions and submit new ones to your preferred pharmacy"
            icon={FileText} 
          />
          
          <Separator className="my-6" />
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="full-width prescriptions-tabs"
        >
          <div className="sticky-tabs-header">
            <TabsList className="tabs-list-margin">
              <TabsTrigger value="my-prescriptions" className="tab-with-icon">
                <FileText className="tab-icon" />
                My Prescriptions
              </TabsTrigger>
              <TabsTrigger value="new-prescription" className="tab-with-icon">
                <FilePlus className="tab-icon" />
                Submit New Prescription
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="my-prescriptions" className="scrollable-content">
            <div className="content-card">
              <Suspense fallback={<LoadingSpinner />}>
                {loading ? (
                  <div className="loading-container">
                    <LoadingSpinner />
                    <p>Loading prescriptions...</p>
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load prescriptions. Please try again later.
                    </AlertDescription>
                  </Alert>
                ) : prescriptions && prescriptions.length > 0 ? (
                  <PrescriptionsList prescriptions={prescriptions} />
                ) : (
                  <div className="empty-state">
                    <p>You don't have any prescriptions yet.</p>
                  </div>
                )}
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="new-prescription" className="scrollable-content">
            <div className="content-card">
              <NewPrescriptionForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
