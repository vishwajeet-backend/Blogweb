"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any
  }
}

export type PlanType = 'STARTER' | 'CREATOR' | 'PROFESSIONAL'
export type BillingPeriod = 'monthly' | 'annual'

// Plan pricing in INR for display
export const PLAN_PRICING_DISPLAY = {
  STARTER: {
    monthly: { inr: 5000 },
    annual: { inr: 40000 },
  },
  CREATOR: {
    monthly: { inr: 15000 },
    annual: { inr: 150000 },
  },
  PROFESSIONAL: {
    monthly: { inr: 20000 },
    annual: { inr: 180000 },
  },
}

export const PLAN_NAMES: Record<PlanType, string> = {
  STARTER: 'Starter',
  CREATOR: 'Creator',
  PROFESSIONAL: 'Professional',
}

interface UseRazorpayReturn {
  loading: PlanType | null
  initiatePayment: (plan: PlanType, billingPeriod: BillingPeriod) => Promise<void>
}

export function useRazorpay(): UseRazorpayReturn {
  const [loading, setLoading] = useState<PlanType | null>(null)
  const router = useRouter()

  // Load Razorpay script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const initiatePayment = async (plan: PlanType, billingPeriod: BillingPeriod) => {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      toast.error('Please login to subscribe')
      router.push('/login?redirect=/pricing')
      return
    }

    setLoading(plan)

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway')
        setLoading(null)
        return
      }

      // Create order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan,
          billingPeriod,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.error || 'Failed to create order')
        setLoading(null)
        return
      }

      // Configure Razorpay options
      const options = {
        key: data.data.keyId,
        amount: data.data.amount,
        currency: data.data.currency,
        name: 'PublishType',
        description: `${PLAN_NAMES[plan]} Plan - ${billingPeriod === 'annual' ? 'Annual' : 'Monthly'} Subscription`,
        order_id: data.data.orderId,
        handler: async function (response: any) {
          // Verify payment
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              toast.success('Payment successful! Your subscription is now active.')
              // Refresh to update user data
              window.location.reload()
            } else {
              toast.error(verifyData.error || 'Payment verification failed')
            }
          } catch (error) {
            toast.error('Payment verification failed')
          }
          setLoading(null)
        },
        prefill: {
          name: data.data.prefill.name,
          email: data.data.prefill.email,
        },
        theme: {
          color: '#1f3529',
        },
        modal: {
          ondismiss: function () {
            setLoading(null)
          },
        },
      }

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error('Failed to initiate payment')
      setLoading(null)
    }
  }

  return {
    loading,
    initiatePayment,
  }
}
