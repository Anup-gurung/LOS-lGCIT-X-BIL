"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { QRCodeCanvas } from "qrcode.react"
import { mapNdiDataToCoBorrower, mapNdiDataToPersonalDetail, mapNdiDataToRepaymentGuarantor, mapNdiDataToSecurityGuarantor, PersonalDetailFormData } from "@/lib/mapNdiData"
import { useSearchParams } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { storeNDIScan } from "@/lib/indexDB"
import { getNDIDataByRef } from "@/lib/indexDB"
import { se } from "date-fns/locale"


export default function QRScanPage() {
  const router = useRouter()
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [proofData, setProofData] = useState<Record<string, any> | null>(null)
  const [mappedFormData, setMappedFormData] = useState<PersonalDetailFormData | null>(null)
  const [status, setStatus] = useState<'pending' | 'completed' | 'error'>('pending')

  // Backend URL from .env
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

  const searchParams = useSearchParams()
  const redirectPathParam = searchParams.get("redirect")

  const redirectPath = redirectPathParam
    ? decodeURIComponent(redirectPathParam)
    : "/loan-application?step=1"
  const [loading, setLoading] = useState(true)

  // For QR expiry handling, we can set a timeout (e.g., 2 minutes) to reset the state and allow re-generation of QR code if needed.
  const [expired, setExpired] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const QR_EXPIRY_TIME = 5 * 60 * 1000 // 2 minutes (adjust as needed)

  const [role, setRole] = useState<string>("")
  const [refId, setRefId] = useState<string>("")


  useEffect(() => {
    if (!qrUrl) return

    const timer = setTimeout(() => {
      setExpired(true)
    }, QR_EXPIRY_TIME)

    return () => clearTimeout(timer)
  }, [qrUrl])

  const handleRegenerateQR = async () => {
    try {
      // Reset all states
      setExpired(false)
      setProofData(null)
      setMappedFormData(null)
      setIsSuccess(false)

      // IMPORTANT
      setStatus("pending")

      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

      // Authenticate
      const authRes = await fetch(`${BACKEND}/api/ndi/auth`, {
        method: "POST",
      })

      if (!authRes.ok) {
        throw new Error("NDI authentication failed")
      }

      const authData = await authRes.json()

      // Request proof
      const proofRes = await fetch(`${BACKEND}/api/ndi-verifier/proof-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
        },
      })

      if (!proofRes.ok) {
        throw new Error("Proof request failed")
      }

      const proofData = await proofRes.json()

      const { proofRequestURL, threadId, deepLinkURL } = proofData.data

      // Update state (same as first flow)
      setQrUrl(proofRequestURL)
      setThreadId(threadId)

      // Store session (same as startNdiFlow)
      sessionStorage.setItem(
        "ndiProof",
        JSON.stringify({
          proofRequestURL,
          threadId,
          deepLinkURL,
          role,
          refId,
        })
      )

    } catch (err) {
      console.error("Regenerate failed:", err)
    }
  }

  useEffect(() => {
    // Notify previous page that QR is ready
    if (typeof window !== "undefined") {
      // window.dispatchEvent(new Event("qr-ready"))
    }
  }, [])
  useEffect(() => {
    const stored = sessionStorage.getItem("ndiProof")

    if (stored) {
      const parsed = JSON.parse(stored)

      setQrUrl(parsed.proofRequestURL)
      setThreadId(parsed.threadId)

      setRole(parsed.role)
      setRefId(parsed.refId)

      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handleQrReady = () => {
      setLoading(false)
    }

    // window.addEventListener("qr-ready", handleQrReady)

    return () => {
      window.removeEventListener("qr-ready", handleQrReady)
    }
  }, [])
  // Load stored proof request (only QR info)
  useEffect(() => {
    const stored = sessionStorage.getItem("ndiProof")
    if (stored) {
      const parsed = JSON.parse(stored)
      setQrUrl(parsed.proofRequestURL)
      setThreadId(parsed.threadId)
    }
    // console.log("Loaded stored proof request from session:", { stored, parsed: stored ? JSON.parse(stored) : null })
    const parsed = stored ? JSON.parse(stored) : null
    console.log("Loaded stored proof:", parsed)
  }, [])

  // Poll backend for proof result
  useEffect(() => {
    if (!threadId || status !== 'pending') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/proof-result/${threadId}`)
        const data = await res.json()

        if (res.status === 202) {
          console.log("Proof still pending...")
          return
        }

        if (res.status === 200 && data.status === "COMPLETED" && data.attributes) {
          const ndiAttributes = data.attributes
          console.log("Proof completed with attributes:", ndiAttributes)
          console.log("data", data)
          setProofData(ndiAttributes)
          // const mapped = mapNdiDataToPersonalDetail(ndiAttributes)

          let mapped;
          console.log("Redirect URl", redirectPath)
          if (redirectPath.includes("step=3")) {
            // Co-borrower
            mapped = mapNdiDataToSecurityGuarantor(ndiAttributes);

            sessionStorage.setItem(
              "verifiedSecurityData",
              JSON.stringify(mapped)
            );

            console.log("✅ Stored Security data:", mapped);

          }
          if (redirectPath.includes("step=4")) {
            // Co-borrower
            mapped = mapNdiDataToRepaymentGuarantor(ndiAttributes);

            sessionStorage.setItem(
              "verifiedRepaymentData",
              JSON.stringify(mapped)
            );

            console.log("✅ Stored Repayment Guarantor data:", mapped);

          }
          if (redirectPath.includes("step=2")) {
            // Co-borrower
            mapped = mapNdiDataToCoBorrower(ndiAttributes);
            console.log("co-borrwoer", mapped)

            sessionStorage.setItem(
              "verifiedCoborrowerData",
              JSON.stringify(mapped)
            );

            console.log("✅ Stored CoBorrower data:", mapped);

          }
          else {
            // Applicant (default step=1)
            console.log("mapping applicant details")
            mapped = mapNdiDataToPersonalDetail(ndiAttributes);

            sessionStorage.setItem(
              "verifiedCustomerData",
              JSON.stringify(mapped)
            );

            console.log("✅ Stored Applicant data:", mapped);
          }
          setMappedFormData(mapped)
          console.log("Mapped form data:", mapped)

          try {
            const ndiAttributes = data.attributes

            const dynamicRefId = ndiAttributes['ID Number']
            setRefId(dynamicRefId)

            await storeNDIScan(role, dynamicRefId, {
              ...data,
              scanCount: data.scanCount,
              receivedAt: data.receivedAt,
              refId: dynamicRefId,
              role
            })
            console.log("data to save", data)
            console.log("Saved to IndexedDB:", { role, refId })
            // loading the stored NDI data from IndexedDB to session for retrieval in the next page
            try {
              const latestNDIData = await getNDIDataByRef(dynamicRefId)
              console.log('refId for retrieval:', dynamicRefId)
              console.log("LatestNDI data fetched", latestNDIData)

              if (latestNDIData) {
                console.log("✅ Loaded from IndexedDB:", latestNDIData)

                const ndiAttributes = latestNDIData.attributes || latestNDIData

                console.log("✅ Extracted attributes:", ndiAttributes)

                const mapped = mapNdiDataToPersonalDetail(ndiAttributes)

                // 🔥 STORE INTO SESSION (THIS IS WHAT YOUR FORM USES)
                sessionStorage.setItem(
                  "verifiedCustomerData",
                  JSON.stringify(mapped)
                )

                console.log("✅ Stored in session as verifiedCustomerData:", mapped)
              } else {
                console.warn("⚠️ No data found in IndexedDB for refId:", dynamicRefId)
              }
            } catch (err) {
              console.log("refId and role used to fetch:", dynamicRefId, role)
              console.error("❌ Failed to load from IndexedDB:", err)
            }

          } catch (err) {
            console.error("IndexedDB save failed:", err)
          }


          // Save to Supabase (backend route)
          // await fetch(`${BACKEND_URL}/api/ndi/store`, {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({ attributes: ndiAttributes, status: data.status })
          // })

          // const storeRes = await fetch(`${BACKEND_URL}/api/ndi/store`, {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({ attributes: ndiAttributes, status: data.status })
          // })

          // const storeData = await storeRes.json()
          // console.log("Stored in backend:", storeData)

          // Fetch from Supabase to populate form
          // const cid = ndiAttributes["ID Number"]
          // const supabaseRes = await fetch(`${BACKEND_URL}/api/ndi/fetch?cid=${cid}`)
          // const supabaseData = await supabaseRes.json()
          // console.log("Fetched from backend:", supabaseData)

          // if (supabaseData?.data && supabaseData.data.length > 0) {
          // const ndiRecord = supabaseData.data[0]  // because it's an array
          // console.log("NDI record to map:", ndiRecord)
          // const mapped = mapNdiDataToPersonalDetail(ndiRecord)

          // setMappedFormData(mapped)
          // console.log("Mapped form data:", mapped)

          // ✅ Persist for next page
          //   sessionStorage.setItem(
          //     "ndi_mapped_personal_details",
          //     JSON.stringify(mapped)
          //   )
          // } else {
          //   console.error("No NDI data returned from backend:", supabaseData)
          // }


          setStatus('completed')
          setIsSuccess(true)
          clearInterval(interval)

          setTimeout(() => {
            router.push(redirectPath || "/loan-application?step=1")
          }, 2000)
        } else {
          console.error("Unexpected proof result:", data)
        }
      } catch (err) {
        // console.error("Polling error:", err)
        setStatus('error')
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [threadId, status, router])

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

              {isSuccess ? (
                // ✅ Success screen after scan
                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                    <svg
                      className="w-10 h-10 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-green-700">
                    Identity Verified Successfully
                  </h2>
                  <p className="text-gray-600">
                    Redirecting to application form...
                  </p>
                </div>
              ) : expired ? (
                // ⛔ Expired QR
                <div className="flex flex-col items-center py-10 space-y-6">
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 text-center">
                    <p className="text-lg font-semibold text-yellow-700">
                      QR Code Expired
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      The generated QR has expired for security reasons.
                    </p>
                  </div>

                  <button
                    onClick={handleRegenerateQR}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-[#003DA5] text-white hover:bg-blue-800 transition transform hover:rotate-180 duration-500"
                  >
                    <RefreshCw size={24} />
                  </button>

                  <p className="text-sm text-gray-500">
                    Tap to generate a new QR
                  </p>
                </div>
              ) : (
                // 🔵 Original QR UI & Instructions before expiry
                <>
                  <h2 className="text-2xl font-bold text-center">
                    Scan with Bhutan NDI Wallet
                  </h2>
                  <div className="flex flex-col items-center py-6 space-y-4">
                    {qrUrl ? (
                      <div className="p-4 bg-white rounded-xl border-4 border-green-400 shadow-lg">
                        <QRCodeCanvas
                          value={qrUrl}
                          size={260}
                          level="H" />
                        {/* 🔥 Logo overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* <Image
                src="/LOS-lGCIT-X-BIL\images\ndi.png" // 👈 put your NDI logo in public/
                alt="NDI Logo"
                width={60}
                height={60}
                className="bg-white p-2 rounded-md shadow"
              /> */}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Loading QR...</p>
                    )}

                    <div className="space-y-3 text-gray-700 text-left">
                      <p><strong>1.</strong> Open the Bhutan NDI Wallet application.</p>
                      <div>
                        <p><strong>2.</strong> Ensure your wallet contains the verified Foundational credentials</p>
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          {/* <li>Foundational ID VC</li>
                  <li>Phone Number VC</li>
                  <li>Email Address VC</li>
                  <li>Current Address VC</li> */}
                        </ul>
                      </div>
                      <p><strong>3.</strong> Tap <strong>Scan</strong> and scan the QR code.</p>
                      {/* <p><strong>4.</strong> Review and approve the credential sharing request.</p> */}
                    </div>
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


