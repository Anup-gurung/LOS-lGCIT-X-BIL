"use client"

import Image from "next/image"
import { Header } from "@/components/header"
import billingImage from "../images/billing.png"

export default function BillingSection() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="pt-32 pb-14 px-4 sm:px-6 lg:px-10 flex justify-center">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* LEFT SIDE IMAGE */}
          <div className="flex justify-center">
            <Image
              src={billingImage}
              alt="Billing illustration"
              className="w-full max-w-md h-auto"
              priority
            />
          </div>

          {/* RIGHT SIDE CARD */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm border rounded-xl shadow-md p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">Billing</h2>

              <div className="space-y-2 text-sm">
                <p>
                  Processing Fee: <span className="font-semibold">Nu. 50</span>
                </p>
                <p>
                  Type of loan: <span className="font-medium">Transport Loan</span>
                </p>
              </div>

              <button className="mt-6 w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
