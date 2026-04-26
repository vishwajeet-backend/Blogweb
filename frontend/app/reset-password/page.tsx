"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { toast } from "sonner"
import { ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link')
      router.push('/forgot-password')
    }
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' })
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' })
      setIsLoading(false)
      return
    }

    if (!/[A-Z]/.test(password)) {
      setErrors({ password: 'Password must contain at least one uppercase letter' })
      setIsLoading(false)
      return
    }

    if (!/[0-9]/.test(password)) {
      setErrors({ password: 'Password must contain at least one number' })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to reset password')
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      toast.success('Password reset successfully!')
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (!token) return null

  return (
    <div className="min-h-screen bg-[linear-gradient(rgba(255,255,255,0.75),rgba(255,255,255,0.75)),url('/design/BG%2023-01%202.png')] bg-cover bg-center text-[#212121]">
      <header className="border-b border-[#e9e9e9] px-4 py-4 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="h-7 w-7 rounded-md bg-[#FF7A33]" />
            <span className="text-xl font-extrabold text-[#1a1a1a] sm:text-2xl">PublishType</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1360px] flex-1 items-center justify-center px-4 py-7 sm:py-10 md:py-14">
        <div className="w-full max-w-[540px] rounded-[28px] border border-[#e9e9e9] bg-[rgba(255,255,255,0.65)] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.06)] backdrop-blur-[15px] sm:p-6">
          {isSuccess ? (
            <div className="py-6 text-center sm:py-8">
              <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(34,197,94,0.1)] text-[#22c55e]">
                <CheckCircle2 size={40} strokeWidth={2.5} />
              </div>
              <h1 className="mb-3 text-[30px] font-extrabold text-[#1a1a1a] sm:text-[32px]">Password Reset!</h1>
              <p className="mx-auto mb-7 max-w-[460px] text-[14px] leading-7 text-[#666] sm:text-base">
                Your password has been successfully updated. You can now use your new password to log in.
              </p>
              <Link href="/login" className="inline-block rounded-full bg-[#FF7A33] px-10 py-3 text-[15px] font-extrabold text-white no-underline shadow-[0_8px_25px_rgba(255,122,51,0.3)]">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-[34px] font-bold leading-tight sm:text-4xl">Set New Password</h1>
                <p className="mt-2 text-[14px] leading-6 text-[#666] sm:text-[15px]">
                  Choose a strong password that you haven&apos;t used before.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
                <div>
                  <label className="mb-1 block text-[12px] font-extrabold uppercase tracking-[0.05em] text-[#1a1a1a]">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`h-12 w-full rounded-full border bg-[#f9f9f9] px-5 pr-12 text-[14px] outline-none sm:h-14 ${errors.password ? "border-[#FF4B2B]" : "border-[#eee]"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 border-none bg-transparent text-[#999]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="ml-3 mt-1 text-[11px] font-bold text-[#FF4B2B]">{errors.password}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-extrabold uppercase tracking-[0.05em] text-[#1a1a1a]">Confirm New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`h-12 w-full rounded-full border bg-[#f9f9f9] px-5 text-[14px] outline-none sm:h-14 ${errors.confirmPassword ? "border-[#FF4B2B]" : "border-[#eee]"}`}
                  />
                  {errors.confirmPassword && <p className="ml-3 mt-1 text-[11px] font-bold text-[#FF4B2B]">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FF7A33] text-[15px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,122,51,0.3)] sm:h-14 sm:text-base">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
                </button>

                <Link href="/login" className="mt-5 inline-flex w-full items-center justify-center gap-2 text-[13px] font-bold text-[#999] no-underline sm:text-[14px]">
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 size={40} className="animate-spin text-[#FF7A33]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
