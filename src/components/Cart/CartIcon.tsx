import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { useUserRole } from '@/lib/hooks/use-user-role';

interface CartIconProps {
  className?: string;
}

export const CartIcon: React.FC<CartIconProps> = ({ className = '' }) => {
  const { totalItems } = useCart();
  const { isPatient } = useUserRole();

  // Only show cart for patients
  if (!isPatient) return null;

  return (
    <Link href="/dashboard/cart" className={`relative ${className}`}>
      <ShoppingCart className="w-6 h-6" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </Link>
  );
};
