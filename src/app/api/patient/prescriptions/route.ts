import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrescriptionRepository } from '@/lib/repositories/PrescriptionRepository';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get patientId from query param or from session user
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId') || session.user.id;
    
    // Validate if the requesting user has access to this patient's data
    // (if the requested patientId is different from the logged-in user)
    if (patientId !== session.user.id) {
      // Check if user has proper permissions (doctor, admin, etc.)
      const isAuthorized = session.user.role === 'ADMIN' || 
                          session.user.role === 'DOCTOR';
                          
      if (!isAuthorized) {
        return NextResponse.json({ 
          error: 'Unauthorized to access this patient\'s prescriptions' 
        }, { status: 403 });
      }
    }
    
    const prescriptionRepo = new PrescriptionRepository();
    const prescriptions = await prescriptionRepo.findByPatient(patientId);
    
    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    
    // Ensure we always return a proper JSON response even for server errors
    return NextResponse.json({
      error: 'Failed to fetch patient prescriptions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
