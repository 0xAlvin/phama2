export interface OrderType {
  id: string;
  patientName: string;
  pharmacyName: string;
  totalAmount: number;
  status: string;
  hasPrescription: boolean;
  createdAt: string;
  formattedDate?: string;
  isCompletable?: boolean;
  isCancelable?: boolean;
  isDeliverable?: boolean;
  patientId?: string;
}
