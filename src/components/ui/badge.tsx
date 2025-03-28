import * as React from "react";
import '../../styles/components.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const badgeClasses = [
    'badge',
    variant ? `badge-${variant}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={badgeClasses} {...props} />
  );
}

export { Badge };
