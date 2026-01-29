"use client"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Mail, Phone, PlayCircle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createProofRequest, checkProofRequestStatus, type ProofRequestResponse, type ProofRequestStatus } from "@/lib/ndiService"

export default function QRScanPage() {
  const router = useRouter()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [presentationRequestId, setPresentationRequestId] = useState<string>("")
  const [status, setStatus] = useState<'loading' | 'ready' | 'scanning' | 'verified' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [verifiedData, setVerifiedData] = useState<any>(null)

  // Initialize proof request on component mount
  useEffect(() => {
    initializeProofRequest()
  }, [])

  // Poll for verification status
  useEffect(() => {
    if (presentationRequestId && status === 'scanning') {
      const interval = setInterval(async () => {
        try {
          const statusData: ProofRequestStatus = await checkProofRequestStatus(presentationRequestId)
          
          if (statusData.status === 'verified' && statusData.verifiedData) {
            setStatus('verified')
            setVerifiedData(statusData.verifiedData)
            clearInterval(interval)
            
            // Store verified data and redirect to loan application
            sessionStorage.setItem('ndi_verified_data', JSON.stringify(statusData.verifiedData))
            setTimeout(() => {
              router.push('/loan-application')
            }, 2000)
          } else if (statusData.status === 'rejected' || statusData.status === 'expired') {
            setStatus('error')
            setErrorMessage('Verification failed or expired. Please try again.')
            clearInterval(interval)
          }
        } catch (error) {
          console.error('Error checking status:', error)
        }
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(interval)
    }
  }, [presentationRequestId, status, router])

  const initializeProofRequest = async () => {
    try {
      setStatus('loading')
      console.log('Initializing NDI proof request...')
      
      const response: ProofRequestResponse = await createProofRequest()
      console.log('Proof request response:', response)
      
      // Generate QR code URL
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(response.invitationUrl)}`
      console.log('QR Code URL:', qrUrl)
      
      setQrCodeUrl(qrUrl)
      setPresentationRequestId(response.presentationRequestId)
      setStatus('scanning')
      console.log('QR code ready, status set to scanning')
    } catch (error) {
      console.error('Error creating proof request:', error)
      setStatus('error')
      setErrorMessage('Failed to initialize NDI verification. Please try again.')
    }
  }

  const handleRetry = () => {
    initializeProofRequest()
  }

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

          {/* Right QR Card */}
          <Card className="shadow-2xl border-gray-200">
            <CardContent className="p-10 space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-900">Scan with Bhutan NDI Wallet.</h2>

              {/* Status Messages */}
              {status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-[#34D399]" />
                  <p className="text-gray-600">Generating QR code...</p>
                </div>
              )}

              {status === 'verified' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <p className="text-xl font-semibold text-green-600">Verification Successful!</p>
                  <p className="text-gray-600">Redirecting to application form...</p>
                </div>
              )}

              {status === 'error' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <XCircle className="h-16 w-16 text-red-500" />
                  <p className="text-xl font-semibold text-red-600">Verification Failed</p>
                  <p className="text-gray-600 text-center">{errorMessage}</p>
                  <Button onClick={handleRetry} className="bg-[#34D399] hover:bg-[#2bb380]">
                    Try Again
                  </Button>
                </div>
              )}

              {/* QR Code */}
              {(status === 'ready' || status === 'scanning') && (
                <>
                  <div className="flex justify-center py-6">
                    <div className="p-4 bg-white rounded-xl border-4 border-[#34D399] shadow-lg">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="NDI QR Code"
                          width={250}
                          height={250}
                          className="w-64 h-64"
                        />
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center">
                          <Loader2 className="h-12 w-12 animate-spin text-[#34D399]" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status indicator below QR */}
                  {status === 'scanning' && (
                    <div className="flex justify-center -mt-2 mb-4">
                      <div className="bg-[#34D399] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <p className="text-sm font-medium">Waiting for scan...</p>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="space-y-3 text-base text-gray-700">
                    <p>
                      <span className="font-semibold">1.</span> Open Bhutan NDI Wallet on your phone
                    </p>
                    <p>
                      <span className="font-semibold">2.</span> Tap the Scan button located on the menu bar and scan the QR
                      code
                    </p>
                    <p>
                      <span className="font-semibold">3.</span> Review and approve the credential sharing request
                    </p>
                  </div>

                  {/* Video Guide Button */}
                  <Button
                    variant="outline"
                    className="w-full border-2 border-[#34D399] text-[#34D399] hover:bg-[#34D399] hover:text-white transition-colors bg-transparent"
                    size="lg"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch video guide
                  </Button>

                  {/* Download Section */}
                  <div className="text-center space-y-4 pt-4">
                    <p className="text-sm text-gray-700">
                      Don't have the Bhutan NDI Wallet? <span className="text-[#00BCD4] font-semibold">Download Now!</span>
                    </p>

                    <div className="flex gap-4 justify-center">
                      <Image
                        src="/google-play-badge.png"
                        alt="Get it on Google Play"
                        width={135}
                        height={40}
                        className="h-10 w-auto"
                      />
                      <Image
                        src="/app-store-badge.png"
                        alt="Download on App Store"
                        width={135}
                        height={40}
                        className="h-10 w-auto"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Support Section */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-center font-semibold text-[#00BCD4] mb-4 text-lg">Get Support</h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-700">ndifeedback@dhi.bt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-700">1199</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
