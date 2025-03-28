'use client'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import { useSession } from 'next-auth/react'
import React from 'react'

function Overview() {
    const { data: session, status } = useSession();

    return (
        <DashboardLayout>
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Your Profile Overview</h1>
                
                {status === 'loading' ? (
                    <p>Loading session information...</p>
                ) : session ? (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold">Session Information</h2>
                            <p><strong>Name:</strong> {session.user.name}</p>
                            <p><strong>Email:</strong> {session.user.email}</p>
                            {session.user.profileUrl && (
                                <p><strong>Profile URL:</strong> {session.user.profileUrl}</p>
                            )}
                        </div>
                        
                        <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-80">
                            {JSON.stringify(session, null, 2)}
                        </pre>
                    </div>
                ) : (
                    <p>Not signed in</p>
                )}
            </div>
        </DashboardLayout>
    )
}

export default Overview