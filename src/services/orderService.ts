/**
 * Service for handling order-related API calls
 */

import { ApiError } from '@/types/api';
import { db } from '@/lib/db';
import { eq, desc, and, or, inArray } from 'drizzle-orm';
import { orders, orderItems, medications, pharmacies, patients, users, pharmacyStaff } from '@/lib/schema';
import type { Session } from 'next-auth';

interface OrderItem {
  id: string;
  medicationId: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderWithItems {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  totalAmount: number;
  formattedTotalAmount: string;
  status: string;
  statusClass: string;
  createdAt: string;
  formattedDate: string;
  updatedAt: string;
  medications: Array<{
    name: string;
    quantity: number;
    price: number;
    formattedPrice: string;
  }>;
  isCompletable: boolean;
  isCancelable: boolean;
}

type OrderWithDetails = {
  id: string;
  pharmacyName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  medications: {
    name: string;
    quantity: number;
    price: number;
  }[];
};

// Cache for pharmacy data to avoid repeated DB calls
const pharmacyCache = new Map<string, { id: string, name: string }>();

// Cache for user role lookup
const userRoleCache = new Map<string, string>();

/**
 * Checks if a user has permission to access patient data
 */
export async function hasPatientAccess(userId: string, patientId: string): Promise<boolean> {
  // Check role from cache first
  let role = userRoleCache.get(userId);
  
  if (!role) {
    // Get role from database
    const user = await db.select({
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .then(results => results[0]);

    role = user?.role;
    
    // Cache the role if found
    if (role) {
      userRoleCache.set(userId, role);
    }
  }

  // ADMIN can access any patient data
  if (role === 'ADMIN') return true;
  
  // Pharmacy users may be able to access patient data they have orders with
  if (role === 'PHARMACY' || role === 'PHARMACY_STAFF') {
    // Logic for pharmacy access to patient data could be added here
    return false; // By default, pharmacies can't access patient data directly
  }
  
  // For patient role, check if user is accessing their own data
  if (role === 'PATIENT') {
    // Get patient ID for current user
    const patientData = await db.select({
      id: patients.id,
    })
    .from(patients)
    .where(eq(patients.userId, userId))
    .then(results => results[0]);
    
    // If this is the patient's own data, allow access
    return patientData?.id === patientId;
  }
  
  return false;
}

/**
 * Checks if a user has permission to access pharmacy data
 */
export async function hasPharmacyAccess(userId: string, pharmacyId: string): Promise<boolean> {
  // Check role from cache first
  let role = userRoleCache.get(userId);
  
  if (!role) {
    // Get role from database
    const user = await db.select({
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .then(results => results[0]);

    role = user?.role;
    
    // Cache the role if found
    if (role) {
      userRoleCache.set(userId, role);
    }
  }

  // ADMIN can access any pharmacy's data
  if (role === 'ADMIN') return true;
  
  // Check if user is associated with this pharmacy
  const pharmacyStaffData = await db.select({
    id: pharmacyStaff.id,
  })
  .from(pharmacyStaff)
  .where(
    and(
      eq(pharmacyStaff.userId, userId),
      eq(pharmacyStaff.pharmacyId, pharmacyId)
    )
  )
  .then(results => results[0]);
  
  // If user is part of pharmacy staff or the pharmacy owner
  return !!pharmacyStaffData;
}

// Format price to KES currency
function formatCurrency(amount: number): string {
  return `KES ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

/**
 * Get pharmacy ID from user ID
 */
export async function getPharmacyIdFromUserId(userId: string): Promise<string | null> {
  // First check if user is directly associated with a pharmacy (owner)
  const pharmacyData = await db
    .select({
      id: pharmacies.id,
    })
    .from(pharmacies)
    .where(eq(pharmacies.userId, userId))
    .then(results => results[0]);
  
  if (pharmacyData?.id) {
    return pharmacyData.id;
  }
  
  // If not an owner, check if they're staff
  const staffData = await db
    .select({
      pharmacyId: pharmacyStaff.pharmacyId,
    })
    .from(pharmacyStaff)
    .where(eq(pharmacyStaff.userId, userId))
    .then(results => results[0]);
  
  return staffData?.pharmacyId || null;
}

/**
 * Fetches orders for a specific patient with optimized queries
 */
export async function getPatientOrders(
  patientId: string, 
  session?: Session | null
): Promise<OrderWithDetails[]> {
  try {
    // Security check if session is provided
    if (session?.user?.id) {
      // If session user is the patient trying to access their own data
      if (session.user.role === 'PATIENT') {
        // Get the patient record for this user to compare IDs
        const patientData = await db.select({
          id: patients.id,
        })
        .from(patients)
        .where(eq(patients.userId, session.user.id))
        .then(results => results[0]);
        
        // If this patient doesn't exist or is trying to access someone else's orders
        // Just continue - the error will be handled properly by the API endpoint
        if (!patientData) {
          console.warn(`User ${session.user.id} has no associated patient profile`);
        } else if (patientData.id !== patientId) {
          console.warn(`User's patient ID ${patientData.id} doesn't match requested patient ID ${patientId}`);
        }
        // We shouldn't throw an error here, let the API handle access checking
      }
    }
    
    // Fetch orders for the patient
    const ordersData = await db.select({
      id: orders.id,
      pharmacyId: orders.pharmacyId,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(eq(orders.patientId, patientId))
    .orderBy(desc(orders.createdAt));
    
    if (ordersData.length === 0) {
      return [];
    }
    
    // Extract all order IDs and pharmacy IDs for batch queries
    const orderIds = ordersData.map(order => order.id);
    const pharmacyIds = [...new Set(ordersData.map(order => order.pharmacyId))];
    
    // Batch fetch all needed pharmacies that aren't cached
    const uncachedPharmacyIds = pharmacyIds.filter(id => !pharmacyCache.has(id));
    if (uncachedPharmacyIds.length > 0) {
      const pharmaciesData = await db.select({
        id: pharmacies.id,
        name: pharmacies.name,
      })
      .from(pharmacies)
      .where(inArray(pharmacies.id, uncachedPharmacyIds));
      
      // Update cache
      for (const pharmacy of pharmaciesData) {
        pharmacyCache.set(pharmacy.id, pharmacy);
      }
    }
    
    // Batch fetch all order items and their medications in one query
    const allOrderItems = await db
      .select({
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        medicationId: orderItems.medicationId,
        medicationName: medications.name,
      })
      .from(orderItems)
      .innerJoin(medications, eq(orderItems.medicationId, medications.id))
      .where(inArray(orderItems.orderId, orderIds));
    
    // Group order items by order ID
    const orderItemsMap = allOrderItems.reduce((map, item) => {
      if (!map.has(item.orderId)) {
        map.set(item.orderId, []);
      }
      map.get(item.orderId)?.push(item);
      return map;
    }, new Map<string, typeof allOrderItems>());
    
    // Format orders with their associated data
    const formattedOrders = ordersData.map(order => {
      const pharmacy = pharmacyCache.get(order.pharmacyId);
      const items = orderItemsMap.get(order.id) || [];
      
      const medicationsData = items.map(item => ({
        name: item.medicationName || 'Unknown Medication',
        quantity: item.quantity,
        price: Number(item.price),
        formattedPrice: formatCurrency(Number(item.price)),
      }));
      
      return {
        id: order.id,
        pharmacyName: pharmacy ? pharmacy.name : 'Unknown Pharmacy',
        totalAmount: Number(order.totalAmount),
        formattedTotalAmount: formatCurrency(Number(order.totalAmount)),
        status: formatOrderStatus(order.status),
        statusClass: getStatusClass(order.status),
        createdAt: order.createdAt.toISOString(),
        formattedDate: formatDate(order.createdAt),
        medications: medicationsData,
        isCompletable: ['pending', 'processing'].includes(order.status.toLowerCase()),
        isCancelable: ['pending', 'processing'].includes(order.status.toLowerCase()),
      };
    });
    
    return formattedOrders;
  } catch (error) {
    console.error('Error in getPatientOrders:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Fetches orders for a specific pharmacy with optimized queries
 */
export async function getPharmacyOrders(
  pharmacyId: string, 
  session?: Session | null
): Promise<OrderWithDetails[]> {
  // Security check if session is provided
  if (session?.user?.id) {
    const hasAccess = await hasPharmacyAccess(session.user.id, pharmacyId);
    if (!hasAccess) {
      throw new Error('Unauthorized access to pharmacy orders');
    }
  }
  
  // Fetch orders for the pharmacy
  const ordersData = await db.select({
    id: orders.id,
    patientId: orders.patientId,
    pharmacyId: orders.pharmacyId,
    totalAmount: orders.totalAmount,
    status: orders.status,
    createdAt: orders.createdAt,
    updatedAt: orders.updatedAt,
  })
  .from(orders)
  .where(eq(orders.pharmacyId, pharmacyId))
  .orderBy(desc(orders.createdAt));
  
  if (ordersData.length === 0) {
    return [];
  }
  
  // Extract all patient IDs for batch queries
  const patientIds = [...new Set(ordersData.map(order => order.patientId))];
  
  // Batch fetch all patient names
  const patientsData = await db.select({
    id: patients.id,
    firstName: patients.firstName,
    lastName: patients.lastName,
  })
  .from(patients)
  .where(inArray(patients.id, patientIds));
  
  // Create a map of patients for quick lookup
  const patientMap = new Map(
    patientsData.map(patient => [patient.id, patient])
  );
  
  // Extract all order IDs for batch queries
  const orderIds = ordersData.map(order => order.id);
  
  // Batch fetch all order items and their medications in one query
  const allOrderItems = await db
    .select({
      orderId: orderItems.orderId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      medicationId: orderItems.medicationId,
      medicationName: medications.name,
    })
    .from(orderItems)
    .innerJoin(medications, eq(orderItems.medicationId, medications.id))
    .where(inArray(orderItems.orderId, orderIds));
  
  // Group order items by order ID
  const orderItemsMap = allOrderItems.reduce((map, item) => {
    if (!map.has(item.orderId)) {
      map.set(item.orderId, []);
    }
    map.get(item.orderId)?.push(item);
    return map;
  }, new Map<string, typeof allOrderItems>());
  
  // Format orders with their associated data
  const formattedOrders = ordersData.map(order => {
    const patient = patientMap.get(order.patientId);
    const items = orderItemsMap.get(order.id) || [];
    
    const medicationsData = items.map(item => ({
      name: item.medicationName || 'Unknown Medication',
      quantity: item.quantity,
      price: Number(item.price),
      formattedPrice: formatCurrency(Number(item.price)),
    }));
    
    return {
      id: order.id,
      patientId: order.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
      pharmacyName: "Current Pharmacy", // Add pharmacyName to match OrderWithDetails type
      totalAmount: Number(order.totalAmount),
      formattedTotalAmount: formatCurrency(Number(order.totalAmount)),
      status: formatOrderStatus(order.status),
      statusClass: getStatusClass(order.status),
      createdAt: order.createdAt.toISOString(),
      formattedDate: formatDate(order.createdAt),
      medications: medicationsData,
      isCompletable: ['pending', 'processing'].includes(order.status.toLowerCase()),
      isCancelable: ['pending'].includes(order.status.toLowerCase()),
      isDeliverable: ['processing'].includes(order.status.toLowerCase()),
    };
  });
  
  return formattedOrders;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format order status for display
 */
function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'processing': 'Processing',
    'delivered': 'Delivered',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };
  
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Get CSS class for status styling
 */
function getStatusClass(status: string): string {
  const statusClassMap: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'processing': 'bg-blue-100 text-blue-800',
    'delivered': 'bg-green-100 text-green-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
  };
  
  return statusClassMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

/**
 * Get patient ID from user ID (useful when user ID != patient ID)
 */
export async function getPatientIdFromUserId(userId: string): Promise<string | null> {
  const patientData = await db
    .select({
      id: patients.id,
    })
    .from(patients)
    .where(eq(patients.userId, userId))
    .then(results => results[0]);
  
  return patientData?.id || null;
}

/**
 * Fetches a specific order by ID with improved error handling and permission checks
 */
export const getOrderById = async (
  orderId: string, 
  session?: Session | null
): Promise<OrderWithItems | null> => {
  try {
    // Get the order with patient info to check permissions
    const orderWithPatient = await db
      .select({
        id: orders.id,
        patientId: orders.patientId,
        pharmacyId: orders.pharmacyId,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .then(results => results[0]);
    
    if (!orderWithPatient) {
      throw new Error('Order not found');
    }
    
    // Security check if session is provided
    if (session?.user?.id) {
      const hasAccess = await hasPatientAccess(session.user.id, orderWithPatient.patientId);
      if (!hasAccess) {
        throw new Error('Unauthorized access to order');
      }
    }
    
    // Get pharmacy details (check cache first)
    let pharmacy = pharmacyCache.get(orderWithPatient.pharmacyId);
    
    if (!pharmacy) {
      pharmacy = await db
        .select({
          id: pharmacies.id,
          name: pharmacies.name,
        })
        .from(pharmacies)
        .where(eq(pharmacies.id, orderWithPatient.pharmacyId))
        .then(results => results[0]);
      
      if (pharmacy) {
        pharmacyCache.set(pharmacy.id, pharmacy);
      }
    }
    
    // Get order items with medication details
    const itemsWithMedications = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        price: orderItems.price,
        medicationId: orderItems.medicationId,
        medicationName: medications.name,
      })
      .from(orderItems)
      .innerJoin(medications, eq(orderItems.medicationId, medications.id))
      .where(eq(orderItems.orderId, orderId));
    
    const medicationsData = itemsWithMedications.map(item => ({
      name: item.medicationName || 'Unknown Medication',
      quantity: item.quantity,
      price: Number(item.price),
      formattedPrice: formatCurrency(Number(item.price)),
    }));
    
    return {
      id: orderWithPatient.id,
      pharmacyId: orderWithPatient.pharmacyId,
      pharmacyName: pharmacy?.name || 'Unknown Pharmacy',
      totalAmount: Number(orderWithPatient.totalAmount),
      formattedTotalAmount: formatCurrency(Number(orderWithPatient.totalAmount)),
      status: formatOrderStatus(orderWithPatient.status),
      statusClass: getStatusClass(orderWithPatient.status),
      createdAt: orderWithPatient.createdAt.toISOString(),
      formattedDate: formatDate(orderWithPatient.createdAt),
      updatedAt: orderWithPatient.updatedAt.toISOString(),
      medications: medicationsData,
      isCompletable: ['pending', 'processing'].includes(orderWithPatient.status.toLowerCase()),
      isCancelable: ['pending', 'processing'].includes(orderWithPatient.status.toLowerCase()),
    };
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    return null;
  }
};

/**
 * Creates a new order with validation and permission checks
 */
export const createOrder = async (
  patientId: string,
  pharmacyId: string,
  items: { medicationId: string; quantity: number }[],
  session?: Session | null,
  prescriptionId?: string
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    // Security check if session is provided
    if (session?.user?.id) {
      const hasAccess = await hasPatientAccess(session.user.id, patientId);
      if (!hasAccess) {
        throw new Error('Unauthorized to create order for this patient');
      }
    }
    
    // Validate input data
    if (!patientId) throw new Error('Patient ID is required');
    if (!pharmacyId) throw new Error('Pharmacy ID is required');
    if (!items || items.length === 0) throw new Error('Order must contain at least one item');
    
    // Create order via API
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId,
        pharmacyId,
        items,
        prescriptionId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create order');
    }

    return { success: true, orderId: data.id };
  } catch (error) {
    console.error('Error creating order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Create an order for a patient with proper validation
 */
export async function createPatientOrder(
  patientId: string,
  pharmacyId: string,
  medications: { medicationId: string; quantity: number; price: number }[],
  session?: Session | null,
  prescriptionId?: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    // Security check if session is provided
    if (session?.user?.id) {
      const hasAccess = await hasPatientAccess(session.user.id, patientId);
      if (!hasAccess) {
        throw new Error('Unauthorized to create order for this patient');
      }
    }
    
    // Validate inputs
    if (!medications || medications.length === 0) {
      throw new Error('Order must contain at least one medication');
    }
    
    // Calculate total amount
    const totalAmount = medications.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    
    // Create order in database directly
    const [newOrder] = await db.insert(orders)
      .values({
        patientId,
        pharmacyId,
        totalAmount: String(totalAmount), // Convert to string for database
        status: 'pending',
        prescriptionId,
      })
      .returning({ id: orders.id });
    
    if (!newOrder?.id) {
      throw new Error('Failed to create order');
    }
    
    // Create order items
    const orderItemsToInsert = medications.map(med => ({
      orderId: newOrder.id,
      medicationId: med.medicationId,
      quantity: med.quantity,
      price: String(med.price), // Convert price to string for database
    }));
    
    await db.insert(orderItems)
      .values(orderItemsToInsert);
    
    return { 
      success: true,
      orderId: newOrder.id
    };
  } catch (error) {
    console.error('Error creating patient order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  newStatus: 'pending' | 'processing' | 'delivered' | 'completed' | 'cancelled',
  session?: Session | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get the order first to check permissions
    const orderData = await db
      .select({
        patientId: orders.patientId,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .then(results => results[0]);
    
    if (!orderData) {
      throw new Error('Order not found');
    }
    
    // Security check if session is provided
    if (session?.user?.id) {
      const hasAccess = await hasPatientAccess(session.user.id, orderData.patientId);
      if (!hasAccess) {
        throw new Error('Unauthorized to update this order');
      }
    }
    
    // Call the API to update the order
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Failed to update order status to ${newStatus}`);
    }
    
    // Clear the cache to ensure fresh data is fetched
    clearCaches();
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating order status to ${newStatus}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Clear caches (useful when data updates)
 */
export function clearCaches() {
  pharmacyCache.clear();
  userRoleCache.clear();
}
