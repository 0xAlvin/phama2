import { DeliveryOption } from "./DeliveryOptions";


export interface PharmacyProfile {
    id: string;
    pharmacyId: string;
    name: string;
    address: string;
    gpsCoordinates: { lat: number, long: number } | null;
    operatingHours: Record<string, string> | null;
    phoneNumbers: string[];
    email: string;
    website: string;
    superintendent: string;
    services: string[];
    deliveryOptions: DeliveryOption[];
    deliveryRadius: number | null;
    deliveryFee: number | null;
    minOrderForFreeDelivery: number | null;
    paymentMethods: string[];
    logo: string | null;
    photos: string[];
    createdAt: Date;
    updatedAt: Date;
}
