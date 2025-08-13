import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <span className="font-semibold text-lg text-gray-900">HeyBonita.ai</span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
          Features
        </a>
        <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
          Pricing
        </a>
        <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
          About
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium">
          Sign In
        </Button>
        <Button className="bg-red-500 hover:bg-red-600 text-white font-medium px-6">Get Started</Button>
      </div>
    </header>
  )
}
