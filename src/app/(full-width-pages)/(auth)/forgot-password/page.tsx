"use client";

import React, { useState } from "react";
import Link from "next/link";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { authApi } from "@/app/api/auth.api";
import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      if (response.success) {
        setIsSubmitted(true);
        toast.success("Reset instructions sent to your email.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto min-h-screen p-4">
      <div className="mb-5 sm:mb-8">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Forgot Password
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </p>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label>
                Email Address <span className="text-error-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="info@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/10">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="mb-2 font-semibold text-gray-800 dark:text-white/90">Check your email</h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            We've sent password reset instructions to <br />
            <span className="font-medium text-gray-800 dark:text-white">{email}</span>
          </p>
          <Button variant="outline" onClick={() => setIsSubmitted(false)} className="w-full">
            Resend Email
          </Button>
          <div className="mt-4">
             <Link href="/public" className="text-sm text-brand-500 hover:text-brand-600">
                Return to Login
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}