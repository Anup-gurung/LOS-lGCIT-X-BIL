"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DocumentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed?: () => void;
}

export default function DocumentPopup({
  open,
  onOpenChange,
  onProceed,
}: DocumentPopupProps) {
  const router = useRouter();

  const handleOkay = () => {
    onOpenChange(false);
    if (onProceed) {
      onProceed();
    }
    // Always navigate to login page after closing
    router.push("/loan-application/business?step=1");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl">
        <DialogHeader className="flex flex-col items-center gap-2">
          <Image
            src="/logo.png"
            alt="Bhutan Insurance Logo"
            width={80}
            height={80}
            className="object-contain"
          />
          <DialogTitle className="text-lg text-center font-medium mt-2">
            To proceed with your application, please prepare the following
            documents:
          </DialogTitle>
        </DialogHeader>

        <ul className="text-sm mt-3 space-y-1 text-gray-700 list-disc list-inside">
          <li>Latest Passport size photographs (2 Nos)</li>
          <li>Copy of ID card of borrower</li>
          <li>Business Portfolio/Cost Estimation for Expansion</li>
          <li>Family Tree (if applicable)</li>
          <li>Letter of Guarantee (if applicable)</li>
          <li>CID copy of Guarantor</li>
          <li>CIB Report (Both Borrower & Guarantor)</li>
          <li>Valid Business License Copy</li>
          <li>Recent Tax Clearance copy</li>
          <li>Income statement (Profit or Loss a/c Statement)</li>
          <li>Loan Agreement</li>
          <li>Mortgage Deeds</li>
          <li>Insurance Policy Copy</li>
          <li>Original Lag-Thram</li>
          <li>Inspection report for Collateral</li>
          <li>Inspection report for Business</li>
          <li>Introducer letter</li>
        </ul>

        <DialogFooter className="mt-5 flex justify-center">
          <Button onClick={handleOkay}>Okay</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
