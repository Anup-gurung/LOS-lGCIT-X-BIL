"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    CheckCircle2,
    Search,
    AlertCircle,
    FileEdit,
} from "lucide-react";

interface BILBusinessSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProceed?: () => void;
    searchStatus?: "searching" | "found" | "not_found";
}

export default function BILBusinessSearch({
    open,
    onOpenChange,
    onProceed,
    searchStatus = "searching",
}: BILBusinessSearchProps) {
    // Generic handler to close popup and trigger the proceed callback
    const handleAction = () => {
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
                        ? "Searching Business Database"
                        : searchStatus === "found"
                            ? "Business Found"
                            : "Business Not Registered"}
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
                                Verifying Business
                            </h3>
                            <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed">
                                Please wait while we search the BIL database for existing business records...
                            </p>
                        </div>
                    </div>
                )}

                {/* 2. FOUND STATE (Existing Business) */}
                {searchStatus === "found" && (
                    <div className="flex flex-col items-center justify-center py-4 space-y-5 text-center">
                        <div className="bg-green-50 p-4 rounded-full">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">Business Found</h3>
                            <p className="text-sm text-gray-600 leading-relaxed px-4">
                                Your business is registered with BIL. Its information will be automatically retrieved.
                            </p>
                        </div>
                        <Button
                            className="w-full h-12 bg-[#003DA5] hover:bg-[#002D7A] text-white font-semibold rounded-xl transition-all"
                            onClick={handleAction}
                        >
                            Continue with Existing Data
                        </Button>
                    </div>
                )}

                {/* 3. NOT FOUND STATE (Manual Entry) */}
                {searchStatus === "not_found" && (
                    <div className="flex flex-col items-center justify-center py-4 space-y-5 text-center">
                        <div className="bg-orange-50 p-4 rounded-full">
                            <AlertCircle className="h-12 w-12 text-orange-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">
                                Business Not Registered
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed px-4">
                                The business is not registered with BIL. Please enter the data manually.
                            </p>
                        </div>

                        <Button
                            onClick={handleAction}
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