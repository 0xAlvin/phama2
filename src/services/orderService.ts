import { db } from "@/lib/db";
import { orders, orderItems, payments, patients, pharmacies, prescriptions, medications, inventory } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { DrizzleError } from "drizzle-orm";
import { Session } from 'next-auth';

export interface CreateOrderData {
  patientId: string;
  pharmacyId: string;
  prescriptionId: string | null;
  items: {
    medicationId: string;
    quantity: number;
    price: number;
  }[];
  status?: "pending" | "processing" | "completed" | "cancelled";
}

export interface OrderWithItems {
  id: string;
  patientId: string;
  pharmacyId: string;
  prescriptionId: string | null;
  status: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    orderId: string;
    medicationId: string;
    medicationName?: string;
    quantity: number;
    price: number;
  }[];
  patient?: {
    id: string;
    // Additional patient fields if needed
  };
  pharmacy?: {
    id: string;
    name?: string;
    // Additional pharmacy fields if needed
  };
}

export class OrderServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderServiceError";
  }
}

export class OrderService {
  /**
   * Create a new order with order items
   */
  async createOrder(data: CreateOrderData): Promise<string> {
    try {
      // Ensure critical fields are provided
      if (!data.patientId) {
        throw new OrderServiceError("Patient ID is required");
      }
      
      if (!data.pharmacyId) {
        throw new OrderServiceError("Pharmacy ID is required");
      }
      
      if (!data.items || data.items.length === 0) {
        throw new OrderServiceError("Order must contain at least one item");
      }
      
      // Validate patient exists
      const patient = await db.query.patients.findFirst({
        where: eq(patients.id, data.patientId)
      });
      
      if (!patient) {
        throw new OrderServiceError("Patient not found");
      }
      
      // Validate pharmacy exists
      const pharmacy = await db.query.pharmacies.findFirst({
        where: eq(pharmacies.id, data.pharmacyId)
      });
      
      if (!pharmacy) {
        throw new OrderServiceError("Pharmacy not found");
      }
      
      // Validate items
      for (const item of data.items) {
        if (!item.medicationId) {
          throw new OrderServiceError("Medication ID is required for all order items");
        }
        
        if (!item.quantity || item.quantity <= 0) {
          throw new OrderServiceError("Valid quantity is required for all order items");
        }
        
        if (!item.price || item.price <= 0) {
          throw new OrderServiceError("Valid price is required for all order items");
        }
        
        // Check medication exists
        const medication = await db.query.medications.findFirst({
          where: eq(medications.id, item.medicationId)
        });
        
        if (!medication) {
          throw new OrderServiceError(`Medication with ID ${item.medicationId} not found`);
        }
        
        // Check inventory
        const inventoryItem = await db.query.inventory.findFirst({
          where: and(
            eq(inventory.pharmacyId, data.pharmacyId),
            eq(inventory.medicationId, item.medicationId)
          )
        });
        
        if (!inventoryItem || inventoryItem.quantity < item.quantity) {
          throw new OrderServiceError(`Not enough stock for medication ${medication.name}`);
        }
      }
      
      // Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      let orderId: string;
      
      await db.transaction(async (tx) => {
        // Insert order with explicit values for all required fields
        const result = await tx.insert(orders).values({
          patientId: data.patientId,
          pharmacyId: data.pharmacyId,
          prescriptionId: data.prescriptionId,
          status: data.status || "pending",
          totalAmount,
        }).returning({ id: orders.id });
        
        orderId = result[0].id;
        
        // Insert order items
        for (const item of data.items) {
          await tx.insert(orderItems).values({
            orderId: orderId,
            medicationId: item.medicationId,
            quantity: item.quantity,
            price: item.price,
          });
          
          // Update inventory
          await tx.update(inventory)
            .set({
              quantity: (old) => old.quantity - item.quantity,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(inventory.pharmacyId, data.pharmacyId),
                eq(inventory.medicationId, item.medicationId)
              )
            );
        }
      });
      
      return orderId;
    } catch (error) {
      if (error instanceof OrderServiceError) {
        throw error;
      }
      if (error instanceof DrizzleError) {
        throw new OrderServiceError(`Database error: ${error.message}`);
      }
      throw new OrderServiceError(`Failed to create order: ${(error as Error).message}`);
    }
  }

  /**
   * Get order by ID with items
   */
  async getOrderById(orderId: string): Promise<OrderWithItems | null> {
    try {
      // Validate orderId to prevent database errors
      if (!orderId || typeof orderId !== 'string' || orderId === 'undefined') {
        throw new OrderServiceError("Invalid order ID provided");
      }
      
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        return null;
      }

      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId),
      });

      // If we want to include medication names, we need to fetch them
      const medicationIds = items.map(item => item.medicationId);
      const medicationsData = await db.query.medications.findMany({
        where: inArray(medications.id, medicationIds),
      });

      // Create a lookup map for medications
      const medicationMap = new Map();
      medicationsData.forEach(med => {
        medicationMap.set(med.id, med);
      });

      // Enrich order items with medication names
      const enrichedItems = items.map(item => ({
        ...item,
        medicationName: medicationMap.get(item.medicationId)?.name
      }));

      return {
        ...order,
        totalAmount: this.ensureNumericAmount(order.totalAmount),
        items: enrichedItems
      };
    } catch (error) {
      if (error instanceof DrizzleError) {
        throw new OrderServiceError(`Database error: ${error.message}`);
      }
      throw new OrderServiceError(`Failed to get order: ${(error as Error).message}`);
    }
  }

  /**
   * Get orders for a patient
   */
  async getPatientOrders(patientId: string): Promise<OrderWithItems[]> {
    try {
      const patientOrders = await db.query.orders.findMany({
        where: eq(orders.patientId, patientId),
        orderBy: (orders, { desc }) => [desc(orders.createdAt)]
      });

      const result: OrderWithItems[] = [];

      for (const order of patientOrders) {
        const items = await db.query.orderItems.findMany({
          where: eq(orderItems.orderId, order.id),
        });

        result.push({
          ...order,
          totalAmount: this.ensureNumericAmount(order.totalAmount),
          items: items
        });
      }

      return result;
    } catch (error) {
      if (error instanceof DrizzleError) {
        throw new OrderServiceError(`Database error: ${error.message}`);
      }
      throw new OrderServiceError(`Failed to get patient orders: ${(error as Error).message}`);
    }
  }

  /**
   * Get orders for a pharmacy
   */
  async getPharmacyOrders(pharmacyId: string): Promise<OrderWithItems[]> {
    try {
      const pharmacyOrders = await db.query.orders.findMany({
        where: eq(orders.pharmacyId, pharmacyId),
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
        with: {
          items: {
            medication: true
          },
          pharmacy: true,
          prescription: true
        }
      });

      const result: OrderWithItems[] = [];

      for (const order of pharmacyOrders) {
        const items = await db.query.orderItems.findMany({
          where: eq(orderItems.orderId, order.id),
        });

        result.push({
          ...order,
          totalAmount: this.ensureNumericAmount(order.totalAmount),
          items: items
        });
      }

      console.log(`Found ${pharmacyOrders.length} pharmacy orders in database`);
      if (pharmacyOrders.length > 0) {
        console.log("First order details:", JSON.stringify({
          id: pharmacyOrders[0].id,
          status: pharmacyOrders[0].status,
          patientId: pharmacyOrders[0].patientId,
          itemCount: pharmacyOrders[0].items?.length || 0,
          hasPharmacy: !!pharmacyOrders[0].pharmacy
        }));
      }

      return result;
    } catch (error) {
      if (error instanceof DrizzleError) {
        throw new OrderServiceError(`Database error: ${error.message}`);
      }
      throw new OrderServiceError(`Failed to get pharmacy orders: ${(error as Error).message}`);
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        throw new OrderServiceError("Order not found");
      }

      await db.update(orders)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));
    } catch (error) {
      if (error instanceof OrderServiceError) {
        throw error;
      }
      if (error instanceof DrizzleError) {
        throw new OrderServiceError(`Database error: ${error.message}`);
      }
      throw new OrderServiceError(`Failed to update order status: ${(error as Error).message}`);
    }
  }

  /**
   * Record payment for an order
   */
  async recordPayment(orderId: string, amount: number, paymentMethod: string): Promise<string> {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        throw new OrderServiceError("Order not found");
      }

      // Check if payment amount matches order total - convert totalAmount to number first
      const numericTotalAmount = this.ensureNumericAmount(order.totalAmount);
      
      if (amount !== numericTotalAmount) {
        throw new OrderServiceError(`Payment amount (${amount}) does not match order total (${numericTotalAmount})`);
      }

      // Let Drizzle handle the UUID generation for payment ID
      const [payment] = await db.insert(payments).values({
        orderId,
        amount,
        paymentMethod,
        status: "completed",
      }).returning({ id: payments.id });

      // Update order status to completed if payment is successful
      await this.updateOrderStatus(orderId, "completed");

      return payment.id;
    } catch (error) {
      if (error instanceof OrderServiceError) {
        throw error;
      }
      if (error instanceof DrizzleError) {
        throw new OrderServiceError(`Database error: ${error.message}`);
      }
      throw new OrderServiceError(`Failed to record payment: ${(error as Error).message}`);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        throw new OrderServiceError("Order not found");
      }

      // Only pending and processing orders can be cancelled
      if (order.status !== "pending" && order.status !== "processing") {
        throw new OrderServiceError(`Cannot cancel order with status: ${order.status}`);
      }

      // Get order items to restore inventory
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId),
      });

      await db.transaction(async (tx) => {
        // Update order status
        await tx.update(orders)
          .set({ 
            status: "cancelled",
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderId));

        // Restore inventory for each item - fix inventory field name
        for (const item of items) {
          await tx.update(inventory)
            .set({
              quantity: (old) => old.quantity + item.quantity,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(inventory.pharmacyId, order.pharmacyId),
                eq(inventory.medicationId, item.medicationId)
              )
            );
        }
      });
    } catch (error) {
      if (error instanceof OrderServiceError) {
        throw error;
      }
      if (error instanceof DrizzleError) {
        throw new OrderServiceError(`Database error: ${error.message}`);
      }
      throw new OrderServiceError(`Failed to cancel order: ${(error as Error).message}`);
    }
  }

  /**
   * Ensures that a value is returned as a number
   * This is needed because Drizzle ORM might return decimal fields as strings
   */
  private ensureNumericAmount(amount: any): number {
    if (typeof amount === 'number') {
      return amount;
    }
    
    if (typeof amount === 'string') {
      return parseFloat(amount);
    }
    
    if (amount && typeof amount.toString === 'function') {
      return parseFloat(amount.toString());
    }
    
    return 0; // Default to zero if conversion isn't possible
  }
}

/**
 * Gets the patient ID associated with a user account
 */
async function getPatientIdFromUserId(userId: string, email?: string): Promise<string | null> {
  try {
    // Find patient record with this userId
    const patient = await db.query.patients.findFirst({
      where: eq(patients.userId, userId),
      columns: {
        id: true
      }
    });
    
    if (patient?.id) {
      return patient.id;
    }
    
    // If no patient record found and email is provided, try to create one
    if (!patient && email) {
      try {
        // Import here to avoid circular dependencies
        const { getOrCreatePatientProfile } = await import('@/lib/utils/userUtils');
        const newPatient = await getOrCreatePatientProfile(userId, email);
        return newPatient?.id || null;
      } catch (createError) {
        console.error('Failed to create patient profile:', createError);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting patient ID from user ID:', error);
    return null;
  }
}

/**
 * Gets the pharmacy ID associated with a user account
 */
async function getPharmacyIdFromUserId(userId: string): Promise<string | null> {
  try {
    console.log(`Looking up pharmacy ID for user ID: ${userId}`);
    // Find pharmacy record with this userId
    const pharmacy = await db.query.pharmacies.findFirst({
      where: eq(pharmacies.userId, userId),
      columns: {
        id: true
      }
    });
    
    if (pharmacy?.id) {
      console.log(`Found pharmacy ID ${pharmacy.id} for user ID ${userId}`);
      return pharmacy.id;
    }
    
    console.log(`No pharmacy record found for user ID: ${userId}`);
    return null;
  } catch (error) {
    console.error('Error getting pharmacy ID from user ID:', error);
    return null;
  }
}

/**
 * Gets all orders for a specific patient
 */
async function getPatientOrders(patientId: string): Promise<OrderWithItems[]> {
  console.log("getPatientOrders called with patientId:", patientId);
  try {
    // Verify patientId is valid
    if (!patientId || typeof patientId !== 'string') {
      console.error('Invalid patientId provided:', patientId);
      return [];
    }

    // Create an instance of OrderService to use its method
    const orderService = new OrderService();
    const patientOrders = await orderService.getPatientOrders(patientId);
    
    // Ensure each order has totalAmount as a number
    const processedOrders = patientOrders.map(order => ({
      ...order,
      totalAmount: ensureNumericAmount(order.totalAmount)
    }));

    console.log(`Found ${processedOrders.length} orders for patient ${patientId}`);
    if (processedOrders.length > 0) {
      console.log("First order details:", JSON.stringify({
        id: processedOrders[0].id,
        status: processedOrders[0].status,
        totalAmount: processedOrders[0].totalAmount,
        itemCount: processedOrders[0].items?.length || 0
      }));
    }

    return processedOrders;
  } catch (error) {
    console.error('Error fetching patient orders:', error);
    // Return empty array instead of throwing an error to prevent API failures
    return [];
  }
}

/**
 * Create a new order for a patient
 */
async function createPatientOrder(
  patientId: string,
  pharmacyId: string,
  items: Array<{medicationId: string, quantity: number, price: number}>
): Promise<{success: boolean, orderId?: string, error?: string}> {
  try {
    // Validate parameters
    if (!patientId) throw new Error("Patient ID is required");
    if (!pharmacyId) throw new Error("Pharmacy ID is required");
    if (!items || items.length === 0) throw new Error("Order items are required");
    
    // Validate each medication ID exists in the medications table
    for (const item of items) {
      const medication = await db.query.medications.findFirst({
        where: eq(medications.id, item.medicationId)
      });
      
      if (!medication) {
        throw new Error(`Medication with ID ${item.medicationId} not found`);
      }
    }
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create the order
    const orderResult = await db.insert(orders).values({
      patientId: patientId,
      pharmacyId: pharmacyId,
      totalAmount: totalAmount,
      status: 'pending'
    }).returning();
    
    const order = orderResult[0];
    
    // Insert order items with correct parameter mapping
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        medicationId: item.medicationId,
        quantity: item.quantity,
        price: item.price
      });
    }
    
    return {success: true, orderId: order.id};
  } catch (error) {
    console.error("Error creating patient order:", error);
    return {
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gets an order by its ID
 */
async function getOrderById(id: string, session: any) {
  try {
    // Validate ID to prevent database errors
    if (!id || typeof id !== 'string' || id === 'undefined') {
      throw new Error("Invalid order ID provided");
    }

    // Create an instance of the OrderService to use its getOrderById method
    const orderService = new OrderService();
    const order = await orderService.getOrderById(id);

    if (!order) {
      return null;
    }

    // Check if the user has permission to view this order
    const userId = session.user?.id;

    if (!userId) {
      throw new Error('User ID not found in session');
    }

    // Get patient info
    const patient = await db.query.patients.findFirst({
      where: eq(patients.userId, userId)
    });

    // Allow access if user is the patient who placed the order
    const isPatientOrder = patient?.id === order.patientId;
    
    // Check if the user is a pharmacy staff member with access to this order
    let isPharmacyOrder = false;
    
    // First check if this is the user's pharmacy
    const pharmacy = await db.query.pharmacies.findFirst({
      where: eq(pharmacies.userId, userId),
      columns: {
        id: true
      }
    });
    
    if (pharmacy?.id === order.pharmacyId) {
      isPharmacyOrder = true;
    }
    
    // If not a direct pharmacy owner, check if user is staff at this pharmacy
    if (!isPharmacyOrder && session.user.role === 'PHARMACY_STAFF') {
      const pharmacyStaff = await db.query.pharmacyStaff.findFirst({
        where: and(
          eq(pharmacyStaff.userId, userId),
          eq(pharmacyStaff.pharmacyId, order.pharmacyId),
          eq(pharmacyStaff.isActive, true)
        ),
        columns: {
          id: true
        }
      });
      
      isPharmacyOrder = !!pharmacyStaff;
    }
    
    // Also allow admin users to access all orders
    if (session.user.role === 'ADMIN') {
      isPharmacyOrder = true;
    }

    if (!isPatientOrder && !isPharmacyOrder) {
      console.log(`Access denied: User ${userId} with role ${session.user.role} attempted to access order ${id}`);
      console.log(`Patient check: ${isPatientOrder}, Pharmacy check: ${isPharmacyOrder}`);
      throw new Error('You do not have permission to access this order');
    }

    // Ensure totalAmount is a number before returning
    return {
      ...order,
      totalAmount: ensureNumericAmount(order.totalAmount)
    };
  } catch (error) {
    console.error('Error getting order by ID:', error);
    throw new Error(error instanceof OrderServiceError ? error.message : 'Failed to retrieve order details');
  }
}

/**
 * Helper function for global use to ensure amount is always a number
 */
function ensureNumericAmount(amount: any): number {
  if (typeof amount === 'number') {
    return amount;
  }
  
  if (typeof amount === 'string') {
    return parseFloat(amount);
  }
  
  if (amount && typeof amount.toString === 'function') {
    return parseFloat(amount.toString());
  }
  
  return 0; // Default to zero if conversion isn't possible
}

// Export the functions (including the new utility function)
export {
  createPatientOrder,
  getPatientOrders,
  getPharmacyIdFromUserId,
  getPatientIdFromUserId,
  getOrderById,
  ensureNumericAmount  // Export the helper function for use elsewhere
}
