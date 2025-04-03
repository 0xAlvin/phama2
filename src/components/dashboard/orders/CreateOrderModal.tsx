import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/stores/useCartStore';
import styles from '@/styles/dashboard/orders/createOrderModal.module.css';
import { Dialog } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
// Import our custom CSS for the select component
import '@/styles/components/custom-select.css';
import { unstable_cache } from 'next/cache';

interface CreateOrderModalProps {
    onClose: () => void;
    onOrderCreated: () => void;
}

// Match schema types
interface Pharmacy {
    id: string;
    name: string;
}

// Match schema fields from medications and inventory tables
interface Medication {
    id: string;
    name: string;
    description?: string;
    dosageForm?: string;
    strength?: string;
    price: number;
    requiresPrescription: boolean;
    quantity: number;
    available: boolean;
    uniqueKey?: string;
    inventoryId?: string;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ onClose, onOrderCreated }) => {
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
    const [medications, setMedications] = useState<Medication[]>([]);
    const [selectedMedications, setSelectedMedications] = useState<Medication[]>([]);
    const [isLoadingPharmacies, setIsLoadingPharmacies] = useState<boolean>(true);
    const [isLoadingMedications, setIsLoadingMedications] = useState<boolean>(false);
    const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
    
    
    // Fetch available pharmacies on load
    useEffect(() => {
        const fetchPharmacies = async () => {
            try {
                const response = await fetch('/api/pharmacies');
                if (!response.ok) {
                    throw new Error('Failed to fetch pharmacies');
                }
                
                const data = await response.json();
                console.log('Fetched pharmacies:', data);
                setPharmacies(data);
            } catch (error) {
                console.error('Error fetching pharmacies:', error);
                toast({
                    title: "Error",
                    description: "Failed to load pharmacies. Please try again.",
                    variant: "destructive"
                });
            } finally {
                setIsLoadingPharmacies(false);
            }
        };
        
        fetchPharmacies();
    }, []);
    
    // Fetch medications when pharmacy is selected
    useEffect(() => {
        if (!selectedPharmacy) return;
        
        const fetchMedications = async () => {
            setIsLoadingMedications(true);
            try {
                const response = await fetch(`/api/pharmacy/${selectedPharmacy}/inventory`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch medications');
                }
                
                const data = await response.json();
                if (data.success && Array.isArray(data.data)) {
                    // Ensure each medication has a unique key by combining medicationId and inventory id
                    const uniqueMedications = data.data.map((med: Medication) => ({
                        ...med,
                        // Create a unique key for React rendering
                        uniqueKey: `${med.id}-${med.inventoryId || Math.random().toString(36).substring(7)}`
                    }));
                    setMedications(uniqueMedications);
                } else {
                    setMedications([]);
                }
            } catch (error) {
                console.error('Error fetching medications:', error);
                toast({
                    title: "Error",
                    description: "Failed to load medications from this pharmacy.",
                    variant: "destructive"
                });
                setMedications([]);
            } finally {
                setIsLoadingMedications(false);
            }
        };
        
        fetchMedications();
    }, [selectedPharmacy]);
    
    const handleAddMedication = (medication: Medication) => {
        setSelectedMedications(prev => [...prev, medication]);
    };
    
    const handleRemoveMedication = (medicationId: string) => {
        setSelectedMedications(prev => prev.filter(med => med.id !== medicationId));
    };
    
    const handleCreateOrder = async () => {
        if (!selectedPharmacy || selectedMedications.length === 0) {
            toast({
                title: "Error",
                description: "Please select a pharmacy and at least one medication.",
                variant: "destructive"
            });
            return;
        }
        
        setIsCreatingOrder(true);
        
        try {
            // Ensure proper medication data structure with correct IDs
            const medications = selectedMedications.map(med => ({
                medicationId: med.id, // This must be a valid UUID from the medications table
                quantity: 1, // Set to 1 or use a quantity selector
                price: med.price
            }));

            const response = await fetch('/api/patient/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pharmacyId: selectedPharmacy,
                    medications: medications
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Handle different error cases
                if (response.status === 404) {
                    toast({
                        title: "Account Setup Required",
                        description: "Your patient profile is not complete. Please complete your profile setup.",
                        variant: "destructive"
                    });
                    
                    // Optionally redirect to profile completion page
                    // router.push('/dashboard/profile/complete');
                    return;
                }
                
                const errorMsg = data.error || `Failed to create order (${response.status})`;
                console.error(`API Error: ${errorMsg}`);
                throw new Error(errorMsg);
            }
            
            toast({
                title: "Success",
                description: "Order created successfully!",
                variant: "default"
            });
            
            onOrderCreated();
        } catch (error) {
            console.error('Error creating order:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create order. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsCreatingOrder(false);
        }
    };
    
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                        <h2>Create New Order</h2>
                        <button className={styles.closeButton} onClick={onClose}>×</button>
                    </div>
                    
                    <div className={styles.modalBody}>
                        <div className={styles.formGroup}>
                            <label>Select Pharmacy</label>
                            {isLoadingPharmacies ? (
                                <div className={styles.loading}>
                                    <Loader2 className={styles.spinner} />
                                    <span>Loading pharmacies...</span>
                                </div>
                            ) : (
                                <select
                                    className={styles.selectDropdown}
                                    value={selectedPharmacy}
                                    onChange={(e) => setSelectedPharmacy(e.target.value)}
                                >
                                    <option value="">Select a pharmacy</option>
                                    {pharmacies.map(pharmacy => (
                                        <option key={pharmacy.id} value={pharmacy.id}>
                                            {pharmacy.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        
                        {selectedPharmacy && (
                            <div className={styles.formGroup}>
                                <label>Available Medications</label>
                                {isLoadingMedications ? (
                                    <div className={styles.loading}>
                                        <Loader2 className={styles.spinner} />
                                        <span>Loading medications...</span>
                                    </div>
                                ) : (
                                    <div className={styles.medicationsList}>
                                        {medications.length === 0 ? (
                                            <p>No medications available from this pharmacy.</p>
                                        ) : (
                                            medications.map(medication => (
                                                <div key={medication.uniqueKey} className={styles.medicationItem}>
                                                    <div className={styles.medicationInfo}>
                                                        <h4>{medication.name}</h4>
                                                        <p>KES {medication.price.toFixed(2)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddMedication(medication)}
                                                        disabled={selectedMedications.some(med => med.id === medication.id)}
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {selectedMedications.length > 0 && (
                            <div className={styles.formGroup}>
                                <label>Selected Medications</label>
                                <div className={styles.selectedMedicationsList}>
                                    {selectedMedications.map(medication => (
                                        <div key={medication.id} className={styles.selectedMedicationItem}>
                                            <div className={styles.medicationInfo}>
                                                <h4>{medication.name}</h4>
                                                <p>KES {medication.price.toFixed(2)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMedication(medication.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    
                                    <div className={styles.totalPrice}>
                                        <strong>Total:</strong> KES {selectedMedications
                                            .reduce((sum, med) => sum + med.price, 0)
                                            .toFixed(2)
                                        }
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className={styles.modalFooter}>
                        <button 
                            className={`${styles.button} ${styles.cancelButton}`}
                            onClick={onClose}
                            disabled={isCreatingOrder}
                        >
                            Cancel
                        </button>
                        <button 
                            className={`${styles.button} ${styles.submitButton}`}
                            onClick={handleCreateOrder}
                            disabled={selectedMedications.length === 0 || isCreatingOrder}
                        >
                            {isCreatingOrder ? (
                                <>
                                    <Loader2 className={styles.spinner} />
                                    Creating Order...
                                </>
                            ) : (
                                "Create Order"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default CreateOrderModal;
