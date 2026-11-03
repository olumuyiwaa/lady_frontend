"use client";

import React from "react";
import { CaseDetails } from "@/app/api/types";

interface CaseDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseDetails: CaseDetails | null;
    isLoading: boolean;
    isArchiving: boolean;
    onArchive?: () => Promise<void>;
}

function formatDateTime(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatDate(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
    }).format(date);
}

function getCaseLocation(caseItem: CaseDetails) {
    return `${caseItem.city}, ${caseItem.state} ${caseItem.zipCode}`;
}

export default function CaseDetailsModal({
    isOpen,
    onClose,
    caseDetails,
    isLoading,
    isArchiving,
    onArchive,
}: CaseDetailsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900 lg:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Case Details
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Review case profile and recent shifts.
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading case details...</p>
                ) : !caseDetails ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Case details could not be loaded.
                    </p>
                ) : (
                    <div className="space-y-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                                    {caseDetails.publicIdentifier}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {caseDetails.patientFirstName || caseDetails.patientLastName
                                        ? `${caseDetails.patientFirstName || ""} ${caseDetails.patientLastName || ""}`.trim()
                                        : "Not provided"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {caseDetails.id}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onArchive}
                                disabled={isArchiving || !caseDetails.isActive}
                                className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isArchiving ? "Archiving..." : "Archive Case"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <DetailCard label="Facility" value={caseDetails.facility?.name || "-"} />
                            <DetailCard label="Visit Type" value={caseDetails.visitType} />
                            <DetailCard label="Status" value={caseDetails.isActive ? "Active" : "Inactive"} />
                            <DetailCard label="Date of Birth" value={formatDate(caseDetails.dateOfBirth)} />
                            <DetailCard label="Location" value={getCaseLocation(caseDetails)} />
                            <DetailCard
                                label="OASIS"
                                value={caseDetails.isOasisCase ? caseDetails.oasisType || "Yes" : "No"}
                            />
                            <DetailCard
                                label="Specialties"
                                value={caseDetails.specialties?.length ? caseDetails.specialties.join(", ") : "-"}
                            />
                            <DetailCard label="Created" value={formatDateTime(caseDetails.createdAt)} />
                            <DetailCard label="Updated" value={formatDateTime(caseDetails.updatedAt)} />
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                                Address
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {caseDetails.addressLine1}
                                {caseDetails.addressLine2 ? `, ${caseDetails.addressLine2}` : ""}
                            </p>
                            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                {getCaseLocation(caseDetails)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                                Clinical Notes
                            </h4>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <DetailCard
                                    label="Primary Diagnosis"
                                    value={caseDetails.primaryDiagnosis || "-"}
                                />
                                <DetailCard label="Notes" value={caseDetails.notes || "-"} />
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                                Recent Shifts
                            </h4>

                            {!caseDetails.shifts?.length ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No shifts found for this case.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {caseDetails.shifts.map((shift) => (
                                        <div
                                            key={shift.id}
                                            className="rounded-lg bg-gray-50 p-4 dark:bg-white/[0.03]"
                                        >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {shift.title || `${shift.visitType} / ${shift.requiredDesignation}`}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDateTime(shift.scheduledStart)} to {formatDateTime(shift.scheduledEnd)}
                                                    </p>
                                                </div>

                                                <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                                    {shift.status}
                                                </span>
                                            </div>

                                            {shift.assignments?.length ? (
                                                <div className="mt-3 space-y-1">
                                                    {shift.assignments.map((assignment) => (
                                                        <p
                                                            key={assignment.id}
                                                            className="text-xs text-gray-500 dark:text-gray-400"
                                                        >
                                                            Assigned: {assignment.nurseProfile
                                                                ? `${assignment.nurseProfile.firstName} ${assignment.nurseProfile.lastName}`
                                                                : "Unknown"} · {assignment.status}
                                                        </p>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
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
