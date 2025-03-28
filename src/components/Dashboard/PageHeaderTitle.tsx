import { LucideIcon } from "lucide-react";
import '../../styles/components.css';

interface PageHeaderTitleProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export default function PageHeaderTitle({ title, description, icon: Icon }: PageHeaderTitleProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      {Icon && (
        <div style={{ backgroundColor: 'rgba(0, 112, 243, 0.1)', padding: '8px', borderRadius: '8px' }}>
          <Icon style={{ height: '32px', width: '32px', color: '#0070f3' }} />
        </div>
      )}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '600', letterSpacing: '-0.025em' }}>{title}</h1>
        {description && (
          <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{description}</p>
        )}
      </div>
    </div>
  );
}
