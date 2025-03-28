export const MedicationRegulatoryClass = {
    OTC: 'OTC',
    PHARMACY_ONLY: 'PHARMACY_ONLY',
    PRESCRIPTION_ONLY: 'PRESCRIPTION_ONLY',
    CONTROLLED: 'CONTROLLED'
} as const;

export const PregnancyCategory = {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    X: 'X'
} as const;

export type MedicationRegulatoryClassType = typeof MedicationRegulatoryClass[keyof typeof MedicationRegulatoryClass];
export type PregnancyCategoryType = typeof PregnancyCategory[keyof typeof PregnancyCategory];

export interface Medication {
    id: string;
    genericName: string;
    brandNames: string[];
    category: string | null;
    dosageForm: string;
    strength: string;
    manufacturer: string;
    regulatoryClass: MedicationRegulatoryClassType;
    requiresSpecialTracking: boolean;
    description: string | null;
    sideEffects: string[];
    contraindications: string[];
    storageInstructions: string | null;
    activeIngredients: string[];
    therapeuticCategory: string[];
    pregnancyCategory: PregnancyCategoryType;
    createdAt: Date;
    updatedAt: Date;
}
