"use client";

export default function BillingSection() {
  return (
    <div className="w-full flex justify-center items-center py-10 px-6">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        
        {/* LEFT SIDE IMAGE */}
        <div className="flex justify-center">
          <img 
            src="/billing-illustration.png" 
            alt="Billing Illustration" 
            className="w-full max-w-md"
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
    </div>
  );
}
