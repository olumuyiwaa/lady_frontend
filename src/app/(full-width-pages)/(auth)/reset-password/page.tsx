"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { toast } from "react-toastify";
import {authApi} from "@/app/api/auth.api";

// 1. Create a sub-component that uses the search params
function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error("Invalid or missing reset token.");
            router.push("/");
        }
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        setIsLoading(true);
        try {
            const response = await authApi.resetPassword({
                token: token!,
                password,
            });

            if (response.success) {
                toast.success("Password reset successfully! Please log in.");
                router.push("/");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label>New Password</Label>
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                    />
                    <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
            {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
          </span>
                </div>
            </div>

            <div>
                <Label>Confirm New Password</Label>
                <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Reset Password"}
            </Button>
        </form>
    );
}

// 2. The main page.tsx component wraps the form in Suspense
export default function ResetPasswordPage() {
    return (
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto min-h-screen p-4">
            <div className="mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90">
                    Set New Password
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please enter your new password below.
                </p>
            </div>

            <Suspense fallback={<div className="text-center text-sm text-gray-500">Loading reset form...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}