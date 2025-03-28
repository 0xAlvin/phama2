import { NextResponse } from 'next/server';

// This is a mock API endpoint - in a real application, you would fetch from a database
export async function GET() {
  // Sample product data
  const products = [
    {
      id: '1',
      name: 'Amoxicillin',
      description: 'Antibiotic used to treat a number of bacterial infections.',
      price: 15.99,
      dosage: '500mg',
      inventory: 43,
      imageUrl: '/images/medications/amoxicillin.jpg',
      prescription: true,
      pharmacy: {
        id: '101',
        name: 'Central Pharmacy',
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        phone: '555-123-4567'
      },
      category: 'Antibiotics'
    },
    {
      id: '2',
      name: 'Lisinopril',
      description: 'Medication used to treat high blood pressure and heart failure.',
      price: 12.50,
      dosage: '10mg',
      inventory: 72,
      imageUrl: '/images/medications/lisinopril.jpg',
      prescription: true,
      pharmacy: {
        id: '102',
        name: 'QuickCare Pharmacy',
        address: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702',
        phone: '555-987-6543'
      },
      category: 'Blood Pressure'
    },
    {
      id: '3',
      name: 'Ibuprofen',
      description: 'Nonsteroidal anti-inflammatory drug used for treating pain, fever, and inflammation.',
      price: 8.99,
      dosage: '200mg',
      inventory: 120,
      imageUrl: '/images/medications/ibuprofen.jpg',
      prescription: false,
      pharmacy: {
        id: '101',
        name: 'Central Pharmacy',
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        phone: '555-123-4567'
      },
      category: 'Pain Relief'
    },
    {
      id: '4',
      name: 'Atorvastatin',
      description: 'Statin medication used to prevent cardiovascular disease and treat abnormal lipid levels.',
      price: 22.99,
      dosage: '20mg',
      inventory: 55,
      imageUrl: '/images/medications/atorvastatin.jpg',
      prescription: true,
      pharmacy: {
        id: '103',
        name: 'HealthPlus Pharmacy',
        address: '789 Pine Blvd',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62703',
        phone: '555-456-7890'
      },
      category: 'Cholesterol'
    },
    {
      id: '5',
      name: 'Loratadine',
      description: 'Antihistamine used to treat allergies.',
      price: 10.45,
      dosage: '10mg',
      inventory: 95,
      imageUrl: '/images/medications/loratadine.jpg',
      prescription: false,
      pharmacy: {
        id: '102',
        name: 'QuickCare Pharmacy',
        address: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702',
        phone: '555-987-6543'
      },
      category: 'Allergies'
    },
    {
      id: '6',
      name: 'Sertraline',
      description: 'Antidepressant in the selective serotonin reuptake inhibitor (SSRI) class.',
      price: 18.75,
      dosage: '50mg',
      inventory: 30,
      imageUrl: '/images/medications/sertraline.jpg',
      prescription: true,
      pharmacy: {
        id: '103',
        name: 'HealthPlus Pharmacy',
        address: '789 Pine Blvd',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62703',
        phone: '555-456-7890'
      },
      category: 'Mental Health'
    },
    {
      id: '7',
      name: 'Acetaminophen',
      description: 'Medication used to treat pain and fever. It is typically used for mild to moderate pain.',
      price: 7.25,
      dosage: '500mg',
      inventory: 150,
      imageUrl: '/images/medications/acetaminophen.jpg',
      prescription: false,
      pharmacy: {
        id: '101',
        name: 'Central Pharmacy',
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        phone: '555-123-4567'
      },
      category: 'Pain Relief'
    },
    {
      id: '8',
      name: 'Metformin',
      description: 'First-line medication for the treatment of type 2 diabetes.',
      price: 14.30,
      dosage: '500mg',
      inventory: 62,
      imageUrl: '/images/medications/metformin.jpg',
      prescription: true,
      pharmacy: {
        id: '102',
        name: 'QuickCare Pharmacy',
        address: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702',
        phone: '555-987-6543'
      },
      category: 'Diabetes'
    },
    {
      id: '9',
      name: 'Cetirizine',
      description: 'Second-generation antihistamine used to treat allergic rhinitis and urticaria.',
      price: 9.99,
      dosage: '10mg',
      inventory: 0, // Out of stock
      imageUrl: '/images/medications/cetirizine.jpg',
      prescription: false,
      pharmacy: {
        id: '103',
        name: 'HealthPlus Pharmacy',
        address: '789 Pine Blvd',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62703',
        phone: '555-456-7890'
      },
      category: 'Allergies'
    },
  ];

  return NextResponse.json(products);
}
