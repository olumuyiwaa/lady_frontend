import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LottieAnimation from "@/components/auth/LottieAnimation";


export default function AuthLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
      <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
        <ThemeProvider>
          <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
            {children}

            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />

            {/* Right Side */}
            <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
              <div className="relative flex items-center justify-center z-1">
                <GridShape />

                <div className="flex flex-col items-center max-w-xl">
                  {/* Lottie Animation */}
                  <LottieAnimation/>

                  {/* Logo */}
                  <Link href="/" className="block mb-4">
                    <Image
                        width={331}
                        height={68}
                        src="./images/logo/auth-logo.svg"
                        alt="Logo"
                        priority
                    />
                  </Link>

                  {/* Tagline */}
                  <p className="text-center text-gray-400 dark:text-white/60 text-sm">
                    Connecting healthcare professionals, facilities, and opportunities
                    through a secure and efficient staffing platform.
                  </p>
                </div>
              </div>
            </div>

            <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
              <ThemeTogglerTwo />
            </div>
          </div>
        </ThemeProvider>
      </div>
  );
}