"use client"
import Image from "next/image"

export function Header() {
  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="relative flex-shrink-0">
          <Image
            src="/logo.png"
            alt="BIL Logo"
            width={60}
            height={45}
            className="object-contain sm:w-[80px] sm:h-[60px]"
            priority
          />
        </div>
        <div className="flex-1 flex justify-center px-2 sm:px-4">
          <h1 className="text-sm sm:text-lg md:text-2xl font-bold text-gray-800 text-center leading-tight">
            <span className="hidden sm:inline">BIL - Loan Origination System</span>
            <span className="sm:hidden">BIL - LOS</span>
          </h1>
        </div>
        <div className="w-[60px] sm:w-[80px] flex-shrink-0"></div>
      </div>
    </header>
  )
}
