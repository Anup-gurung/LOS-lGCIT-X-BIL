"use client";

import Image from "next/image";
import Link from "next/link"; // Added Link import
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  Search,
  AlertCircle,
  QrCode,
} from "lucide-react";

interface DocumentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed?: () => void;
  searchStatus?: "searching" | "found" | "not_found";
}

export default function DocumentPopup({
  open,
  onOpenChange,
  onProceed,
  searchStatus = "searching",
}: DocumentPopupProps) {
  // Handler for when data is FOUND (Fill form)
  const handleFoundAction = () => {
    onOpenChange(false);
    if (onProceed) {
      onProceed();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-8 rounded-2xl border-none shadow-2xl">
        {/* Accessibility: DialogTitle is required */}
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

        {/* 3. NOT FOUND STATE (Redirect to NDI via Link) */}
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
                the <span className="font-bold text-[#003DA5]">Bhutan NDI</span>{" "}
                app.
              </p>
            </div>

            <Link href="/qr-scan" className="w-full">
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-[#003DA5] text-[#003DA5] hover:bg-[#003DA5] hover:text-white bg-transparent font-semibold rounded-xl transition-all gap-2"
              >
                <QrCode className="h-4 w-4" />
                Continue with NDI
              </Button>
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
