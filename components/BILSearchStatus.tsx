"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
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
import { resetNDIScanCount } from "@/lib/indexDB";

interface DocumentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed?: () => void;
  searchStatus?: "searching" | "found" | "not_found" ;
  setSearchStatus?: (status: "searching" | "found" | "not_found") => void

}

export default function DocumentPopup({
  open,
  onOpenChange,
  onProceed,
  searchStatus = "searching",
}: DocumentPopupProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();   // ✅ inside component

  const searchParams= useSearchParams();

  const handleNewUserNDI = async () => {
//  await resetNDIScanCount();
//  alert("scan count reset")

    try {
        setLoading(true);  // start loading
      // const redirectUrl = await startNdiFlow("/co-/loan-application?step=1"");
        const currentPath = window.location.pathname + window.location.search; // Get current path
        // const searchParams = useSearchParams();
        const step = searchParams.get("step");

        const role = getRoleFromStep(step);
      console.log("Role", role)
        const redirectUrl = await startNdiFlow(currentPath, role, "temp");

      router.push(redirectUrl);
      console.log ("")
    } catch (error) {
      alert("Failed to start NDI verification");
      console.log("error", error)
    }
  };

  const handleFoundAction = () => {
    onOpenChange(false);
    if (onProceed) {
      onProceed();
    }
  };

  const handleNotAction = () => {
    onOpenChange(false);
    // TODO: Implement manual data entry logic
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

         {/* Branding Header */}
        <div className="flex flex-col items-center mb-2">
          <Image
            src="/logo.png"
            alt="Bhutan Insurance Logo"
            width={90}
            height={90}
            className="object-contain"
          />
        </div>

        {/* 1. SEARCHING / LOADING STATE */}
        {searchStatus === "searching" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-5">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-[#003DA5] animate-spin" />
              <Search className="h-6 w-6 text-[#003DA5] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                Verifying Co-Borrower
              </h3>
              <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed">
                Please wait while we search the BIL database for existing
                records...
              </p>
            </div>
          </div>
        )}

        {/* 2. FOUND STATE (Existing User) */}
        {searchStatus === "found" && (
          <div className="flex flex-col items-center justify-center py-4 space-y-5 text-center">
            <div className="bg-green-50 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Record Found</h3>
              <p className="text-sm text-gray-600 leading-relaxed px-4">
                This co-borrower is already registered with BIL. Their
                information will be automatically retrieved.
              </p>
            </div>
            <Button
              className="w-full h-12 bg-[#003DA5] hover:bg-[#002D7A] text-white font-semibold rounded-xl transition-all"
              onClick={handleFoundAction}
            >
              Continue with Existing Data
            </Button>
          </div>
        )}

        {searchStatus === "not_found" && (
          <div className="flex flex-col items-center justify-center py-4 space-y-5 text-center">
            <div className="bg-orange-50 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-orange-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                User Not Registered
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed px-4">
                This user is not registered with BIL. They should register using
                the <span className="font-bold text-[#003DA5]">
                  Bhutan NDI
                </span>{" "}
                app.
              </p>
            </div>

            <Button
              onClick={handleNewUserNDI}
              disabled={loading}
              variant="outline"
              className="w-full h-12 border-2 border-[#003DA5] text-[#003DA5] hover:bg-[#003DA5] hover:text-white font-semibold rounded-xl gap-2"
            >  {loading ? "Generating QR..." : "New User"}
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <QrCode className="h-4 w-4" />
              Continue with NDI
            </Button>
                        <Button
                            onClick={handleNotAction}
                            className="w-full h-12 bg-[#003DA5] hover:bg-[#002D7A] text-white font-semibold rounded-xl transition-all gap-2"
                        >
                            <FileEdit className="h-4 w-4" />
                            Enter Data Manually
                        </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}