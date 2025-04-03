import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { prescriptions, prescriptionItems, medications, patients, pharmacies } from '@/lib/schema';
import PDFDocument from 'pdfkit';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prescriptionId = params.id;
    
    if (!prescriptionId) {
      return NextResponse.json({ error: 'Missing prescription ID' }, { status: 400 });
    }

    // Fetch prescription with all needed data
    const prescription = await db.query.prescriptions.findFirst({
      where: eq(prescriptions.id, prescriptionId),
      with: {
        patient: true
      }
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    // Check if user has access to this prescription
    if (prescription.patientId !== session.user.id && session.user.role !== 'ADMIN' && session.user.role !== 'PHARMACY') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get prescription items with medications
    const items = await db.query.prescriptionItems.findMany({
      where: eq(prescriptionItems.prescriptionId, prescription.id),
      with: {
        medication: true
      }
    });

    // Get pharmacy info if assigned
    let pharmacy = null;
    if (prescription.pharmaciesId) {
      pharmacy = await db.query.pharmacies.findFirst({
        where: eq(pharmacies.id, prescription.pharmaciesId)
      });
    }

    // Create PDF document
    const doc = new PDFDocument();
    let buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Add content to PDF
    doc.fontSize(20).text('Prescription', { align: 'center' });
    doc.moveDown();
    
    // Patient info
    doc.fontSize(14).text('Patient Information:');
    doc.fontSize(12).text(`Name: ${prescription.patient.firstName} ${prescription.patient.lastName}`);
    doc.moveDown();
    
    // Doctor info
    doc.fontSize(14).text('Doctor Information:');
    doc.fontSize(12).text(`Name: ${prescription.doctorName}`);
    if (prescription.doctorContact) {
      doc.fontSize(12).text(`Contact: ${prescription.doctorContact}`);
    }
    doc.moveDown();
    
    // Prescription details
    doc.fontSize(14).text('Prescription Details:');
    doc.fontSize(12).text(`Issue Date: ${prescription.issueDate?.toDateString() || 'Not specified'}`);
    doc.fontSize(12).text(`Expiry Date: ${prescription.expiryDate?.toDateString() || 'Not specified'}`);
    doc.fontSize(12).text(`Status: ${prescription.status}`);
    doc.moveDown();
    
    // Medications
    doc.fontSize(14).text('Medications:');
    items.forEach((item, index) => {
      doc.fontSize(12).text(`${index + 1}. ${item.medication.name}`);
      doc.fontSize(10).text(`   Dosage: ${item.dosage}`);
      doc.fontSize(10).text(`   Frequency: ${item.frequency}`);
      if (item.duration) {
        doc.fontSize(10).text(`   Duration: ${item.duration}`);
      }
      doc.fontSize(10).text(`   Quantity: ${item.quantity}`);
      if (item.instructions) {
        doc.fontSize(10).text(`   Instructions: ${item.instructions}`);
      }
      doc.moveDown(0.5);
    });
    
    // Notes if any
    if (prescription.notes) {
      doc.moveDown();
      doc.fontSize(14).text('Notes:');
      doc.fontSize(12).text(prescription.notes);
    }
    
    // Pharmacy info if assigned
    if (pharmacy) {
      doc.moveDown();
      doc.fontSize(14).text('Pharmacy:');
      doc.fontSize(12).text(`Name: ${pharmacy.name}`);
      doc.fontSize(12).text(`Contact: ${pharmacy.phone}`);
      doc.fontSize(12).text(`Email: ${pharmacy.email}`);
    }
    
    // Footer with generated date
    doc.moveDown(2);
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // Finalize the PDF
    doc.end();
    
    return new Promise<Response>((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        const headers = new Headers();
        headers.append('Content-Type', 'application/pdf');
        headers.append('Content-Disposition', `attachment; filename="prescription-${prescriptionId}.pdf"`);
        
        resolve(new Response(pdfBuffer, {
          status: 200,
          headers
        }));
      });
    });

  } catch (error) {
    console.error('Error generating prescription PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate prescription PDF' },
      { status: 500 }
    );
  }
}
