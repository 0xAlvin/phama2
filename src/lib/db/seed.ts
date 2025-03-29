import { db } from "@/lib/db";
import { 
  users, patients, patientProfiles, pharmacies, pharmacyProfiles,
  pharmacyStaff, addresses, medications, inventory, prescriptions,
  prescriptionItems, orders, orderItems, payments, deliveryOptions
} from "@/lib/schema";
import { saltAndHashPassword } from "@/lib/utils/password";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");
    
    // Make sure we're using the same password hashing as in the auth system
    console.log("Generating secure password hashes...");
    
    // Set the PASSWORD_SALT environment variable if not set
    if (!process.env.PASSWORD_SALT) {
      console.log("Warning: PASSWORD_SALT not set, using default development salt");
      process.env.PASSWORD_SALT = 'default-salt-for-development';
    }
    
    // CHANGE: Generate fresh hashes for all users instead of using a predefined hash
    // This ensures the hash will be compatible with the login process
    const patientPassword = await saltAndHashPassword("Password123!");
    const adminPassword = await saltAndHashPassword("Admin123!");
    const pharmacyPassword = await saltAndHashPassword("Pharmacy123!");
    
    console.log("Generated fresh password hashes for all seed users");
    console.log("Sample hash:", patientPassword.substring(0, 20) + "...");
    
    // Insert users
    const insertedUsers = await db.insert(users).values([
      {
        email: "patient1@example.com",
        passwordHash: patientPassword, // CHANGED: Use freshly generated hash
        role: "PATIENT",
        isVerified: true,
      },
      {
        email: "patient2@example.com",
        passwordHash: patientPassword, // CHANGED: Use freshly generated hash
        role: "PATIENT",
        isVerified: true,
      },
      {
        email: "admin@phamapp.com",
        passwordHash: adminPassword,
        role: "ADMIN",
        isVerified: true,
      },
      {
        email: "pharmacy1@example.com",
        passwordHash: pharmacyPassword,
        role: "PHARMACY",
        isVerified: true,
      },
      {
        email: "pharmacy2@example.com",
        passwordHash: pharmacyPassword,
        role: "PHARMACY",
        isVerified: true,
      }
    ]).returning();
    
    console.log("Inserted users:", insertedUsers.length);
    
    // Get user IDs for relationships
    const patientUser1Id = insertedUsers.find(u => u.email === "patient1@example.com")!.id;
    const patientUser2Id = insertedUsers.find(u => u.email === "patient2@example.com")!.id;
    const pharmacyUser1Id = insertedUsers.find(u => u.email === "pharmacy1@example.com")!.id;
    const pharmacyUser2Id = insertedUsers.find(u => u.email === "pharmacy2@example.com")!.id;
    
    // Insert patients
    const patientData = [
      {
        userId: patientUser1Id,
        firstName: "John",
        lastName: "Kamau",
        dateOfBirth: new Date("1985-05-15").toISOString(),
        phone: "+254712345678",
      },
      {
        userId: patientUser2Id,
        firstName: "Mary",
        lastName: "Wambui",
        dateOfBirth: new Date("1990-08-22").toISOString(),
        phone: "+254723456789",
      }
    ];
    const insertedPatients = await db.insert(patients).values(patientData).returning();
    
    console.log("Inserted patients:", insertedPatients.length);
    
    // Insert patient profiles
    await db.insert(patientProfiles).values([
      {
        patientId: insertedPatients[0].id,
        allergies: JSON.stringify(["Penicillin", "Dust"]),
        medicalConditions: JSON.stringify(["Hypertension", "Asthma"]),
        medications: JSON.stringify(["Lisinopril", "Ventolin"])
      },
      {
        patientId: insertedPatients[1].id,
        allergies: JSON.stringify(["Pollen", "Shellfish"]),
        medicalConditions: JSON.stringify(["Diabetes"]),
        medications: JSON.stringify(["Metformin"])
      }
    ]);
    
    // Insert pharmacies (Kenyan pharmacy names)
    const insertedPharmacies = await db.insert(pharmacies).values([
      {
        userId: pharmacyUser1Id,
        name: "Nairobi Central Pharmacy",
        licenseNumber: "KE-PHARM-2023-001",
        phone: "+254733987654",
        email: "pharmacy1@example.com"
      },
      {
        userId: pharmacyUser2Id,
        name: "Mombasa Health Chemist",
        licenseNumber: "KE-PHARM-2023-002",
        phone: "+254744123456",
        email: "pharmacy2@example.com"
      }
    ]).returning();
    
    console.log("Inserted pharmacies:", insertedPharmacies.length);
    
    // Insert pharmacy profiles
    await db.insert(pharmacyProfiles).values([
      {
        pharmacyId: insertedPharmacies[0].id,
        operatingHours: JSON.stringify({
          monday: "8:00 AM - 8:00 PM",
          tuesday: "8:00 AM - 8:00 PM",
          wednesday: "8:00 AM - 8:00 PM",
          thursday: "8:00 AM - 8:00 PM",
          friday: "8:00 AM - 8:00 PM",
          saturday: "9:00 AM - 6:00 PM",
          sunday: "10:00 AM - 4:00 PM"
        }),
        services: JSON.stringify(["Prescription filling", "Medication counseling", "Blood pressure monitoring"]),
        description: "A leading pharmacy in Nairobi's central business district offering a wide range of medications and healthcare services."
      },
      {
        pharmacyId: insertedPharmacies[1].id,
        operatingHours: JSON.stringify({
          monday: "8:30 AM - 7:00 PM",
          tuesday: "8:30 AM - 7:00 PM",
          wednesday: "8:30 AM - 7:00 PM",
          thursday: "8:30 AM - 7:00 PM",
          friday: "8:30 AM - 7:00 PM",
          saturday: "9:00 AM - 5:00 PM",
          sunday: "Closed"
        }),
        services: JSON.stringify(["Prescription filling", "Health consultations", "Home delivery"]),
        description: "A trusted pharmacy serving the Mombasa region with quality medications and personalized healthcare advice."
      }
    ]);
    
    // Insert pharmacy staff
    await db.insert(pharmacyStaff).values([
      {
        userId: pharmacyUser1Id,
        pharmacyId: insertedPharmacies[0].id,
        position: "Chief Pharmacist"
      },
      {
        userId: pharmacyUser2Id,
        pharmacyId: insertedPharmacies[1].id,
        position: "Head Pharmacist"
      }
    ]);
    
    // Insert addresses (Kenyan addresses)
    await db.insert(addresses).values([
      {
        userId: patientUser1Id,
        streetAddress: "123 Kimathi Street",
        city: "Nairobi",
        state: "Nairobi County",
        zipCode: "00100",
        country: "Kenya",
        isDefault: true
      },
      {
        userId: patientUser2Id,
        streetAddress: "456 Moi Avenue",
        city: "Nairobi",
        state: "Nairobi County",
        zipCode: "00200",
        country: "Kenya",
        isDefault: true
      },
      {
        pharmacyId: insertedPharmacies[0].id,
        streetAddress: "789 Kenyatta Avenue",
        city: "Nairobi",
        state: "Nairobi County",
        zipCode: "00100",
        country: "Kenya",
        isDefault: true
      },
      {
        pharmacyId: insertedPharmacies[1].id,
        streetAddress: "321 Nyerere Avenue",
        city: "Mombasa",
        state: "Mombasa County",
        zipCode: "80100",
        country: "Kenya",
        isDefault: true
      }
    ]);
    
    // Insert medications
    const insertedMedications = await db.insert(medications).values([
      {
        name: "Paracetamol",
        genericName: "Acetaminophen",
        description: "Pain reliever and fever reducer",
        dosageForm: "Tablet",
        strength: "500mg",
        manufacturer: "KenPharm Industries",
        requiresPrescription: false
      },
      {
        name: "Amoxicillin",
        genericName: "Amoxicillin",
        description: "Antibiotic used to treat bacterial infections",
        dosageForm: "Capsule",
        strength: "250mg",
        manufacturer: "NaiHealth Pharmaceuticals",
        requiresPrescription: true
      },
      {
        name: "Omeprazole",
        genericName: "Omeprazole",
        description: "Proton pump inhibitor used for gastric issues",
        dosageForm: "Capsule",
        strength: "20mg",
        manufacturer: "East Africa Medicines",
        requiresPrescription: true
      },
      {
        name: "Metformin",
        genericName: "Metformin Hydrochloride",
        description: "Oral diabetes medicine to control blood sugar levels",
        dosageForm: "Tablet",
        strength: "500mg",
        manufacturer: "KenMed Laboratories",
        requiresPrescription: true
      },
      {
        name: "Lisinopril",
        genericName: "Lisinopril",
        description: "ACE inhibitor used to treat high blood pressure",
        dosageForm: "Tablet",
        strength: "10mg",
        manufacturer: "NaiHealth Pharmaceuticals",
        requiresPrescription: true
      }
    ]).returning();
    
    console.log("Inserted medications:", insertedMedications.length);
    
    // Insert inventory (prices in Kenyan Shillings)
    await db.insert(inventory).values([
      {
        pharmacyId: insertedPharmacies[0].id,
        medicationId: insertedMedications[0].id,
        quantity: 500,
        batchNumber: "KE-BATCH-001",
        expiryDate: new Date("2025-12-31").toISOString(),
        price: "150.00" // KES as string
      },
      {
        pharmacyId: insertedPharmacies[0].id,
        medicationId: insertedMedications[1].id,
        quantity: 200,
        batchNumber: "KE-BATCH-002",
        expiryDate: new Date("2025-06-30").toISOString(),
        price: "350.00" // KES as string
      },
      {
        pharmacyId: insertedPharmacies[0].id,
        medicationId: insertedMedications[2].id,
        quantity: 150,
        batchNumber: "KE-BATCH-003",
        expiryDate: new Date("2024-08-31").toISOString(),
        price: "420.00" // KES as string
      },
      {
        pharmacyId: insertedPharmacies[0].id,
        medicationId: insertedMedications[2].id,
        quantity: 150,
        batchNumber: "KE-BATCH-003",
        expiryDate: new Date("2024-08-31").toISOString(),
        price: "420.00" // KES as string
      },
      {
        pharmacyId: insertedPharmacies[1].id,
        medicationId: insertedMedications[0].id,
        quantity: 400,
        batchNumber: "KE-BATCH-101",
        expiryDate: new Date("2025-10-31").toISOString(),
        price: "145.00" // KES as string
      },
      {
        pharmacyId: insertedPharmacies[1].id,
        medicationId: insertedMedications[3].id,
        quantity: 180,
        batchNumber: "KE-BATCH-102",
        expiryDate: new Date("2024-11-30").toISOString(),
        price: "780.00" // KES as string
      },
      {
        pharmacyId: insertedPharmacies[1].id,
        medicationId: insertedMedications[4].id,
        quantity: 120,
        batchNumber: "KE-BATCH-103",
        expiryDate: new Date("2025-04-30").toISOString(),
        price: "950.00" // KES as string
      }
    ]);
    
    // Insert prescriptions
    const insertedPrescriptions = await db.insert(prescriptions).values([
      {
        patientId: insertedPatients[0].id,
        doctorName: "Dr. John Mwangi",
        doctorContact: "+254755123456",
        issueDate: new Date("2023-11-01").toISOString(),
        expiryDate: new Date("2023-12-01").toISOString(),
        status: "active",
        notes: "Take as directed"
      },
      {
        patientId: insertedPatients[1].id,
        doctorName: "Dr. Sarah Njeri",
        doctorContact: "+254766234567",
        issueDate: new Date("2023-10-15").toISOString(),
        expiryDate: new Date("2023-11-15").toISOString(),
        status: "active",
        notes: "Follow up in one month"
      }
    ]).returning();
    
    // Insert prescription items
    await db.insert(prescriptionItems).values([
      {
        prescriptionId: insertedPrescriptions[0].id,
        medicationId: insertedMedications[1].id,
        dosage: "250mg",
        frequency: "Three times daily",
        duration: "7 days",
        quantity: 21,
        instructions: "Take after meals"
      },
      {
        prescriptionId: insertedPrescriptions[0].id,
        medicationId: insertedMedications[2].id,
        dosage: "20mg",
        frequency: "Once daily",
        duration: "30 days",
        quantity: 30,
        instructions: "Take before breakfast"
      },
      {
        prescriptionId: insertedPrescriptions[1].id,
        medicationId: insertedMedications[3].id,
        dosage: "500mg",
        frequency: "Twice daily",
        duration: "90 days",
        quantity: 180,
        instructions: "Take with meals"
      }
    ]);
    
    // Insert orders
    const insertedOrders = await db.insert(orders).values([
      {
        patientId: insertedPatients[0].id,
        pharmacyId: insertedPharmacies[0].id,
        totalAmount: "12600.00", // KES as string
        status: "completed",
        prescriptionId: insertedPrescriptions[0].id
      },
      {
        patientId: insertedPatients[1].id,
        pharmacyId: insertedPharmacies[1].id,
        totalAmount: "2340.00", // KES as string
        status: "processing",
        prescriptionId: null
      }
    ]).returning();
    
    // Insert order items
    await db.insert(orderItems).values([
      {
        orderId: insertedOrders[0].id,
        medicationId: insertedMedications[1].id,
        quantity: 21,
        price: "350.00" // KES as string
      },
      {
        orderId: insertedOrders[0].id,
        medicationId: insertedMedications[2].id,
        quantity: 30,
        price: "420.00" // KES as string
      },
      {
        orderId: insertedOrders[1].id,
        medicationId: insertedMedications[0].id,
        quantity: 10,
        price: "145.00" // KES as string
      },
      {
        orderId: insertedOrders[1].id,
        medicationId: insertedMedications[3].id,
        quantity: 1,
        price: "780.00" // KES as string
      }
    ]);
    
    // Insert payments
    await db.insert(payments).values([
      {
        orderId: insertedOrders[0].id,
        amount: "12600.00", // KES as string
        paymentMethod: "M-PESA",
        status: "completed",
        transactionId: "MPESA123456789"
      },
      {
        orderId: insertedOrders[1].id,
        amount: "2340.00", // KES as string
        paymentMethod: "M-PESA",
        status: "pending",
        transactionId: "MPESA987654321"
      }
    ]);
    
    // Insert delivery options
    await db.insert(deliveryOptions).values([
      {
        name: "Standard Delivery",
        description: "Delivery within 24-48 hours",
        cost: "200.00", // KES as string
        estimatedTimeHours: 36,
        isActive: true
      },
      {
        name: "Express Delivery",
        description: "Same day delivery within Nairobi",
        cost: "450.00", // KES as string
        estimatedTimeHours: 6,
        isActive: true
      },
      {
        name: "Pickup",
        description: "Collect from pharmacy",
        cost: "0.00", // KES as string
        estimatedTimeHours: 1,
        isActive: true
      },
      {
        name: "Rural Delivery",
        description: "Delivery to areas outside major cities",
        cost: "550.00", // KES as string
        estimatedTimeHours: 72,
        isActive: true
      }
    ]);
    
    console.log("Database seeding completed successfully!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

