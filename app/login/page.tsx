import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
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
                  <Link href="/qr-scan" className="flex-1 max-w-[200px]">
                    <Button
                      variant="outline"
                      className="w-full border-2 border-[#003DA5] text-[#003DA5] hover:bg-[#003DA5] hover:text-white bg-transparent"
                      size="lg"
                    >
                      New User
                    </Button>
                  </Link>
                  <Link href="/verify" className="flex-1 max-w-[200px]">
                    <Button
                      variant="outline"
                      className="w-full border-2 border-[#003DA5] text-[#003DA5] hover:bg-[#003DA5] hover:text-white bg-transparent"
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
    </div>
  )
}
