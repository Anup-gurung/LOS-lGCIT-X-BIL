import Image from "next/image"

export function Header() {
  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex items-center justify-center py-4">
        <div className="relative">
          <Image
            src="/banner.png"
            alt="Bhutan Insurance Limited Logo"
            width={200}
            height={80}
            className="object-contain"
            priority
          />
        </div>
      </div>
    </header>
  )
}
