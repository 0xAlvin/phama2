import React from 'react';
import { 
  Pill, Truck, Clipboard, CreditCard, Clock, Headphones 
} from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    id: 1,
    icon: <Pill size={28} />,
    title: 'Prescription Services',
    description: 'Upload prescriptions quickly and get your medications delivered to your doorstep with proper verification.',
    link: '/services/prescriptions'
  },
  {
    id: 2,
    icon: <Truck size={28} />,
    title: 'Fast Delivery',
    description: 'Get your medications delivered within hours with our express delivery service across all major cities.',
    link: '/services/delivery'
  },
  {
    id: 3,
    icon: <Clipboard size={28} />,
    title: 'Medical Records',
    description: 'Securely store and access all your medical records and prescriptions in one place anytime, anywhere.',
    link: '/services/records'
  },
  {
    id: 4,
    icon: <CreditCard size={28} />,
    title: 'Insurance Processing',
    description: 'We handle insurance claims and provide detailed information about coverage for your medications.',
    link: '/services/insurance'
  },
  {
    id: 5,
    icon: <Clock size={28} />,
    title: 'Medication Reminders',
    description: 'Never miss a dose with our personalized medication reminder system sent directly to your phone.',
    link: '/services/reminders'
  },
  {
    id: 6,
    icon: <Headphones size={28} />,
    title: '24/7 Support',
    description: 'Our healthcare professionals are available around the clock to assist you with any questions or concerns.',
    link: '/services/support'
  },
];

export default function Services() {
  return (
    <section className="services-section" id="services">
      <div className="container">
        <div className="services-header">
          <h2 className="services-title">Our Services</h2>
          <p className="services-description">
            We provide a comprehensive range of pharmacy services designed to make healthcare accessible and convenient for you.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <div className="service-card" key={service.id}>
              <div className="service-icon">
                {service.icon}
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <Link href={service.link} className="service-link">
                Learn more
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
