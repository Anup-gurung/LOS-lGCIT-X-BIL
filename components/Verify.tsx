"use client";

import { useState, useEffect } from "react";
import OtpVerify from "@/components/pop-up/otp";
import { Header } from "./header";
import { fetchIdentificationType } from "@/services/api";

export default function ExistingUserVerification() {
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<any[]>([]);

  useEffect(() => {
    const loadIdentificationType = async () => {
      try {
        const options = await fetchIdentificationType();
        setIdentificationTypeOptions(options);
      } catch (error) {
        console.error('Failed to load identification types:', error);
        // Fallback options if API fails
        setIdentificationTypeOptions([
          { identity_type_pk_code: 'cid', identity_type: 'CID' },
          { identity_type_pk_code: 'workpermit', identity_type: 'Work Permit' },
          { identity_type_pk_code: 'passport', identity_type: 'Passport' }
        ]);
      }
    };

    loadIdentificationType();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-6xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Left Illustration */}
          <div className="flex justify-center items-center">
            <img
              src="/security.png" // change to your uploaded illustration path
              alt="Security Illustration"
              className="w-full max-w-md"
            />
          </div>

          {/* Right Form */}
          <div className="w-full">

            <div className="flex justify-center mb-6">
              <img
                src="/logo.png" // replace with your logo path
                alt="BIL Logo"
                className="h-28"
              />
            </div>

            <h2 className="text-center text-lg font-semibold text-gray-800">
              Existing User Verification
            </h2>

            <p className="text-center text-sm text-gray-600 mt-1 mb-6">
              Please verify your identity to proceed.  
              Select your identification type and provide the required details below.
            </p>

            {/* Form Fields */}
            <div className="space-y-4">

              {/* ID Type */}
              <div>
                <label className="text-sm text-gray-700 font-medium">
                  Select Identification Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                >
                  <option value="">Select</option>
                  {identificationTypeOptions.map((option, index) => {
                    const key = option.identity_type_pk_code || option.identification_type_pk_code || option.id || `id-${index}`;
                    const value = String(option.identity_type_pk_code || option.identification_type_pk_code || option.id || index);
                    const label = option.identity_type || option.identification_type || option.name || 'Unknown';
                    return (
                      <option key={key} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="text-sm text-gray-700 font-medium">
                  Identification Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Identification No"
                  className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm text-gray-700 font-medium">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter your registered email address"
                  className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm text-gray-700 font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your registered phone"
                  className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            {/* Button */}
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setShowOtpModal(true)}
                className="bg-blue-700 hover:bg-blue-800 transition text-white px-8 py-3 rounded-lg font-medium"
              >
                Proceed
              </button>
            </div>

          </div>
        </div>
        </div>
      </div>

      {/* OTP Modal with Blur Backdrop */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative">
            <OtpVerify onClose={() => setShowOtpModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
