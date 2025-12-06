import Image from "next/image"

export function Header() {
  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="relative">
          <Image
            src="/logo.png"
            alt="BIL Logo"
            width={80}
            height={60}
            className="object-contain"
            priority
          />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 whitespace-nowrap">
            BIL - Loan Origination System
          </h1>
        </div>
        <div className="w-[120px]"></div>
      </div>
    </header>
  )
}
