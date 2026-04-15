"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { startNdiFlow } from "@/lib/startNdiFlow";

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
const [loading, setLoading] = useState(false)
  const handleNewUser = async () => {
  try {
    setLoading(true);
    
    const redirectUrl = await startNdiFlow
    ("/loan-application?step=1",
      "applicant",
      undefined,
      "redirect"

    );
    
    if (typeof redirectUrl === "string") {
  router.push(redirectUrl);
}
  } catch (error) {
    setLoading(false)
    alert("Failed to start NDI verification");
  }
};
//   const handleNewUser = async () => {
//     try {
//       /* --------------------------------------------------
//          1. Authenticate with NDI
//       -------------------------------------------------- */
//       const authRes = await fetch("http://localhost:3001/api/ndi/auth", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       })
// // console.log("authRes:",authRes)
//       if (!authRes.ok) {
//         throw new Error("NDI authentication failed")
//       }

//       const authResult = await authRes.json()
//       const accessToken = authResult?.access_token
//       // console.log( "authResut:", authResult)
//       // console.log("access token:", accessToken)

//       if (!accessToken) {
//         throw new Error("Access token missing from auth response")
//       }

//       /* --------------------------------------------------
//          2. Request Proof
//       -------------------------------------------------- */
//       const proofRes = await fetch(
//         "http://localhost:3001/api/ndi-verifier/proof-request",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       )
//       /* --------------------------------------------------
//         LOG RAW RESPONSE
//       -------------------------------------------------- */
//       // console.log("Proof response status:", proofRes.status)
//       // console.log("Proof response headers:", [...proofRes.headers.entries()])

//       const proofText = await proofRes.text()
//       // console.log("Proof raw response:", proofText)

//       let proofResult
//       try {
//         proofResult = JSON.parse(proofText)
//       } catch {
//         throw new Error("Invalid JSON returned from proof API")
//       }
//       if (!proofRes.ok) {
//         throw new Error("Proof request failed")
//       }
//     if (!proofRes.ok) {
//       throw new Error(
//         `Proof request failed: ${JSON.stringify(proofResult, null, 2)}`
//       )
//     }

//     /* --------------------------------------------------
//                       SUCCESS PATH
//     -------------------------------------------------- */

//     // console.log("Proof request successful:", proofResult)
//       // const proofResult = await proofRes.json()
//       // console.log("Proof Response:",proofResult)

//       // if (!proofResult.success) {
//       //   throw new Error("NDI proof request unsuccessful")
//       // }

//       /* --------------------------------------------------
//          3. Store data & redirect
//       -------------------------------------------------- */
//       sessionStorage.setItem(
//         "ndiProof",
//         JSON.stringify({
//           proofRequestURL: proofResult.data.proofRequestURL,
//           threadId: proofResult.data.threadId,
//           deepLinkURL: proofResult.data.deepLinkURL,
//         })
//       )

//       router.push("/qr-scan")


//     } catch (error) {
//       // console.error("New user flow failed:", error)
//       alert("Failed to start NDI verification")
//     }
//   }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Illustration */}
          <div className="flex justify-center">
            <Image
              src="/carImage.png"
              alt="Car loan approved illustration"
              width={600}
              height={600}
              className="w-full max-w-lg"
            />
          </div>

          {/* Right Login Card */}
          <Card className="shadow-2xl border-gray-200">
            <CardContent className="p-10 space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-36 h-36 relative">
                  <Image
                    src="/logo.png"
                    alt="Bhutan Insurance Limited"
                    width={144}
                    height={144}
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="text-center space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  To proceed, new users can generate a QR code and scan it using the Bhutan NDI app, while existing
                  users can simply enter their mobile number.
                </p>

                <div className="flex gap-4 justify-center pt-4">
                  {/* New User */}
                  <Button
                  disabled={loading}
                    onClick={handleNewUser}
                    variant="outline"
                    className="flex-1 max-w-[200px] border-2 border-[#003DA5] text-[#003DA5] hover:bg-[#003DA5] hover:text-white"
                    size="lg"
                  >
                    New User
                  </Button>

                  {/* Existing User */}
                  <Link href="/verify" className="flex-1 max-w-[200px]">
                    <Button
                      variant="outline"
                      className="w-full border-2 border-[#003DA5] text-[#003DA5] hover:bg-[#003DA5] hover:text-white"
                      size="lg"
                    >
                      Existing User
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-gray-600 pt-4">
                  Click on <span className="text-[#FF9800] font-semibold">New User</span>, if you are a first-time user.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {loading && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#003DA5]" />
        <p className="text-lg font-medium text-gray-700">
          Generating secure QR code...
        </p>
      </div>
    </div>
  )}
    </div>
    
  )
}