import { useState } from "react";

type AlertType = "success" | "info" | "warning" | "error";

export function useAlert() {
    const [isOpen, setIsOpen] = useState(false);
    const [alertData, setAlertData] = useState<{
        type: AlertType;
        title?: string;
        message: string;
        icon?: React.ReactNode;
        confirmText?: string;
        onConfirm?: () => void;
    } | null>(null);

    const showAlert = (data: {
        type: AlertType;
        title?: string;
        message: string;
        icon?: React.ReactNode;
        confirmText?: string;
        onConfirm?: () => void;
    }) => {
        setAlertData(data);
        setIsOpen(true);
    };

    const closeAlert = () => {
        setIsOpen(false);
        // Small delay before clearing data for smooth close animation
        setTimeout(() => setAlertData(null), 300);
    };

    return {
        showAlert,
        closeAlert,
        isOpen,
        alertData,
    };
}