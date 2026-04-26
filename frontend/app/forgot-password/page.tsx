"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      await response.json()
      setIsSubmitted(true)
    } catch (error) {
      setIsSubmitted(true)
    } finally {
      setIsLoading(false)
    }
  }

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
          {isSubmitted ? (
            <div className="py-6 text-center sm:py-8">
              <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(255,122,51,0.1)] text-[#FF7A33]">
                <MailCheck size={40} strokeWidth={2} />
              </div>
              <h1 className="mb-3 text-[30px] font-extrabold text-[#1a1a1a] sm:text-[32px]">Check your email</h1>
              <p className="mx-auto mb-7 max-w-[460px] text-[14px] leading-7 text-[#666] sm:text-base">
                We've sent reset instructions to <strong>{email}</strong>. If an account exists, you'll receive a link shortly.
              </p>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 text-[15px] font-extrabold text-[#FF7A33] no-underline">
                <ArrowLeft size={18} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-[34px] font-bold leading-tight sm:text-4xl">Reset Password</h1>
                <p className="mt-2 text-[14px] leading-6 text-[#666] sm:text-[15px]">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
                <div>
                  <label className="mb-1 block text-[12px] font-extrabold uppercase tracking-[0.05em] text-[#1a1a1a]">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 w-full rounded-full border border-[#eee] bg-[#f9f9f9] px-5 text-[14px] outline-none sm:h-14"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FF7A33] text-[15px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,122,51,0.3)] sm:h-14 sm:text-base"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
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
