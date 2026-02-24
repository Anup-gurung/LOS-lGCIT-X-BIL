
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { QRCodeCanvas } from "qrcode.react"
// import { mapNdiDataToForm } from "" // import your NDI mapper
import { MappedFormData } from "@/lib/mapCustomerData"

export default function QRScanPage() {
  const router = useRouter()
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [proofData, setProofData] = useState<Record<string, string> | null>(null)
  const [mappedFormData, setMappedFormData] = useState<MappedFormData | null>(null)

  // Load stored proof request from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("ndiProof")
    if (stored) {
      const parsed = JSON.parse(stored)
      setQrUrl(parsed.proofRequestURL)
      setThreadId(parsed.threadId)
    }
  }, [])

  // Poll backend for proof result
  useEffect(() => {
    if (!threadId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/proof-result/${threadId}`)
        const data = await res.json()
        console.log("Response data:", data)

        if (res.status === 202) {
          console.log("Proof still pending...")
          return
        }

      if (res.status === 200 && data.status === "COMPLETED") {
        const ndiAttributes = data.attributes

        console.log("✅ NDI USER DATA:", ndiAttributes)
        // Map ONLY NDI data
        // const mappedFormData = mapNdiDataToForm(ndiAttributes)

        // Store separately for new-user flow
        sessionStorage.setItem(
          "ndiMappedFormData",
          JSON.stringify(mappedFormData)
        )

        console.log("NDI mapped form data:", mappedFormData)

        clearInterval(interval)

        router.push("/loan-application?step=1")
      }
      } catch (err) {
        console.error("Polling error:", err)
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [threadId, router])

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">

          {/* Left Illustration */}
          <div className="flex justify-center">
            <Image
              src="/identity.png"
              alt="Profile verification illustration"
              width={600}
              height={600}
              className="w-full max-w-lg"
            />
          </div>

          {/* Right QR / Proof Card */}
          <Card className="shadow-2xl border-gray-200">
            <CardContent className="p-10 space-y-6">

              {!proofData ? (
                <>
                  <h2 className="text-2xl font-bold text-center">
                    Scan with Bhutan NDI Wallet
                  </h2>

                  <div className="flex flex-col items-center py-6 space-y-4">
                    {qrUrl ? (
                      <div className="p-4 bg-white rounded-xl border-4 border-green-400 shadow-lg">
                        <QRCodeCanvas value={qrUrl} size={260} />
                      </div>
                    ) : (
                      <p className="text-gray-500">Loading QR...</p>
                    )}

                    {/* Instructions */}
                    <div className="space-y-2 text-gray-700 text-left">
                      <p><strong>1.</strong> Open Bhutan NDI Wallet</p>
                      <p><strong>2.</strong> Tap Scan and scan this QR code</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-center text-green-700">
                    Identity Verified
                  </h2>

                  <div className="space-y-4">
                    {mappedFormData && Object.entries(mappedFormData).map(([key, value]) => (
                      key !== "verifiedFields" && key !== "isVerified" && value ? (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-600">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={value as string}
                            readOnly
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100"
                          />
                        </div>
                      ) : null
                    ))}
                  </div>
                </>
              )}

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}