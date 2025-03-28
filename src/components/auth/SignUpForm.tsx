import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/styles/auth/auth.module.css';

import { Role, RegisterUserData } from '@/types/authTypes';


export default function SignUpForm({
    onRegister
}: Readonly<{
    onRegister: (userData: RegisterUserData) => Promise<{
        success: boolean;
        error?: string | null;
    }>
}>) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        role: Role.PATIENT as Role,
        firstName: '',
        lastName: '',
        pharmacyName: '',
        licenseNumber: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (formData.role === Role.PATIENT && (!formData.firstName || !formData.lastName)) {
            setError("First name and last name are required for patients");
            setIsLoading(false);
            return;
        }

        if (formData.role === Role.PHARMACY && (!formData.pharmacyName || !formData.licenseNumber)) {
            setError("Pharmacy name and license number are required");
            setIsLoading(false);
            return;
        }

        try {
            // Prepare user data based on role
            const userData: RegisterUserData = {
                email: formData.email,
                password: formData.password,
                phoneNumber: formData.phoneNumber || undefined,
                role: formData.role,
                ...(formData.role === Role.PATIENT 
                    ? { firstName: formData.firstName, lastName: formData.lastName }
                    : { pharmacyName: formData.pharmacyName, licenseNumber: formData.licenseNumber }),
            };
            
            const result = await onRegister(userData);

            if (result.success) {
                
                router.push('/signin');
            } else {
                throw new Error(result.error || 'Registration failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during registration');
        } finally {
            setIsLoading(false);
        }
    };

    const renderRoleSpecificFields = () => {
        if (formData.role === Role.PATIENT) {
            return (
                <div className={styles.form_row}>
                    <div className={styles.form_field}>
                        <input
                            id="firstName"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="First Name"
                            required
                        />
                    </div>
                    <div className={styles.form_field}>
                        <input
                            id="lastName"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Last Name"
                            required
                        />
                    </div>
                </div>
            );
        } else if (formData.role === Role.PHARMACY) {
            return (
                <>
                    <div className={styles.form_row}>
                        <div className={`${styles.form_field} ${styles.full_width}`}>
                            <input
                                id="pharmacyName"
                                type="text"
                                name="pharmacyName"
                                value={formData.pharmacyName}
                                onChange={handleChange}
                                placeholder="Pharmacy Name"
                                required
                            />
                        </div>
                    </div>
                    <div className={styles.form_row}>
                        <div className={`${styles.form_field} ${styles.full_width}`}>
                            <input
                                id="licenseNumber"
                                type="text"
                                name="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={handleChange}
                                placeholder="License Number"
                                required
                            />
                        </div>
                    </div>
                </>
            );
        }
    };

    return (
        <div className={styles.auth_container}>
            <div className={styles.auth_content}>
                <div className={styles.auth_header}>
                    <span className={styles.label_text}>Get started</span>
                    <h1 className={styles.heading_text}>
                        Let's create<br />
                        your account
                    </h1>
                </div>

                <div className={styles.auth_form_section}>
                    {error && <div className={styles.form_error}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className={styles.form_row}>
                            <div className={styles.form_field}>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Your Email"
                                    required
                                />
                            </div>
                            <div className={styles.form_field}>
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="Your Phone"
                                />
                            </div>
                        </div>

                        <div className={styles.form_row}>
                            <div className={styles.form_field}>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Password"
                                    required
                                />
                            </div>
                            <div className={styles.form_field}>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm Password"
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.form_row}>
                            <div className={`${styles.form_field} ${styles.full_width}`}>
                                <div className={styles.role_selector}>
                                    <p>I'm registering as:</p>
                                    <div className={styles.role_options}>
                                        <label className={`${styles.role_option} ${formData.role === Role.PATIENT ? styles.selected : ''}`}>
                                            <input
                                                type="radio"
                                                name="role"
                                                value={Role.PATIENT}
                                                checked={formData.role === Role.PATIENT}
                                                onChange={handleChange}
                                            />
                                            <span>Patient</span>
                                        </label>
                                        <label className={`${styles.role_option} ${formData.role === Role.PHARMACY ? styles.selected : ''}`}>
                                            <input
                                                type="radio"
                                                name="role"
                                                value={Role.PHARMACY}
                                                checked={formData.role === Role.PHARMACY}
                                                onChange={handleChange}
                                            />
                                            <span>Pharmacy</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {renderRoleSpecificFields()}

                        <div className={styles.form_row}>
                            <div className={`${styles.form_field} ${styles.full_width}`}>
                                <button type="submit" disabled={isLoading} className={styles.submit_button}>
                                    {isLoading ? 'Creating account...' : 'Sign Up'}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className={styles.auth_footer}>
                        <p>
                            Already have an account?{' '}
                            <Link href="/signin">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
