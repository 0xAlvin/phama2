"use client";

import SignUpForm from '@/components/auth/SignUpForm'
import { signUpHelper } from '@/lib/helpers/auth';
import React from 'react'

function SignUpPage() {
  return (
    <>
    <SignUpForm onRegister={signUpHelper}/>
    </>
  )
}

export default SignUpPage