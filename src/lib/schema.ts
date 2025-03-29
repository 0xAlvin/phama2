import { pgTable, text, varchar, timestamp, integer, boolean, date, jsonb, decimal, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull().default("PATIENT"),
    isVerified: boolean("is_verified").default(false),
    profileUrl: varchar("profile_url", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Patient schema
export const patients = pgTable("patients", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Patient profile schema
export const patientProfiles = pgTable("patient_profiles", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").references(() => patients.id).notNull(),
    allergies: jsonb("allergies"),
    medicalConditions: jsonb("medical_conditions"),
    medications: jsonb("medications"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Pharmacy schema
export const pharmacies = pgTable("pharmacies", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    licenseNumber: varchar("license_number", { length: 100 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Pharmacy Profile schema
export const pharmacyProfiles = pgTable("pharmacy_profiles", {
    id: uuid("id").primaryKey().defaultRandom(),
    pharmacyId: uuid("pharmacy_id").references(() => pharmacies.id).notNull(),
    operatingHours: jsonb("operating_hours"),
    services: jsonb("services"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Pharmacy Staff schema
export const pharmacyStaff = pgTable("pharmacy_staff", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    pharmacyId: uuid("pharmacy_id").references(() => pharmacies.id).notNull(),
    position: varchar("position", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Address schema
export const addresses = pgTable("addresses", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    pharmacyId: uuid("pharmacy_id").references(() => pharmacies.id),
    streetAddress: varchar("street_address", { length: 255 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    zipCode: varchar("zip_code", { length: 20 }).notNull(),
    country: varchar("country", { length: 100 }).notNull().default("USA"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Medication schema
export const medications = pgTable("medications", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    genericName: varchar("generic_name", { length: 255 }),
    description: text("description"),
    dosageForm: varchar("dosage_form", { length: 100 }),
    strength: varchar("strength", { length: 100 }),
    manufacturer: varchar("manufacturer", { length: 255 }),
    requiresPrescription: boolean("requires_prescription").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Inventory schema
export const inventory = pgTable("inventory", {
    id: uuid("id").primaryKey().defaultRandom(),
    pharmacyId: uuid("pharmacy_id").references(() => pharmacies.id).notNull(),
    medicationId: uuid("medication_id").references(() => medications.id).notNull(),
    quantity: integer("quantity").notNull().default(0),
    batchNumber: varchar("batch_number", { length: 100 }),
    expiryDate: date("expiry_date"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Adding doctors table for reference selection in prescriptions
export const doctors = pgTable("doctors", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    specialization: varchar("specialization", { length: 100 }),
    licenseNumber: varchar("license_number", { length: 100 }).notNull().unique(),
    contact: varchar("contact", { length: 100 }),
    email: varchar("email", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Prescription schema
export const prescriptions = pgTable("prescriptions", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").references(() => patients.id).notNull(),
    doctorId: uuid("doctor_id").references(() => doctors.id),
    doctorName: varchar("doctor_name", { length: 255 }).notNull(),
    doctorContact: varchar("doctor_contact", { length: 100 }),
    issueDate: date("issue_date").notNull(),
    expiryDate: date("expiry_date"),
    status: varchar("status", { length: 50 }).notNull().default("active"),
    notes: text("notes"),
    imageUrl: varchar("image_url", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Prescription Item schema
export const prescriptionItems = pgTable("prescription_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    prescriptionId: uuid("prescription_id").references(() => prescriptions.id).notNull(),
    medicationId: uuid("medication_id").references(() => medications.id).notNull(),
    dosage: varchar("dosage", { length: 100 }).notNull(),
    frequency: varchar("frequency", { length: 100 }).notNull(),
    duration: varchar("duration", { length: 100 }),
    quantity: integer("quantity").notNull(),
    instructions: text("instructions"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Order schema
export const orders = pgTable("orders", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").references(() => patients.id).notNull(),
    pharmacyId: uuid("pharmacy_id").references(() => pharmacies.id).notNull(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    prescriptionId: uuid("prescription_id").references(() => prescriptions.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Order Item schema
export const orderItems = pgTable("order_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id).notNull(),
    medicationId: uuid("medication_id").references(() => medications.id).notNull(),
    quantity: integer("quantity").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Payment schema
export const payments = pgTable("payments", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 100 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    transactionId: varchar("transaction_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Delivery Options schema
export const deliveryOptions = pgTable("delivery_options", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
    estimatedTimeHours: integer("estimated_time_hours"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// MedicationLog schema
export const medicationLogs = pgTable("medication_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").references(() => patients.id).notNull(),
    medicationId: uuid("medication_id").references(() => medications.id).notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Notification schema
export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Cart schema
export const carts = pgTable("carts", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active")
});

// Cart Item schema
export const cartItems = pgTable("cart_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id").references(() => carts.id).notNull(),
    medicationId: uuid("medication_id").references(() => medications.id).notNull(),
    quantity: integer("quantity").notNull().default(1),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Set up relations
export const usersRelations = relations(users, ({ many }) => ({
    patients: many(patients),
    pharmacies: many(pharmacies),
    addresses: many(addresses),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
    user: one(users, {
        fields: [patients.userId],
        references: [users.id],
    }),
    profile: many(patientProfiles),
    prescriptions: many(prescriptions),
    orders: many(orders),
}));

export const pharmaciesRelations = relations(pharmacies, ({ one, many }) => ({
    user: one(users, {
        fields: [pharmacies.userId],
        references: [users.id],
    }),
    profile: many(pharmacyProfiles),
    inventory: many(inventory),
    orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    patient: one(patients, {
        fields: [orders.patientId],
        references: [patients.id],
    }),
    pharmacy: one(pharmacies, {
        fields: [orders.pharmacyId],
        references: [pharmacies.id],
    }),
    prescription: one(prescriptions, {
        fields: [orders.prescriptionId],
        references: [prescriptions.id],
    }),
    orderItems: many(orderItems),
    payment: many(payments),
}));

export const doctorsRelations = relations(doctors, ({ many }) => ({
    prescriptions: many(prescriptions),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
    patient: one(patients, {
        fields: [prescriptions.patientId],
        references: [patients.id],
    }),
    doctor: one(doctors, {
        fields: [prescriptions.doctorId],
        references: [doctors.id],
    }),
    items: many(prescriptionItems),
}));

export const medicationsRelations = relations(medications, ({ many }) => ({
    inventories: many(inventory),
    prescriptionItems: many(prescriptionItems),
    orderItems: many(orderItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
    user: one(users, {
        fields: [carts.userId],
        references: [users.id]
    }),
    items: many(cartItems)
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    cart: one(carts, {
        fields: [cartItems.cartId],
        references: [carts.id]
    }),
    medication: one(medications, {
        fields: [cartItems.medicationId],
        references: [medications.id]
    })
}));
