"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/auth/useAuth";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/modals/AuthModals/LoginModal";
import { postLoginPath } from "@/lib/postLoginPath";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Sign-in can take up to three steps: credentials, an authenticator code
  // (accounts with 2FA), and a workspace choice (accounts in several businesses).
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [affiliations, setAffiliations] = useState<
    { businessId: string; businessName: string; subdomain: string; role: string }[]
  >([]);

  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Navigate only after a successful login (user is set).
  // Super Admins go to /admin; business users to /dashboard.
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      router.replace(postLoginPath(user));
    }
  }, [isAuthenticated, user, isLoading, router]);

  const submitLogin = async (extra: { businessId?: string } = {}) => {
    setError("");
    setIsLoading(true);
    setShowLoginModal(true);

    try {
      const outcome = await login({
        email,
        password,
        ...(twoFactorRequired ? { twoFactorCode: twoFactorCode.trim() } : {}),
        ...extra,
      });
      if (outcome.status === "two_factor_required") {
        setTwoFactorRequired(true);
      } else if (outcome.status === "select_business") {
        setAffiliations(outcome.affiliations);
      }
      // signed_in: the redirect is handled by the useEffect above once user is set
    } catch (err: any) {
      setError(
          err?.response?.data?.message ||
          err?.message ||
          "Invalid email or password"
      );
    } finally {
      setIsLoading(false);
      setShowLoginModal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitLogin();
  };

  return (
      <>
        <LoginModal isOpen={showLoginModal} />

        <div className="flex flex-col flex-1 lg:w-1/2 w-full">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div className="mb-5 sm:mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                  Sign In
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter your email and password to sign in!
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>
                    </Label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>
                      Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                      />
                      <span
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                      {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                    </div>
                  </div>

                  {twoFactorRequired && (
                    <div>
                      <Label>
                        Authenticator code <span className="text-error-500">*</span>
                      </Label>
                      <Input
                          type="text"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="6-digit code"
                          autoComplete="one-time-code"
                          autoFocus
                      />
                    </div>
                  )}

                  {affiliations.length > 0 && (
                    <div>
                      <Label>Choose a workspace</Label>
                      <div className="space-y-2">
                        {affiliations.map((a) => (
                          <button
                              key={a.businessId}
                              type="button"
                              disabled={isLoading}
                              onClick={() => submitLogin({ businessId: a.businessId })}
                              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                          >
                            <span className="font-medium text-gray-800 dark:text-white/90">{a.businessName}</span>
                            <span className="text-xs text-gray-500">{a.role.replace("_", " ").toLowerCase()}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                      </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isChecked} onChange={setIsChecked} />
                      <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                    </div>
                    <Link
                        href="/forgot-password"
                        className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                      type="submit"
                      className="w-full"
                      size="sm"
                      disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
              </form>

            </div>
          </div>
        </div>
      </>
  );
}