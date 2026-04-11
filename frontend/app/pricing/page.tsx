"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Plus } from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"
import { toast } from "sonner"

declare global {
  interface Window {
    Razorpay: any
  }
}

const plans = [
  {
    id: "STARTER" as const,
    name: "Starter Plan",
    monthlyPrice: 5000,
    annualPrice: 40000,
    featured: false,
    points: ["15,000 words/month", "5 blog templates", "15 images/month", "Basic SEO tools", "Email support"],
  },
  {
    id: "CREATOR" as const,
    name: "Creator Plan",
    monthlyPrice: 15000,
    annualPrice: 150000,
    featured: true,
    points: ["15,000 words/month", "5 blog templates", "15 images/month", "Basic SEO tools", "Email support"],
  },
  {
    id: "PROFESSIONAL" as const,
    name: "Professional Plan",
    monthlyPrice: 20000,
    annualPrice: 180000,
    featured: false,
    points: ["15,000 words/month", "5 blog templates", "15 images/month", "Basic SEO tools", "Email support"],
  },
]

const faqs = [
  "What is AIMy Blogs?",
  "Do I need writing experience to use AIMy Blogs?",
  "Can I publish directly to WordPress or Medium?",
  "Does AIMy Blogs support SEO optimization?",
  "Can I generate blog images using AIMy Blogs?",
  "Can I rewrite or improve my existing blog content?",
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async (planKey: "STARTER" | "CREATOR" | "PROFESSIONAL") => {
    if (!user) {
      toast.error("Please login to subscribe")
      router.push("/login?redirect=/pricing")
      return
    }

    setLoading(planKey)
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway")
        setLoading(null)
        return
      }

      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: planKey,
          billingPeriod,
        }),
      })

      const data = await response.json()
      if (!data.success) {
        toast.error(data.error || "Failed to create order")
        setLoading(null)
        return
      }

      const options = {
        key: data.data.keyId,
        amount: data.data.amount,
        currency: data.data.currency,
        name: "PublishType",
        description: `${planKey} Plan - ${billingPeriod === "annual" ? "Annual" : "Monthly"} Subscription`,
        order_id: data.data.orderId,
        handler: async function (res: any) {
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
              }),
            })

            const verifyData = await verifyResponse.json()
            if (verifyData.success) {
              toast.success("Payment successful! Your subscription is now active.")
              router.push("/dashboard")
              setTimeout(() => window.location.reload(), 1000)
            } else {
              toast.error(verifyData.error || "Payment verification failed")
            }
          } catch {
            toast.error("Payment verification failed")
          }
          setLoading(null)
        },
        prefill: {
          name: data.data.prefill.name,
          email: data.data.prefill.email,
        },
        theme: { color: "#FB6503" },
        modal: { ondismiss: () => setLoading(null) },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch {
      toast.error("Failed to initiate payment")
      setLoading(null)
    }
  }

  const handleStart = () => {
    router.push(user ? "/dashboard" : "/signup")
  }

  return (
    <div className="bg-[#fffefd] text-[#171717]">
      <section className="bg-[linear-gradient(rgba(255,254,253,0.88),rgba(255,254,253,0.88)),url('/design/BG%2023-01%202.png')] bg-cover bg-center px-4 pb-16 pt-20 md:px-8 md:pb-20 md:pt-24">
        <div className="mx-auto max-w-[1180px]">
          <div className="text-center">
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Simple, Transparent <span className="font-medium italic text-[#4d4d4d]">Pricing</span>
            </h1>
            <p className="mx-auto mt-3 max-w-[700px] text-sm font-medium text-[#4d4d4d] md:text-base">
              Choose the plan that fits your needs. No hidden fees, cancel anytime.
            </p>

            <div className="mt-8 inline-flex items-center gap-5">
              <span className="text-sm font-medium text-[#212121]">Monthly</span>
              <button
                type="button"
                onClick={() => setBillingPeriod((prev) => (prev === "monthly" ? "annual" : "monthly"))}
                className="relative h-6 w-11 rounded-full bg-[#efefef] p-0.5"
              >
                <span className={billingPeriod === "monthly" ? "block h-5 w-5 rounded-full bg-white shadow transition-all" : "ml-auto block h-5 w-5 rounded-full bg-white shadow transition-all"} />
              </button>
              <span className="text-sm font-medium text-[#212121]">Annual <span className="text-[#fc8435]">-20%</span></span>
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const isLoading = loading === plan.id
              const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.annualPrice

              return (
                <article key={plan.id} className="overflow-hidden rounded-[28px] border border-[#e9e9e9] bg-[#fffefd]">
                  <div className={plan.featured ? "bg-[#fb6503] p-5 text-white" : "bg-gradient-to-b from-[#fff9f1] to-[#fff7ed] p-5 text-[#1e1e1e]"}>
                    <p className="text-sm font-bold">{plan.name}</p>
                    <p className="mt-3 text-3xl font-bold">
                      ₹{price.toLocaleString("en-IN")}/<span className={plan.featured ? "text-sm text-white" : "text-sm text-[#6a6a6a]"}>{billingPeriod === "monthly" ? "Month" : "Year"}</span>
                    </p>
                    <button
                      onClick={() => handlePayment(plan.id)}
                      disabled={isLoading}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#e9e9e9] bg-white px-5 py-2 text-sm font-bold text-[#171717]"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Started"}
                    </button>
                  </div>

                  <div className="space-y-3 bg-[#fffbf7] p-5">
                    {plan.points.map((point) => (
                      <div key={point} className="flex items-center gap-2 text-sm font-medium text-black">
                        <Check className="h-4 w-4 text-black" />
                        <span>{point}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#e9e9e9] pt-3 text-sm font-bold text-[#212121]">Perfect for Individuals.</div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-full border border-[#e9e9e9] bg-white px-6 py-4">
            <div>
              <p className="text-2xl font-medium">Need a custom solution?</p>
              <p className="text-sm text-[#4d4d4d]">Contact us for enterprise-grade features, custom integrations, and dedicated support.</p>
            </div>
            <button className="rounded-full bg-[#fb6503] px-8 py-2 text-sm font-bold text-white">Contact Us</button>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-4xl font-bold md:text-5xl">
            Frequently Asked <span className="font-medium italic text-[#4d4d4d]">Questions</span>
          </h2>

          <div className="mt-7 space-y-2">
            {faqs.map((q, idx) => {
              const open = openFaq === idx
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : idx)}
                  className="w-full border-b border-[#e9e9e9] px-2 py-3 text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-2xl font-medium">{idx + 1}. {q}</p>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#212121]"><Plus className={open ? "h-4 w-4 rotate-45" : "h-4 w-4"} /></span>
                  </div>
                  {open && <p className="mt-3 max-w-3xl text-sm text-[#4d4d4d]">AIMy Blogs helps you create, optimize, and publish quality content with AI-powered assistance.</p>}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 pt-8 text-center md:px-8">
        <h3 className="text-4xl font-bold">Ready to elevate your content ?</h3>
        <p className="mt-2 text-sm text-[#4d4d4d]">Join thousands of creators and brands automating their growth today.</p>
        <button onClick={handleStart} className="mt-5 rounded-full bg-[#fb6503] px-10 py-3 text-sm font-bold text-white">GET STARTED NOW</button>
        <p className="mt-2 text-xs text-[#999]">No credit card required for free plan</p>
      </section>
    </div>
  )
}
