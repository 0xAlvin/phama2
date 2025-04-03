/**
 * Prescription status utilities to ensure consistency across the application
 */

export const PrescriptionStatus = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  FILLED: 'FILLED',
  EXPIRED: 'EXPIRED',
  REJECTED: 'REJECTED'
} as const;

export type PrescriptionStatusType = typeof PrescriptionStatus[keyof typeof PrescriptionStatus];

/**
 * Normalizes a prescription status string to one of the standard status values
 */
export const normalizeStatus = (status: string): PrescriptionStatusType => {
  // Convert to uppercase for comparison
  const uppercaseStatus = status.toUpperCase();
  
  // Map to standardized values
  if (uppercaseStatus === 'ACTIVE') return PrescriptionStatus.ACTIVE;
  if (uppercaseStatus === 'PENDING') return PrescriptionStatus.PENDING;
  if (uppercaseStatus === 'FILLED' || uppercaseStatus === 'COMPLETED') return PrescriptionStatus.FILLED;
  if (uppercaseStatus === 'EXPIRED') return PrescriptionStatus.EXPIRED;
  if (uppercaseStatus === 'REJECTED') return PrescriptionStatus.REJECTED;
  
  // Default to ACTIVE if not matched
  return PrescriptionStatus.ACTIVE;
};

/**
 * Gets the appropriate CSS class for a prescription status
 */
export const getStatusClass = (status: string): string => {
  const normalizedStatus = normalizeStatus(status).toLowerCase();
  return `status-${normalizedStatus}`;
};

/**
 * Gets a user-friendly display text for a prescription status
 */
export const getStatusDisplayText = (status: string): string => {
  const normalizedStatus = normalizeStatus(status);
  
  switch (normalizedStatus) {
    case PrescriptionStatus.ACTIVE:
      return 'Active';
    case PrescriptionStatus.PENDING:
      return 'Pending';
    case PrescriptionStatus.FILLED:
      return 'Filled';
    case PrescriptionStatus.EXPIRED:
      return 'Expired';
    case PrescriptionStatus.REJECTED:
      return 'Rejected';
    default:
      return 'Unknown';
  }
};
