"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { startNdiFlow } from "@/lib/startNdiFlow";

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

interface DocumentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed?: () => void;
  searchStatus?: "searching" | "found" | "not_found";
  idNo?: string;
}

export default function DocumentPopup({
  open,
  onOpenChange,
  onProceed,
  searchStatus = "searching",
}: DocumentPopupProps) {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [qrData, setQrData] = useState<any>(null);
  const [waiting, setWaiting] = useState(false);

  // ✅ Start NDI (INLINE)
  const handleNewUserNDI = async () => {
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

      const currentPath =
        window.location.pathname + window.location.search;

      const step = searchParams.get("step");
      const role = getRoleFromStep(step);

      const result = await startNdiFlow(
        currentPath,
        role,
        email,
        // undefined,
        "inline"
      );
      console.log("NDI flow result:", result);

      // ✅ EXTRACT THREAD ID CORRECTLY
      const threadId = typeof result === "object" && result !== null ? result.threadId : undefined;
      console.log("Extracted threadId:", threadId);

      // Ensure result is an object before accessing threadId
      if (typeof result === "object" && result !== null) {
        setQrData({
          ...result,
          threadId, // FORCE IT
        });
        setWaiting(true);
      } else {
        alert("Invalid response from NDI flow");
      }
    } catch (error) {
      alert("Failed to start NDI verification");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
  // ✅ Poll NDI status
  useEffect(() => {
    if (!waiting || !qrData?.threadId) return;
    console.log("Starting to poll NDI status for threadId:", qrData.threadId);
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
          
        const userData = data.attributes;

        // ✅ Store NDI user data
        sessionStorage.setItem(
          "ndiCoBorrowerUserData",
          JSON.stringify(userData)
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
        console.log("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [waiting, qrData]);

  const handleFoundAction = () => {
    onOpenChange(false);
    onProceed?.();
  };

  const handleNotAction = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-8 rounded-2xl shadow-2xl">

        <DialogTitle className="sr-only">
          {searchStatus === "searching"
            ? "Searching"
            : searchStatus === "found"
            ? "Found"
            : "Not Found"}
        </DialogTitle>

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <Image src="/logo.png" alt="Logo" width={90} height={90} />
        </div>

        {/* SEARCHING */}
        {searchStatus === "searching" && (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <p>Searching database...</p>
          </div>
        )}

        {/* FOUND */}
        {searchStatus === "found" && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <p>User found</p>
            <Button onClick={handleFoundAction}>
              Continue
            </Button>
          </div>
        )}

        {/* NOT FOUND */}
        {searchStatus === "not_found" && (
          <div className="space-y-4 text-center">

            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />

            <p>User not registered</p>

            {/* Email */}
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              placeholder="Enter email"
              className="w-full border p-2 rounded"
            />

            {emailError && (
              <p className="text-red-500 text-sm">{emailError}</p>
            )}

            {/* Start NDI */}
            <Button onClick={handleNewUserNDI} disabled={loading}>
              {loading ? "Generating..." : "Continue with NDI"}
            </Button>

            {/* QR DISPLAY */}
            {waiting && qrData && (
              <div className="mt-4 space-y-2">
                <p>Scan QR using NDI app</p>
                <img
                  src={qrData.qrCodeImage}
                  className="w-40 mx-auto"
                />
                <p className="text-xs text-gray-500">
                  Waiting for verification...
                </p>
              </div>
            )}

            <Button variant="outline" onClick={handleNotAction}>
              Enter Manually
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}