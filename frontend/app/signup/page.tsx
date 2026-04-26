"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSignupComplete, setIsSignupComplete] = useState(false)

  const handleGoogleSignup = async () => {
    try {
      setOauthLoading(true)
      const response = await fetch('/api/oauth/google')
      const data = await response.json()

      if (data.success && data.data.authUrl) {
        window.location.href = data.data.authUrl
      } else {
        toast.error('Failed to initiate Google signup')
        setOauthLoading(false)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      setOauthLoading(false)
    }
  }

  const handleGitHubSignup = async () => {
    try {
      setOauthLoading(true)
      const response = await fetch('/api/oauth/github')
      const data = await response.json()

      if (data.success && data.data.authUrl) {
        window.location.href = data.data.authUrl
      } else {
        toast.error('Failed to initiate GitHub signup')
        setOauthLoading(false)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      setOauthLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setIsLoading(false)
        if (data.details) {
          const errorMap: Record<string, string> = {}
          data.details.forEach((error: any) => {
            errorMap[error.path[0]] = error.message
          })
          setErrors(errorMap)
          toast.error('Please fix the validation errors')
        } else {
          toast.error(data.error || 'Failed to create account')
        }
        return
      }

      setIsLoading(false)
      setIsSignupComplete(true)
      toast.success('Account created successfully! Please check your email to verify.')
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(rgba(255,255,255,0.75),rgba(255,255,255,0.75)),url('/design/BG%2023-01%202.png')] bg-cover bg-center text-[#212121]">
      <header className="border-b border-[#e9e9e9] px-4 py-4 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="h-7 w-7 rounded-md bg-[#FF7A33]" />
            <span className="text-xl font-extrabold text-[#1a1a1a] sm:text-2xl">PublishType</span>
          </Link>
          <p className="text-[12px] text-[#666] sm:text-sm">
            Already have an account? <Link href="/login" className="font-bold text-[#FF7A33] no-underline">Login</Link>
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1360px] flex-1 items-center justify-center px-4 py-7 sm:py-10 md:py-14">
        <div className="w-full max-w-[580px] rounded-[28px] border border-[#e9e9e9] bg-[rgba(255,255,255,0.65)] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.06)] backdrop-blur-[15px] sm:p-6">
          {isSignupComplete ? (
            <div className="py-8 text-center sm:py-10">
              <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(34,197,94,0.1)] text-[#22c55e]">
                <CheckCircle2 size={40} strokeWidth={2.5} />
              </div>
              <h1 className="mb-3 text-[30px] font-extrabold text-[#1a1a1a] sm:text-[32px]">Check your email</h1>
              <p className="mx-auto mb-7 max-w-[460px] text-[14px] leading-7 text-[#666] sm:text-base">
                We've sent a verification link to <strong>{email}</strong>. Please verify your email to activate your account.
              </p>
              <Link href="/login" className="inline-block rounded-full bg-[#FF7A33] px-10 py-3 text-[15px] font-extrabold text-white no-underline shadow-[0_8px_25px_rgba(255,122,51,0.3)]">
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-[34px] font-bold leading-tight sm:text-4xl">Create Account</h1>
                <p className="mt-1 text-[14px] text-[#666] sm:text-[15px]">Start your journey with PublishType</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left sm:mt-6">
                <div>
                  <label className="mb-1 block text-[12px] font-extrabold uppercase tracking-[0.05em] text-[#1a1a1a]">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={`h-12 w-full rounded-full border bg-[#f9f9f9] px-5 text-[14px] outline-none sm:h-14 ${errors.name ? "border-[#FF4B2B]" : "border-[#eee]"}`}
                  />
                  {errors.name && <p className="ml-3 mt-1 text-[11px] font-bold text-[#FF4B2B]">{errors.name}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-extrabold uppercase tracking-[0.05em] text-[#1a1a1a]">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`h-12 w-full rounded-full border bg-[#f9f9f9] px-5 text-[14px] outline-none sm:h-14 ${errors.email ? "border-[#FF4B2B]" : "border-[#eee]"}`}
                  />
                  {errors.email && <p className="ml-3 mt-1 text-[11px] font-bold text-[#FF4B2B]">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div>
                    <label className="mb-1 block text-[12px] font-extrabold uppercase tracking-[0.05em] text-[#1a1a1a]">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={`h-12 w-full rounded-full border bg-[#f9f9f9] px-5 pr-12 text-[14px] outline-none sm:h-14 ${errors.password ? "border-[#FF4B2B]" : "border-[#eee]"}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-extrabold uppercase tracking-[0.05em] text-[#1a1a1a]">Confirm Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`h-12 w-full rounded-full border bg-[#f9f9f9] px-5 text-[14px] outline-none sm:h-14 ${errors.confirmPassword ? "border-[#FF4B2B]" : "border-[#eee]"}`}
                    />
                  </div>
                </div>
                {(errors.password || errors.confirmPassword) && (
                  <p className="ml-3 -mt-2 text-[11px] font-bold text-[#FF4B2B]">{errors.password || errors.confirmPassword}</p>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="border-none bg-transparent text-[12px] font-bold text-[#999]">
                    {showPassword ? "Hide Passwords" : "Show Passwords"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FF7A33] text-[15px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,122,51,0.3)] sm:h-14 sm:text-base">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                </button>
              </form>

              <div className="relative my-6 text-center sm:my-8">
                <div className="absolute left-0 right-0 top-1/2 border-t border-[#eee]" />
                <span className="relative bg-white px-4 text-[12px] font-bold text-[#999] sm:text-[13px]">or signup with</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4">
                <button
                  onClick={handleGoogleSignup}
                  disabled={oauthLoading}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#eee] bg-white text-[14px] font-bold sm:h-12">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google" />
                  Google
                </button>
                <button
                  onClick={handleGitHubSignup}
                  disabled={oauthLoading}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#eee] bg-white text-[14px] font-bold sm:h-12">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 4.802 3.116 8.872 7.423 10.3c.6.11.819-.26.819-.578v-2.132c-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                  GitHub
                </button>
              </div>

              <p className="mt-6 text-center text-[12px] leading-6 text-[#999] sm:mt-8 sm:text-[13px]">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="font-extrabold text-[#666] no-underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="font-extrabold text-[#666] no-underline">Privacy Policy</Link>
              </p>
            </>
          )}
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 pb-5 text-[12px] text-[#999] sm:px-6 sm:text-[13px] md:px-10">
        <div className="flex gap-4 sm:gap-6">
          <Link href="/privacy" className="font-semibold text-[#999] no-underline">Privacy Policy</Link>
          <Link href="/terms" className="font-semibold text-[#999] no-underline">Term & Condition</Link>
        </div>
        <p className="m-0 font-semibold text-[#999]">
          © {new Date().getFullYear()} PublishType. All Rights Reserved.
        </p>
      </footer>
    </div>
  )
}
