import { Header } from "@/components/header"
import { HeroSlider } from "@/components/hero-slider"
import { Card, CardContent } from "@/components/ui/card"
import { User, Building2, FileSearch, FileEdit } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroSlider />

      {/* Action Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Link href="/loan-application">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-gray-200">
              <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-[#003DA5] flex items-center justify-center">
                  <User className="w-12 h-12 text-[#003DA5]" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Individual</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/login">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-gray-200">
              <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-[#003DA5] flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-[#003DA5]" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Business</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/track">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-gray-200">
              <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-[#003DA5] flex items-center justify-center">
                  <FileSearch className="w-12 h-12 text-[#003DA5]" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Track My Application</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/resume">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-gray-200">
              <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-[#003DA5] flex items-center justify-center">
                  <FileEdit className="w-12 h-12 text-[#003DA5]" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Resume Application</h3>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
