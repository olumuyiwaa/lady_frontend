"use client";

import React from "react";
import {Modal} from "@/components/ui/modal";
import {AlertIcon, BoltIcon, CheckLineIcon, CloseLineIcon, InfoIcon, UserIcon} from "@/icons";

type AlertType = "success" | "info" | "warning" | "error";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: AlertType;
    title?: string;
    message: string;
    icon?: React.ReactNode;
    confirmText?: string;
    onConfirm?: () => void;
}

const alertConfig = {
    success: { color: "success", bgColor: "bg-success-50 dark:bg-success-500/15", iconColor: "text-success-600" },
    info:    { color: "blue-light", bgColor: "bg-blue-light-50 dark:bg-blue-light-500/15", iconColor: "text-blue-light-500" },
    warning: { color: "warning", bgColor: "bg-warning-50 dark:bg-warning-500/15", iconColor: "text-warning-600" },
    error:   { color: "error", bgColor: "bg-error-50 dark:bg-error-500/15", iconColor: "text-error-600" },
};

export default function AlertModal({
                                       isOpen,
                                       onClose,
                                       type,
                                       title,
                                       message,
                                       icon,
                                       confirmText = "Okay, Got It",
                                       onConfirm,
                                   }: AlertModalProps) {
    const config = alertConfig[type];
    const defaultTitle = {
        success: "Well Done!",
        info: "Information Alert!",
        warning: "Warning Alert!",
        error: "Danger Alert!",
    }[type];

    const defaultIcon = {
        success: <CheckLineIcon size={240}/>,
        info: <InfoIcon size={240}/>,
        warning: <AlertIcon size={240}/>,
        error: <CloseLineIcon size={240}/>,
    }[type];

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-5 lg:p-10">
            <div className="text-center">
                <div className="relative flex items-center justify-center z-1 mb-7">
                    <div
                        className={`flex h-[90px] w-[90px] items-center justify-center rounded-full ${config.bgColor} ${config.iconColor}`}
                    >
                        {icon || defaultIcon || <AlertIcon size={120}/>}
                    </div>

                    <span className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
            {icon}
          </span>
                </div>

                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    {title || defaultTitle}
                </h4>

                <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">{message}</p>

                <div className="mt-7">
                    <button
                        onClick={() => {
                            onConfirm?.();
                            onClose();
                        }}
                        className={`w-full sm:w-auto px-6 py-3 text-sm font-medium text-white rounded-lg bg-${config.color}-500 hover:bg-${config.color}-600`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}