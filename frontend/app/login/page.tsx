"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setOauthLoading(true)
      const response = await fetch("/api/oauth/google")
      const data = await response.json()
      if (data.success && data.data.authUrl) {
        window.location.href = data.data.authUrl
      } else {
        toast.error("Failed to initiate Google login")
        setOauthLoading(false)
      }
    } catch {
      toast.error("An error occurred. Please try again.")
      setOauthLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    try {
      setOauthLoading(true)
      const response = await fetch("/api/oauth/github")
      const data = await response.json()
      if (data.success && data.data.authUrl) {
        window.location.href = data.data.authUrl
      } else {
        toast.error("Failed to initiate GitHub login")
        setOauthLoading(false)
      }
    } catch {
      toast.error("An error occurred. Please try again.")
      setOauthLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || "Failed to login")
        setIsLoading(false)
        return
      }

      localStorage.setItem("accessToken", data.data.accessToken)
      toast.success("Logged in successfully!")
      window.location.href = "/dashboard"
    } catch {
      toast.error("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(rgba(255,255,255,0.75),rgba(255,255,255,0.75)),url('/design/BG%2023-01%202.png')] bg-cover bg-center text-[#212121]">
      <header className="border-b border-[#e9e9e9] px-4 py-4 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-2">
          <Link href="/" className="text-xl font-extrabold text-[#fb6503] sm:text-2xl">PublishType</Link>
          <p className="text-[12px] text-[#4d4d4d] sm:text-sm">Don&apos;t have an account? <Link href="/signup" className="font-bold italic text-[#fb6503]">Signup</Link></p>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1360px] items-center justify-center px-4 py-7 sm:py-10 md:py-14">
        <div className="w-full max-w-[520px] rounded-[28px] border border-[#e9e9e9] bg-[rgba(255,255,255,0.62)] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.06)] backdrop-blur-[15px] sm:p-6">
          <div className="text-center">
            <h1 className="text-[34px] font-bold leading-tight sm:text-4xl">Welcome Back</h1>
            <p className="mt-1 text-[14px] text-[#4d4d4d] sm:text-base">Log in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:mt-6">
            <div>
              <label className="text-sm font-semibold sm:text-base">Email</label>
              <input
                type="email"
                placeholder="hello@chainex.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 h-12 w-full rounded-full border border-black/10 bg-[#fffdf9] px-4 text-[14px] placeholder:text-[#a5a7a7] outline-none sm:h-14 sm:text-base"
              />
            </div>

            <div>
              <label className="text-sm font-semibold sm:text-base">Password</label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 w-full rounded-full border border-black/10 bg-[#fffdf9] px-4 pr-12 text-[14px] placeholder:text-[#a5a7a7] outline-none sm:h-14 sm:text-base"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6a6a6a]">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-[12px] tracking-[0.03em] text-[#6a6a6a] sm:text-sm">
                <input type="checkbox" className="h-4 w-4 rounded border-2 border-black/50" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-[12px] tracking-[0.03em] text-[#6a6a6a] underline sm:text-sm">Forgot Password</Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#fb6503] text-[15px] font-bold text-[#fffefd] sm:h-14 sm:text-base"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3 sm:mt-5">
            <div className="h-px flex-1 bg-[#e9e9e9]" />
            <p className="text-[13px] tracking-[0.03em] sm:text-base">or continue with</p>
            <div className="h-px flex-1 bg-[#e9e9e9]" />
          </div>

          <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={oauthLoading}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-[#fffdf9] text-[14px] text-black/60 sm:h-12 sm:text-base"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google" />
              Signup with Google
            </button>
            <button
              onClick={handleGitHubLogin}
              disabled={oauthLoading}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-[#fffdf9] text-[14px] text-black/60 sm:h-12 sm:text-base"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.387.6.11.82-.261.82-.577v-2.234c-3.338.724-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.776.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.304-.536-1.527.117-3.176 0 0 1.008-.322 3.301 1.23A11.52 11.52 0 0112 6.844c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.872.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.804 5.624-5.476 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.218.694.825.576C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" /></svg>
              Sign up with Apple
            </button>
          </div>

          <p className="mt-5 text-center text-[13px] tracking-[0.03em] text-[#4d4d4d] sm:mt-6 sm:text-base">
            Don&apos;t have an account yet? <Link href="/signup" className="font-medium text-[#1e1e1e]">Create Account</Link>
          </p>
        </div>
      </main>

      <footer className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 pb-5 text-[12px] text-[#4d4d4d] sm:px-6 sm:text-sm md:px-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Term & Condition</Link>
        </div>
        <p>© 2025 PublishType. All Rights Reserved.</p>
      </footer>
    </div>
  )
}
