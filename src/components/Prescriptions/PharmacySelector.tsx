'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, MapPin, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';


interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance?: string;
  hours?: string;
  phone?: string;
}

interface PharmacySelectorProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export default function PharmacySelector({ value, onChange }: PharmacySelectorProps) {
  const [open, setOpen] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch pharmacies from API based on user location
    const mockPharmacies: Pharmacy[] = [
      {
        id: '1',
        name: 'Downtown Pharmacy',
        address: '123 Main St, Cityville',
        distance: '0.8 miles',
        hours: '8:00 AM - 9:00 PM',
        phone: '(555) 123-4567'
      },
      {
        id: '2',
        name: 'Metro Drugs',
        address: '456 Oak Ave, Townsville',
        distance: '1.2 miles',
        hours: '24 hours',
        phone: '(555) 987-6543'
      },
      {
        id: '3',
        name: 'Community Care Pharmacy',
        address: '789 Elm Blvd, Villageton',
        distance: '2.5 miles',
        hours: '9:00 AM - 7:00 PM',
        phone: '(555) 456-7890'
      },
      {
        id: '4',
        name: 'Health Plus Pharmacy',
        address: '101 Pine Rd, Hamletville',
        distance: '3.7 miles',
        hours: '8:00 AM - 10:00 PM',
        phone: '(555) 234-5678'
      }
    ];

    // Simulate API loading
    setTimeout(() => {
      setPharmacies(mockPharmacies);
      setLoading(false);
    }, 500);
  }, []);

  const selectedPharmacy = pharmacies.find(pharmacy => pharmacy.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {value && selectedPharmacy ? selectedPharmacy.name : "Select a pharmacy..."}
          {loading ? (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search pharmacies..." />
          <CommandEmpty>No pharmacies found.</CommandEmpty>
          <CommandGroup>
            {pharmacies.map((pharmacy) => (
              <CommandItem
                key={pharmacy.id}
                onSelect={() => {
                  onChange(pharmacy.id === value ? '' : pharmacy.id);
                  setOpen(false);
                }}
                className="flex flex-col items-start"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{pharmacy.name}</span>
                  {pharmacy.id === value && <Check className="h-4 w-4 ml-2" />}
                </div>
                
                <div className="flex flex-col mt-1 w-full text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1 inline" /> 
                    <span className="truncate">{pharmacy.address}</span>
                    {pharmacy.distance && <span className="ml-2">({pharmacy.distance})</span>}
                  </div>
                  
                  <div className="flex justify-between mt-1">
                    {pharmacy.hours && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 inline" /> 
                        <span>{pharmacy.hours}</span>
                      </div>
                    )}
                    
                    {pharmacy.phone && (
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1 inline" /> 
                        <span>{pharmacy.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
