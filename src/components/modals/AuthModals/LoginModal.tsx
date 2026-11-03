"use client";

import React from "react";
import LottieAnimation from "@/components/auth/LottieAnimation";

type LoginModalProps = {
  isOpen: boolean;
};

export function LoginModal({ isOpen }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-2xl bg-white dark:bg-gray-900 p-8 text-center shadow-xl">
        <LottieAnimation/>
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-brand-600" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          Signing In...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please wait while we set up your session
        </p>
      </div>
    </div>
  );
}