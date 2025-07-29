import { Leaf, Sparkles } from "lucide-react"

export function LoadingIndicator() {
  return (
    <div className="flex gap-4 justify-start group">
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 relative">
        <Leaf className="h-5 w-5 text-white" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-pulse">
          <Sparkles className="h-2 w-2 text-white" />
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-3xl px-6 py-2 border border-white/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-white/80">Analyzing with AI...</span>
        </div>
      </div>
    </div>
  )
}
