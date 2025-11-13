"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const slides = [
  {
    title: "YOUR FINANCIAL SECURITY",
    highlight: "IS OUR PRIORITY",
    description:
      "Experience faster approvals, secure processing, and transparent loan management all at your fingertips.",
    images: ["/house-with-keys-on-table.jpg", "/luxury-car-at-sunset.jpg", "/gold-bars-and-money-stack.jpg"],
  },
  {
    title: "QUICK LOAN APPROVALS",
    highlight: "MADE SIMPLE",
    description: "Get your loan approved in minutes with our streamlined digital process.",
    images: [
      "/approved-document-with-stamp.jpg",
      "/person-signing-digital-document.jpg",
      "/happy-customer-with-thumbs-up.jpg",
    ],
  },
  {
    title: "SECURE & TRANSPARENT",
    highlight: "LOAN MANAGEMENT",
    description: "Track your application status and manage your loans with complete transparency.",
    images: ["/security-shield-icon.png", "/mobile-banking-app.png", "/financial-analytics-dashboard.png"],
  },
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="relative bg-white overflow-hidden border-b">
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-gray-900">
              {slides[currentSlide].title}
              <br />
              <span className="text-[#FF9800]">{slides[currentSlide].highlight}</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">{slides[currentSlide].description}</p>
            <div className="bg-[#003DA5] text-white px-8 py-5 rounded-lg inline-block shadow-md">
              <p className="text-base lg:text-lg font-medium leading-relaxed">
                Apply for your loan anytime, anywhere with BIL's new Digital Loan System.
              </p>
            </div>
          </div>

          {/* Right Images */}
          <div className="relative flex gap-4 justify-center lg:justify-end items-center h-[400px]">
            {slides[currentSlide].images.map((image, idx) => (
              <div
                key={idx}
                className="relative rounded-xl overflow-hidden shadow-2xl transition-transform hover:scale-105"
                style={{
                  width: idx === 1 ? "220px" : "190px",
                  height: idx === 1 ? "320px" : "270px",
                  transform: idx === 1 ? "translateY(0)" : idx === 0 ? "translateY(25px)" : "translateY(-25px)",
                }}
              >
                <Image src={image || "/placeholder.svg"} alt={`Slide ${idx + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Slider Controls */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <Button variant="ghost" size="icon" onClick={prevSlide} className="rounded-full hover:bg-gray-100">
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </Button>

          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  currentSlide === index ? "w-8 bg-[#003DA5]" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <Button variant="ghost" size="icon" onClick={nextSlide} className="rounded-full hover:bg-gray-100">
            <ChevronRight className="h-6 w-6 text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  )
}
