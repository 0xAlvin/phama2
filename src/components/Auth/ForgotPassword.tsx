'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import styles from "@/styles/auth/auth.module.css"; // Import auth styles
import FpStyles from "./ForgotPassword.module.css"; // Import CSS module

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password reset email sent",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "There was a problem sending the password reset email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem sending the password reset email.",
        variant: "destructive",
      });
      console.error('Error sending password reset email:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth_page}>
      <div className={styles.auth_card}>
        <div className={styles.auth_left}>
          <h1>Forgot Password</h1>
          <p>Enter your email to reset your password</p>
        </div>
        <div className={styles.auth_right}>
          <form onSubmit={handleSubmit} className={styles.auth_form}>
            <div className={styles.form_group}>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.form_control}
              />
            </div>
            <Button type="submit" disabled={loading} className={styles.btn_submit}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
