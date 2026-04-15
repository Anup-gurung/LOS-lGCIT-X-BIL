"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { startNdiFlow } from "@/lib/startNdiFlow";
import { mapNdiDataToCoBorrower } from "@/lib/mapNdiData";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

import {
  Loader2,
  CheckCircle2,
  Search,
  AlertCircle,
  QrCode,
  FileEdit,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getRoleFromStep } from "@/lib/mapNdiData";
import { threadId } from "worker_threads";

interface DocumentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed?: () => void;
  searchStatus?: "searching" | "found" | "not_found";
  setSearchStatus?: (status: "searching" | "found" | "not_found") => void;
}

export default function DocumentPopup({
  open,
  onOpenChange,
  onProceed,
  searchStatus = "searching",
}: DocumentPopupProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [qrData, setQrData] = useState<any>(null);
  const [waiting, setWaiting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Start NDI for new users (inline)
  const handleNewUserNDI = async () => {
    console.log("Initiating NDI flow for new user with email:", email);
    if (!email) {
      setEmailError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setEmailError("");

      const currentPath = window.location.pathname + window.location.search;
      const step = searchParams.get("step");
      const role = getRoleFromStep(step);

      // Start NDI flow (inline mode)
      const result = await startNdiFlow(currentPath, role, email, "inline");
      console.log("NDI flow result:", result.toString());
      
      setQrData(result);
      setWaiting(true);
    } catch (error) {
      alert("Failed to start NDI verification, from status");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Poll NDI verification status
  useEffect(() => {
    if (!waiting || !qrData?.threadId) return;

    const interval = setInterval(async () => {
      try {
      const res = await fetch(
          `${BACKEND}/api/proof-result/${qrData.threadId}`
        );
        const data = await res.json();
        console.log("API response status", res.status)
        console.log("Polling NDI status for threadId:", qrData.threadId, "Status response:", data);


      console.log("Polling response:", data)

      if (data.status === "COMPLETED") {
        clearInterval(interval);

        console.log("NDI DATA RECEIVED:", data);

        const rawData = data.attributes;

        const mappedData = mapNdiDataToCoBorrower(rawData);
        // const userData = data.attributes;

        // ✅ Store NDI user data
        sessionStorage.setItem(
          "ndiCoBorrowerUserData",
          JSON.stringify(mappedData)
        );

        // Optional: store full response
        sessionStorage.setItem(
          "ndiFullResponse",
          JSON.stringify({
            ...data,
            threadId: qrData.threadId
          })
        );

        onOpenChange(false);
        onProceed?.();
      }
      } catch (err) {
        console.error("NDI polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [waiting, qrData, onOpenChange, onProceed]);

  const handleFoundAction = () => {
    onOpenChange(false);
    onProceed?.();
  };

  const handleNotAction = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-8 rounded-2xl border-none shadow-2xl">
        <DialogTitle className="sr-only">
          {searchStatus === "searching"
            ? "Searching Database"
            : searchStatus === "found"
            ? "Record Found"
            : "User Not Registered"}
        </DialogTitle>

        {/* Branding */}
        <div className="flex flex-col items-center mb-4">
          <Image
            src="/logo.png"
            alt="Bhutan Insurance Logo"
            width={90}
            height={90}
            className="object-contain"
          />
        </div>

        {/* 1️⃣ SEARCHING */}
        {searchStatus === "searching" && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-[#003DA5] animate-spin" />
              <Search className="h-6 w-6 text-[#003DA5] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Verifying Co-Borrower</h3>
            <p className="text-sm text-gray-500 text-center max-w-[280px]">
              Please wait while we search the BIL database for existing records...
            </p>
          </div>
        )}

        {/* 2️⃣ FOUND */}
        {searchStatus === "found" && (
          <div className="flex flex-col items-center py-4 space-y-5 text-center">
            <div className="bg-green-50 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Record Found</h3>
            <p className="text-sm text-gray-600 px-4">
              This co-borrower is already registered. Their information will be automatically retrieved.
            </p>
            <Button
              className="w-full h-12 bg-[#003DA5] hover:bg-[#002D7A] text-white font-semibold rounded-xl"
              onClick={handleFoundAction}
            >
              Continue with Existing Data
            </Button>
          </div>
        )}

        {/* 3️⃣ NOT FOUND */}
        {searchStatus === "not_found" && (
          <div className="flex flex-col items-center py-4 space-y-5 text-center">
            <div className="bg-orange-50 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">User Not Registered</h3>
            <p className="text-sm text-gray-600 px-4">
              This user is not registered. They should register using the{" "}
              <span className="font-bold text-[#003DA5]">Bhutan NDI</span> app.
            </p>

            {/* Email Input */}
            <div className="w-full space-y-2 text-left">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="example@email.com"
                className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#003DA5]"
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>

            {/* Actions */}
          <Button
            onClick={handleNewUserNDI}
            disabled={loading}
            variant="outline"
            className="w-full h-12 border-2 border-[#092215] text-[#092215] hover:bg-[#0f3926] hover:text-white font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting
              </>
            ) : (
              <>
                <Image
                  src="/ButtonNDILogo.svg"   // 👈 put your NDI logo in public folder
                  alt="NDI Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
                Receive Credentials
              </>
            )}
          </Button>

            <Button
              onClick={handleNotAction}
              className="w-full h-12 bg-[#003DA5] hover:bg-[#002D7A] text-white font-semibold rounded-xl gap-2 flex items-center justify-center"
            >
              <FileEdit className="h-4 w-4" />
              Enter Data Manually
            </Button>

            {/* QR Display (if waiting) */}
            {waiting && qrData?.qrCodeImage && (
              <div className="mt-4 flex flex-col items-center space-y-2">
                <p className="text-sm text-gray-500">Scan QR using NDI app</p>
                <img src={qrData.qrCodeImage} className="w-40 mx-auto" />
                <p className="text-xs text-gray-400">Waiting for verification...</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}