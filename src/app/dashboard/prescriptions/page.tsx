import { Suspense } from 'react';
import { Metadata } from 'next';
import PrescriptionsList from '@/components/Prescriptions/PrescriptionsList';
import NewPrescriptionForm from '@/components/Prescriptions/NewPrescriptionForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { FileText, FilePlus } from 'lucide-react';
import PageHeaderTitle from '@/components/Dashboard/PageHeaderTitle';
import LoadingSpinner from '@/components/ui/loading-spinner';
import '@/styles/components.css';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';

export const metadata: Metadata = {
  title: 'Prescriptions | PhamApp',
  description: 'Manage and submit your medical prescriptions',
};

export default function PrescriptionsPage() {
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
          
          {/* Move these tab triggers inside the Tabs component */}
        </div>

        <Tabs defaultValue="my-prescriptions" className="full-width prescriptions-tabs">
          {/* Put TabsList inside the Tabs component */}
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
                <PrescriptionsList />
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
