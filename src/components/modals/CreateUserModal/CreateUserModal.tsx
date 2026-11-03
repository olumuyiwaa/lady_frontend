"use client";

import React, { useState } from "react";
import { authFetch } from "@/app/api/authFetch";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/modals/AlertModal/AlertModal";

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "NURSE" as "NURSE" | "FACILITY_ADMIN" | "TEAM_MEMBER" | "RECRUITER" | "SUPER_ADMIN",
        designation: "RN",
    });

    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Use the new alert hook
    const { showAlert, isOpen: isAlertOpen, alertData, closeAlert } = useAlert();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            if (name === "role" && value !== "NURSE") {
                updated.designation = "";
            }

            return updated;
        });

        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError("");

        try {
            const result = await authFetch("/users", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            if (!result.success) {
                if (result.errors && Array.isArray(result.errors)) {
                    const errorMsg = result.errors[0]?.msg || result.message;
                    throw new Error(errorMsg);
                }
                throw new Error(result.message || "Failed to create user");
            }

            // ✅ Show beautiful success alert instead of browser alert
            showAlert({
                type: "success",
                title: "User Created Successfully!",
                message: `A welcome email with login details has been sent to ${formData.email}`,
                confirmText: "Done",
                onConfirm: () => {
                    onSuccess();   // Refresh user list
                    onClose();     // Close create modal
                    resetForm();
                }
            });

        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    const resetForm = () => {
        setFormData({
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            phone: "",
            role: "NURSE",
            designation: "RN",
        });
        setError("");
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-gray-900/70 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                        Create New User
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Fill in the user details below
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        {/* ... your existing form fields (unchanged) ... */}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-white">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-brand-500 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-white">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-brand-500 focus:ring-brand-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-brand-500 focus:ring-brand-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={8}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-brand-500 focus:ring-brand-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">
                                Phone Number (Optional)
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-brand-500 focus:ring-brand-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-brand-500 focus:ring-brand-500"
                            >
                                <option value="NURSE">Nurse</option>
                                <option value="FACILITY_ADMIN">Facility Admin</option>
                                <option value="TEAM_MEMBER">Team Member</option>
                                <option value="RECRUITER">Recruiter</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                        </div>

                        {formData.role === "NURSE" && (
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-white">
                                    Designation <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-brand-500 focus:ring-brand-500"
                                >
                                    <option value="RN">RN</option>
                                    <option value="LVN">LVN</option>
                                    <option value="LPN">LPN</option>
                                    <option value="CNA">CNA</option>
                                    <option value="HHA">HHA</option>
                                    <option value="THERAPIST">Therapist</option>
                                    <option value="CAREGIVER">Caregiver</option>
                                </select>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                disabled={isCreating}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="flex-1 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isCreating ? "Creating User..." : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Alert Modal */}
            <AlertModal
                isOpen={isAlertOpen}
                onClose={closeAlert}
                type={alertData?.type || "success"}
                title={alertData?.title}
                message={alertData?.message || ""}
                confirmText={alertData?.confirmText}
                onConfirm={alertData?.onConfirm}
            />
        </>
    );
}