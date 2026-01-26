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
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-gray-900">
              {slides[currentSlide].title}
              <br />
              <span className="text-[#FF9800]">{slides[currentSlide].highlight}</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl leading-relaxed">{slides[currentSlide].description}</p>
            <div className="bg-[#003DA5] text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 rounded-lg inline-block shadow-md">
              <p className="text-sm sm:text-base lg:text-lg font-medium leading-relaxed">
                Apply for your loan anytime, anywhere with BIL's new Digital Loan System.
              </p>
            </div>
          </div>

          {/* Right Images */}
          <div className="relative flex gap-2 sm:gap-3 lg:gap-4 justify-center lg:justify-end items-center h-[280px] sm:h-[350px] lg:h-[400px]">
            {slides[currentSlide].images.map((image, idx) => (
              <div
                key={idx}
                className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-xl sm:shadow-2xl transition-transform hover:scale-105"
                style={{
                  width: idx === 1 ? "calc(33% + 10px)" : "30%",
                  height: idx === 1 ? "85%" : "70%",
                  transform: idx === 1 ? "translateY(0)" : idx === 0 ? "translateY(15%)" : "translateY(-15%)",
                }}
              >
                <Image 
                  src={image || "/placeholder.svg"} 
                  alt={`Slide ${idx + 1}`} 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 640px) 30vw, (max-width: 1024px) 25vw, 220px"
                  priority={idx === 1}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Slider Controls */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 lg:mt-10">
          <Button variant="ghost" size="icon" onClick={prevSlide} className="rounded-full hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10">
            <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
          </Button>

          <div className="flex gap-1.5 sm:gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 sm:h-2.5 rounded-full transition-all ${
                  currentSlide === index ? "w-6 sm:w-8 bg-[#003DA5]" : "w-2 sm:w-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <Button variant="ghost" size="icon" onClick={nextSlide} className="rounded-full hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10">
            <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  )
}
