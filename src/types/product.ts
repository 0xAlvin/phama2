export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  dosage: string;
  inventory: number;
  imageUrl?: string;
  prescription: boolean;
  pharmacy: Pharmacy;
  category: string;
}
