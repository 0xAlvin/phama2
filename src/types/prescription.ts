export interface Prescription {
  id: string;
  dateIssued: string;
  medication: string;
  doctor: string;
  status: 'Pending' | 'Filled' | 'Expired';
  imageUrl: string;
  pharmacy: string;
  instructions: string;
}
