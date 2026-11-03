"use client";

import React, { FormEvent, useState } from "react";
import {UserDetails} from "@/app/api/types";

interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserDetails | null;
    isLoading: boolean;
    // Action States
    isSuspending: boolean;
    isRestoring: boolean;
    isDeleting: boolean;
    // Action Handlers
    onSuspend: (reason: string) => Promise<void>;
    onRestore: () => Promise<void>;
    onDeactivate: () => Promise<void>;
}

// Helper functions (moved from main page.tsx or exported)
function formatDateTime(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function getDisplayName(user: UserDetails) {
    if (user.adminProfile) return `${user.adminProfile.firstName} ${user.adminProfile.lastName}`;
    if (user.nurseProfile) return `${user.nurseProfile.firstName} ${user.nurseProfile.lastName}`;
    if (user.facilityMember?.firstName || user.facilityMember?.lastName) {
        return `${user.facilityMember.firstName || ""} ${user.facilityMember.lastName || ""}`.trim();
    }
    return user.email;
}

function getRoleLabel(role: string) {
    return role.replaceAll("_", " ");
}

export default function UserDetailsModal({
    isOpen,
    onClose,
    user,
    isLoading,
    isSuspending,
    isRestoring,
    isDeleting,
    onSuspend,
    onRestore,
    onDeactivate,
}: UserDetailsModalProps) {
    const [suspendReason, setSuspendReason] = useState("");

    if (!isOpen) return null;

    const handleSuspendSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSuspend(suspendReason);
        setSuspendReason("");
    };

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4">
            <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900 lg:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            User Details
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Review user profile, account status, and active sessions.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                {isLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading details...</p>
                ) : !user ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        User details could not be loaded.
                    </p>
                ) : (
                    <div className="space-y-5">
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                                {getDisplayName(user)}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{user.id}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <DetailCard label="Role" value={getRoleLabel(user.role)} />
                            <DetailCard label="Status" value={user.status} />
                            <DetailCard label="Verification" value={user.verificationStatus} />
                            <DetailCard label="Phone" value={user.phone || "-"} />
                            <DetailCard label="Email Verified" value={formatDateTime(user.emailVerifiedAt)} />
                            <DetailCard label="Last Login" value={formatDateTime(user.lastLoginAt)} />
                            <DetailCard label="Two Factor" value={user.twoFactorEnabled ? "Enabled" : "Disabled"} />
                            <DetailCard label="Created" value={formatDateTime(user.createdAt)} />
                            <DetailCard label="Updated" value={formatDateTime(user.updatedAt)} />
                        </div>

                        {/* Nurse Profile Section */}
                        {user.nurseProfile && (
                            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Nurse Profile</h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <DetailCard label="Name" value={`${user.nurseProfile.firstName} ${user.nurseProfile.lastName}`} />
                                    <DetailCard label="Designation" value={user.nurseProfile.designation} />
                                    <DetailCard label="Available" value={user.nurseProfile.isAvailable ? "Yes" : "No"} />
                                    <DetailCard label="Background Checked" value={user.nurseProfile.backgroundChecked ? "Yes" : "No"} />
                                    <DetailCard label="Experience" value={user.nurseProfile.yearsOfExperience != null ? `${user.nurseProfile.yearsOfExperience} years` : "-"} />
                                    <DetailCard label="Location" value={`${user.nurseProfile.city || "-"}, ${user.nurseProfile.state || "-"}`} />
                                </div>
                                <div className="my-6">
                                    <DetailCard label="Bio" value={`${user.nurseProfile.bio || "None"}`} />
                                </div>
                                {/* Credentials... */}
                                <div className="rounded-xl border border-gray-200 p-4 mt-4 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.03]">
                                    <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                                        Nurse Credentials
                                    </h4>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                            <tr className="text-xs text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                                <th className="px-5 py-3">Credential</th>
                                                <th className="px-5 py-3">Issued</th>
                                                <th className="px-5 py-3">Verification</th>
                                                <th className="px-5 py-3">Status</th>
                                                <th className="px-5 py-3">Expires</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                                                        Loading user credentials...
                                                    </td>
                                                </tr>
                                            ) : (user?.nurseProfile?.credentials ?? []).length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                                                        No credentials found for this nurse.
                                                    </td>
                                                </tr>
                                            ) : (
                                                user!.nurseProfile!.credentials!.map((credential) => (
                                                    <tr key={credential.id}>
                                                        <td className="px-5 py-4">
                                                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                                {getDisplayName(user)}
                                                            </p>
                                                            <p className="mt-1 max-w-[260px] truncate text-xs text-gray-500 dark:text-gray-400">
                                                                {credential.type}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-4">
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
                                    {formatDateTime(credential.issuedAt)}
                                </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                                    {user.verificationStatus}
                                </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                    {credential.status}
                                </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                            {formatDateTime(credential.expiresAt)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Facility Member Section */}
                        {user.facilityMember && (
                            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Facility Member</h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <DetailCard label="Name" value={`${user.facilityMember.firstName} ${user.facilityMember.lastName}`} />
                                    <DetailCard label="Job Title" value={user.facilityMember.jobTitle || "-"} />
                                    <DetailCard label="Active" value={user.facilityMember.isActive ? "Yes" : "No"} />
                                    <DetailCard label="Facility" value={user.facilityMember.facility?.name || "-"} />
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Account Actions</h4>
                            <form onSubmit={handleSuspendSubmit} className="space-y-3">
                                <input
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    placeholder="Optional suspension reason"
                                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 text-gray-800 dark:text-white/90"
                                />
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <button
                                        type="submit"
                                        disabled={isSuspending || user.status === "SUSPENDED"}
                                        className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                                    >
                                        {isSuspending ? "Suspending..." : "Suspend User"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onRestore}
                                        disabled={isRestoring || user.status === "ACTIVE"}
                                        className="rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                                    >
                                        {isRestoring ? "Restoring..." : "Restore User"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onDeactivate}
                                        disabled={isDeleting || user.status === "DEACTIVATED"}
                                        className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                                    >
                                        {isDeleting ? "Deactivating..." : "Deactivate User"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
            <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-white/90">{value}</p>
        </div>
    );
}