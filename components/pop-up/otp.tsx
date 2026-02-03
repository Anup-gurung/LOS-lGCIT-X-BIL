"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";

interface OtpVerifyProps {
  onClose: () => void;
  generatedOtp?: string;
  contactMethod?: "email" | "phone" | "";
  contactValue?: string;
}

export default function OtpVerify({ onClose, generatedOtp = "", contactMethod = "", contactValue = "" }: OtpVerifyProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (isVerified) {
      // Navigate to loan application page at Personal Details step after animation completes (2 seconds)
      const timer = setTimeout(() => {
        router.push("/loan-application?step=1");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVerified, router]);

  const verifyOtp = async (enteredOtp: string) => {
    try {
      // Call API to verify OTP
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneOrEmail: contactValue,
          otp: enteredOtp
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsVerified(true);
        setErrorMessage("");
        return true;
      } else {
        setErrorMessage(result.error || "Invalid OTP. Please try again.");
        return false;
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setErrorMessage("Failed to verify OTP. Please try again.");
      return false;
    }
  };

  useEffect(() => {
    if (isVerified) {
      // Navigate to loan application page at Personal Details step after animation completes (2 seconds)
      const timer = setTimeout(() => {
        // Add timestamp to force component reload
        router.push("/loan-application?step=1&t=" + Date.now());
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVerified, router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all 6 digits are filled
    if (value && index === 5) {
      const allFilled = newOtp.every((digit) => digit !== "");
      if (allFilled) {
        // Trigger verification after a short delay
        setTimeout(async () => {
          const enteredOtp = newOtp.join("");
          await verifyOtp(enteredOtp);
        }, 300);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);
    
    const nextEmptyIndex = newOtp.findIndex(val => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
      
      // Check if all 6 digits are filled after paste
      const allFilled = newOtp.every((digit) => digit !== "");
      if (allFilled) {
        setTimeout(async () => {
          const enteredOtp = newOtp.join("");
          await verifyOtp(enteredOtp);
        }, 300);
      }
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-xl text-center border relative">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {!isVerified ? (
        <>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-28 h-auto"
            />
          </div>

          {/* Text */}
          <h2 className="text-lg font-medium text-gray-700 mb-2">
            Verify Your Identity
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            We've sent a 6-digit code to <span className="font-semibold">
              {contactValue || "your registered contact"}
            </span>
            {contactMethod === "phone" && " via SMS"}
            {contactMethod === "email" && " via Email"}
          </p>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          {/* OTP Input Boxes */}
          <div className="flex justify-center gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Resend */}
          <p className="text-sm text-gray-500 mb-6">
            Didn't receive the code?{" "}
            <button className="text-blue-600 font-semibold hover:underline">
              Resend
            </button>
          </p>

          {/* Verify Button */}
          <button
            onClick={async () => {
              const otpValue = otp.join("");
              if (otpValue.length === 6) {
                console.log("OTP Entered:", otpValue);
                await verifyOtp(otpValue);
              } else {
                setErrorMessage("Please enter all 6 digits");
              }
            }}
            className="w-full max-w-xs bg-blue-700 text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition"
          >
            Verify
          </button>
        </>
      ) : (
        <>
          {/* Verified Animation */}
          <div className="flex flex-col items-center justify-center py-12">
            {/* Blue Circle with Checkmark */}
            <div className="relative w-32 h-32 mb-8">
              {/* Animated Circle */}
              <div className="absolute inset-0 bg-blue-600 rounded-full animate-in zoom-in duration-700 ease-out"></div>
              {/* Animated Checkmark */}
              <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-500 delay-300 ease-out">
                <svg
                  className="w-16 h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeDasharray="50"
                  strokeDashoffset="50"
                  style={{
                    animation: 'drawCheck 0.6s ease-out 0.4s forwards'
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Success Text */}
            <h2 className="text-3xl font-bold text-blue-600 mb-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              Verified Successfully!
            </h2>
            <p className="text-gray-600 text-lg animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700">
              Your identity has been confirmed
            </p>
          </div>

          <style jsx>{`
            @keyframes drawCheck {
              to {
                stroke-dashoffset: 0;
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
