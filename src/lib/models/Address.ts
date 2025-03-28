export const AddressType = {
    HOME: 'HOME',
    WORK: 'WORK',
    OTHER: 'OTHER',
    PHARMACY: 'PHARMACY'
} as const;

export type AddressType = typeof AddressType[keyof typeof AddressType];

export interface Address {
    id: string;
    userId: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    county: string;
    postalCode: string | null;
    landmark: string | null;
    gpsCoordinates: { lat: number, long: number } | null;
    addressType: AddressType;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
