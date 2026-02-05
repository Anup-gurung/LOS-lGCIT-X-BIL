"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OtpVerify from "@/components/pop-up/otp";
import { Header } from "./header";
import { fetchIdentificationType } from "@/services/api";
import { mapCustomerDataToForm } from "@/lib/mapCustomerData";

export default function ExistingUserVerification() {
  const router = useRouter();
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPreference, setContactPreference] = useState<"email" | "phone" | "">("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string>("");

  // Function to generate 6-digit OTP
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Function to send SMS OTP
  const sendSmsOtp = async (phoneNumber: string, otp: string) => {
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          otp: otp
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send SMS');
      }

      return result;
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadIdentificationType = async () => {
      try {
        console.log('Loading identification types...');
        const options = await fetchIdentificationType();
        console.log('Identification types loaded:', options);
        
        if (!options || options.length === 0) {
          throw new Error('No identification types returned');
        }
        
        setIdentificationTypeOptions(options);
      } catch (error) {
        console.error('Failed to load identification types:', error);
        // Fallback options if API fails
        const fallbackOptions = [
          { identity_type_pk_code: '1', identity_type: 'CID' },
          { identity_type_pk_code: '2', identity_type: 'Work Permit' },
          { identity_type_pk_code: '3', identity_type: 'Passport' }
        ];
        console.log('Using fallback options:', fallbackOptions);
        setIdentificationTypeOptions(fallbackOptions);
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
                <label className="text-sm text-gray-700 font-medium block mb-1">
                  Select Identification Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-gray-900"
                  value={idType}
                  onChange={(e) => {
                    console.log('ID Type selected:', e.target.value);
                    setIdType(e.target.value);
                  }}
                  required
                >
                  <option value="" disabled>Select</option>
                  {identificationTypeOptions.length === 0 ? (
                    <option value="" disabled>Loading...</option>
                  ) : (
                    identificationTypeOptions.map((option, index) => {
                      const key = option.identity_type_pk_code || option.identification_type_pk_code || option.id || `id-${index}`;
                      const value = String(option.identity_type_pk_code || option.identification_type_pk_code || option.id || index);
                      const label = option.identity_type || option.identification_type || option.name || 'Unknown';
                      return (
                        <option key={key} value={value}>
                          {label}
                        </option>
                      );
                    })
                  )}
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

              {/* Contact Preference (Radio) */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-medium mb-3">
                How would you like to receive your verification OTP?
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="contactPreference"
                      value="email"
                      checked={contactPreference === "email"}
                      onChange={() => {
                        setContactPreference("email");
                        setPhone("");
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-sm text-gray-700">Receive via Email</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="contactPreference"
                      value="phone"
                      checked={contactPreference === "phone"}
                      onChange={() => {
                        setContactPreference("phone");
                        setEmail("");
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-sm text-gray-700">Receive via SMS
</span>
                  </label>
                </div>
              </div>

              {/* Email */}
              {contactPreference === "email" && (
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
                  {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                  )}
                </div>
              )}

              {/* Phone */}
              {contactPreference === "phone" && (
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
                  {phone && !/^[0-9]{8,15}$/.test(phone) && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid phone number (8-15 digits)</p>
                  )}
                </div>
              )}
            </div>
            {/* Button */}
            <div className="mt-8 flex justify-center">
              <button 
                onClick={async () => {
                  if (!idType || !idNumber) {
                    alert('Please fill in Identification Type and Number');
                    return;
                  }
                  if (!contactPreference) {
                    alert('Please select a contact method (Email or Phone)');
                    return;
                  }
                  if (contactPreference === "email" && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
                    alert('Please provide a valid email address');
                    return;
                  }
                  if (contactPreference === "phone" && (!phone || !/^[0-9]{8,15}$/.test(phone))) {
                    alert('Please provide a valid phone number');
                    return;
                  }
                  
                  // Call Next.js API proxy to verify customer
                  setIsLoading(true);
                  try {
                    const payload = {
                      type: "I",
                      identification_type_pk_code: idType,
                      identity_no: idNumber,
                      contact_no: contactPreference === "phone" ? phone : "",
                      email_id: contactPreference === "email" ? email : ""
                    };
                    
                    console.log('Sending payload:', payload);
                    
                    // Call our Next.js API route instead of external API directly
                    const response = await fetch('/api/customer-onboarded-details', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(payload)
                    });
                    
                    const result = await response.json();
                    
                    if (!response.ok) {
                      alert(result.error || 'Failed to verify customer');
                      return;
                    }
                    
                    if (result?.success && result?.data) {
                      setCustomerData(result.data);
                      
                      console.log('Verify - API Response:', result);
                      
                      // Map customer data to form format
                      const mappedData = mapCustomerDataToForm(result);
                      
                      console.log('Verify - Mapped Data:', mappedData);
                      console.log('Verify - Mapped Data Keys:', Object.keys(mappedData));
                      
                      // Clear old data first, then store new verified customer data
                      sessionStorage.removeItem('verifiedCustomerData');
                      // Also clear NDI data to prevent conflicts
                      sessionStorage.removeItem('ndi_verified_data');
                      sessionStorage.removeItem('ndi_mapped_personal_details');
                      
                      console.log('📦 Storing mapped data in sessionStorage["verifiedCustomerData"]...');
                      sessionStorage.setItem('verifiedCustomerData', JSON.stringify(mappedData));
                      
                      // Verify it was stored
                      const stored = sessionStorage.getItem('verifiedCustomerData');
                      console.log('✅ Data stored. Verification:', stored ? '✓ EXISTS' : '✗ MISSING');
                      console.log('📊 Stored data size:', stored ? stored.length : 0, 'bytes');
                      
                      console.log('Verify - Data stored in sessionStorage');
                      console.log('Verify - User:', mappedData.applicantName || mappedData.fullName);
                      
                      // If phone is selected, generate and send SMS OTP
                      if (contactPreference === "phone" && phone) {
                        try {
                          const smsResponse = await fetch('/api/send-sms', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              to: phone
                            })
                          });
                          
                          const smsResult = await smsResponse.json();
                          
                          if (smsResult.success && smsResult.otp) {
                            // Use the OTP returned by the SMS API (ensure 6 digits)
                            const formattedOtp = String(smsResult.otp).padStart(6, '0');
                            setGeneratedOtp(formattedOtp);
                            
                            console.log('\n===== SMS OTP SENT =====');
                            console.log('Phone Number:', phone);
                            console.log('OTP Received:', smsResult.otp);
                            console.log('Formatted OTP (6-digit):', formattedOtp);
                            console.log('========================\n');
                            alert(`OTP has been sent to your phone number: ${phone}`);
                            // alert(`OTP has been sent to your phone number: ${phone}\n\nFor testing: ${formattedOtp}`);
                          } else {
                            console.warn('⚠️ SMS sent but OTP not in response:', smsResult);
                            alert('OTP has been sent to your phone number');
                          }
                        } catch (smsError: any) {
                          console.error('Failed to send SMS:', smsError);
                          
                          // Provide more specific error message
                          let errorMsg = 'Failed to send SMS OTP. ';
                          if (smsError.message.includes('timed out') || smsError.message.includes('connect')) {
                            errorMsg += 'The SMS service is not reachable. Please check if the service is running or try again later.';
                          } else {
                            errorMsg += smsError.message || 'Please try again.';
                          }
                          
                          alert(errorMsg);
                          
                          // For testing, allow to proceed without SMS (remove this in production)
                          const proceedAnyway = confirm('Do you want to proceed without SMS verification? (Testing only)');
                          if (!proceedAnyway) {
                            return;
                          }
                        }
                      }
                      
                      // If email is selected, generate OTP and send via email
                      if (contactPreference === "email" && email) {
                        const otp = generateOtp();
                        setGeneratedOtp(otp);
                        
                        console.log('\n===== EMAIL OTP GENERATED =====');
                        console.log('Email Address:', email);
                        console.log('OTP:', otp);
                        console.log('================================\n');
                        
                        // Send OTP via email using our email service
                        try {
                          const response = await fetch('/api/send-sms', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              to: email,
                              otp: otp
                            })
                          });
                          
                          const emailResult = await response.json();
                          
                          if (response.ok && emailResult.success) {
                            console.log('✅ Email OTP sent successfully');
                            alert(`OTP has been sent to your email: ${email}\n\nPlease check your inbox (and spam folder).`);
                          } else {
                            console.error('Failed to send email OTP:', emailResult);
                            alert('Failed to send OTP email. Please try again.');
                            return;
                          }
                        } catch (error) {
                          console.error('Failed to send email OTP:', error);
                          alert('Failed to send OTP email. Please check your internet connection and try again.');
                          return;
                        }
                      }
                      
                      setShowOtpModal(true);
                    } else {
                      console.log('Verify - Invalid response:', result);
                      alert('Customer not found or invalid response');
                    }
                  } catch (error: any) {
                    console.error('Error verifying customer:', error);
                    alert(error.message || 'Failed to verify customer. Please try again.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="bg-blue-700 hover:bg-blue-800 transition text-white px-8 py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Proceed'}
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
            <OtpVerify 
              onClose={() => setShowOtpModal(false)} 
              generatedOtp={generatedOtp}
              contactMethod={contactPreference}
              contactValue={contactPreference === "phone" ? phone : email}
            />
          </div>
        </div>
      )}
    </div>
  );
}
