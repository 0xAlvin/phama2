'use client'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import { useSession } from 'next-auth/react'
import React from 'react'
import PatientDashboard from '@/components/Dashboard/PatientDashboard';
import PharmacyDashboard from '@/components/Dashboard/PharmacyDashboard';

function Overview() {
    const { data: session, status } = useSession();

    // Helper function to determine user role
    const getUserRole = () => {
        if (!session?.user) return null;
        // Assuming the role is stored in the session user object
        // Adjust this based on your actual session structure
        return session.user.role || 'patient'; // Default to patient if role is not specified
    };

    return (
        <DashboardLayout>
            {status === 'loading' ? (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : session ? (
                <>
                    {getUserRole() === 'pharmacy' ? (
                        <PharmacyDashboard session={session} />
                    ) : (
                        <PatientDashboard session={session} />
                    )}
                </>
            ) : (
                <div className="p-6 bg-white rounded-lg shadow-md text-center">
                    <h2 className="text-xl font-semibold text-red-600">Not Signed In</h2>
                    <p className="mt-2">Please sign in to access your dashboard</p>
                    <button 
                        onClick={() => window.location.href = '/signin'} 
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary"
                    >
                        Sign In
                    </button>
                </div>
            )}
        </DashboardLayout>
    )
}

export default Overview
