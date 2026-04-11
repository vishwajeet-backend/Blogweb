"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BarChart3, BookOpen, Check, Clock3, Facebook, Linkedin, Minus, Plus, Send, Users, Twitter } from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"

const steps = [
  {
    id: "01",
    title: "Connect Your Platforms",
    description: "Connect WordPress, Medium, Ghost, LinkedIn and more using simple setup.",
  },
  {
    id: "02",
    title: "Generate AI Blogs",
    description: "Pick a topic, select tone and length, and let AI create a structured blog instantly.",
  },
  {
    id: "03",
    title: "Optimize for SEO",
    description: "Get readability score, keyword ideas, and better heading suggestions.",
  },
  {
    id: "04",
    title: "Publish + Track Results",
    description: "Schedule or publish instantly, then track performance from your dashboard.",
  },
]

const featureCards = [
  {
    title: "Real-time Blog Generation",
    description: "Generate complete blogs with a strong structure: intro, sections, CTA, and conclusion.",
    icon: Clock3,
    highlight: true,
  },
  {
    title: "Smart SEO + Readability Score",
    description: "Improve keyword focus, structure, and writing clarity for better ranking.",
    icon: BookOpen,
  },
  {
    title: "One-Click Highlights & Repurpose",
    description: "Instantly convert your blog into threads, LinkedIn posts, and summaries.",
    icon: Send,
  },
  {
    title: "Multi-Platform Publishing",
    description: "Publish to multiple platforms in one go with platform-specific formatting support.",
    icon: Twitter,
  },
]

const plans = [
  {
    name: "Basic Plan",
    price: "₹5,000",
    period: "Month",
    featured: false,
    points: ["15,000 words/month", "5 blog templates", "15 images/month", "Basic SEO tools", "Email support"],
  },
  {
    name: "Business Plan",
    price: "₹15,000",
    period: "Month",
    featured: true,
    points: ["50,000 words/month", "50 blog templates", "50 images/month", "Advanced SEO suite", "Priority support"],
  },
  {
    name: "Enterprise Plan",
    price: "₹20,000",
    period: "Month",
    featured: false,
    points: ["Unlimited words", "Custom templates", "Unlimited images", "Team collaboration", "Dedicated support"],
  },
]

const stats = [
  { icon: Users, value: "10,000+", label: "Customers worldwide" },
  { icon: Send, value: "10,000+", label: "Content Published" },
  { icon: BarChart3, value: "5.2M+", label: "Total Reach" },
  { icon: Users, value: "1000+", label: "Partner Teams" },
]

const faqs = [
  "What is AIMy Blogs?",
  "Do I need writing experience to use AIMy Blogs?",
  "Can I publish directly to WordPress or Medium?",
  "Does AIMy Blogs support SEO optimization?",
  "Can I generate blog images using AIMy Blogs?",
  "Can I monitor or improve my existing blog content?",
]

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handlePrimary = () => {
    router.push(user ? "/dashboard" : "/signup")
  }

  return (
    <div className="bg-[#fffefd] text-[#171717]">
      <div className="relative overflow-hidden border-b border-[#e9e9e9] bg-[linear-gradient(rgba(255,254,253,0.72),rgba(255,254,253,0.72)),url('/design/BG%2023-01%202.png')] bg-cover bg-center px-4 pb-12 pt-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1360px]">
          <header className="flex items-center justify-between rounded-full border border-[#f3dfd1] bg-[#fffefd]/70 px-4 py-3 backdrop-blur md:px-6">
            <Link href="/" className="text-lg font-extrabold tracking-tight text-[#fb6503] md:text-xl">LOGOIPSUM</Link>
            <nav className="hidden items-center gap-2 md:flex">
              {[
                ["Home", "/"],
                ["Features", "/features"],
                ["Pricing", "/pricing"],
                ["Documentation", "/docs"],
              ].map(([label, href], i) => (
                <Link
                  key={label}
                  href={href}
                  className={i === 0 ? "border-r border-[#fc9856] px-2 text-sm font-bold text-[#171717]" : "border-r border-[#fc9856] px-2 text-sm font-medium text-[#4d4d4d] last:border-r-0"}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="rounded-full bg-[#fffdf9] px-6 py-2 text-sm font-medium text-[#171717] shadow-[0_2px_2px_0_rgba(255,240,230,0.24)]">Login</Link>
              <Link href="/signup" className="rounded-full border border-[#e45c03] px-6 py-2 text-sm font-medium text-[#171717] shadow-[0_2px_2px_0_#fecfb1]">Signup</Link>
            </div>
          </header>

          <section className="mx-auto mt-12 max-w-[920px] text-center md:mt-16">
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Publish Smarter Blogs With AI
              <br />
              Across Every <span className="font-medium italic text-[#6a6a6a]">Platform</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[820px] text-sm font-medium text-[#4d4d4d] md:text-base">
              AIMy Blogs helps creators and teams generate, optimize, and publish high-quality content in minutes.
              From SEO plus images to scheduling and analytics, everything stays in one workflow.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button onClick={handlePrimary} className="rounded-full bg-gradient-to-b from-[#fb6503] to-[#fc9856] px-8 py-3 text-sm font-bold text-[#fffefd] shadow-[0_2px_6px_0_#fdb88b]">Get Started Free</button>
              <button onClick={() => router.push("/pricing")} className="rounded-full border border-[#e45c03] bg-white px-8 py-3 text-sm font-medium text-[#1e1e1e] shadow-[0_2px_2px_0_#fecfb1]">View Pricing</button>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-[#4d4d4d]">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#fb6503]" />No credit card required</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#fb6503]" />Publish faster</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#fb6503]" />Works with WordPress</span>
            </div>
          </section>

          <section className="mt-10 rounded-[32px] bg-[#e9e9e9] p-4 md:p-8">
            <div className="rounded-[28px] border-4 border-[#bababa]">
              <Image src="/design/Frame 23.png" alt="Hero product preview" width={1180} height={680} className="h-auto w-full rounded-[24px] object-cover" priority />
            </div>
          </section>
        </div>
      </div>

      <section className="px-4 py-12 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1360px] rounded-[30px] bg-gradient-to-b from-[rgba(255,240,230,0.2)] to-[rgba(254,207,177,0.45)] px-5 py-9 md:px-8 md:py-10">
          <h2 className="mx-auto max-w-[920px] text-center text-3xl font-bold leading-tight text-[#1e1e1e] md:text-5xl">
            AIMy Blogs Captures Every Content Detail <span className="font-medium italic text-[#4d4d4d]">Automatically</span>
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => (
              <article key={step.id} className="rounded-2xl bg-[#fffefd] p-5">
                <p className="text-4xl font-bold">{step.id}</p>
                <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm font-medium text-[#4d4d4d]">{step.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <h3 className="text-3xl font-bold">Start your free trial today</h3>
            <p className="mx-auto mt-3 max-w-[920px] text-sm font-medium text-[#4d4d4d] md:text-base">With PublishType, publish your blog posts on all major platforms in a few clicks.</p>
            <button onClick={handlePrimary} className="mt-5 rounded-full bg-gradient-to-b from-[#fb6503] to-[#fc9856] px-10 py-3 text-sm font-bold text-[#fffefd] shadow-[0_2px_6px_0_#fdb88b]">Get Started Free</button>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1360px]">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-5xl">A Quick Overview of Essential <span className="font-medium italic text-[#4d4d4d]">Features</span></h2>
            <p className="mx-auto mt-3 max-w-[700px] text-sm font-medium text-[#4d4d4d] md:text-base">Everything you need to create content that ranks, converts, and scales without hiring a full team.</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.45fr]">
            <div className="space-y-4">
              {featureCards.map((card) => {
                const Icon = card.icon
                return (
                  <article key={card.title} className={card.highlight ? "rounded-2xl border border-[#e9e9e9] bg-[#fff9f1] p-5" : "rounded-2xl border border-[#e9e9e9] bg-white p-5"}>
                    <div className={card.highlight ? "inline-flex rounded-full bg-[#fc8435] p-3 text-white" : "inline-flex rounded-full bg-[#fff0e6] p-3 text-[#fb6503]"}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{card.title}</h3>
                    <p className="mt-2 text-sm font-medium text-[#4d4d4d]">{card.description}</p>
                  </article>
                )
              })}
            </div>
            <div className="rounded-2xl border border-[#e9e9e9] bg-[#e9e9e9] p-4">
              <Image src="/design/Frame 23.png" alt="Main feature" width={860} height={560} className="w-full rounded-xl object-cover" />
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                {["/design/Frame 59.png", "/design/Frame 60.png", "/design/Frame 61.png", "/design/Frame 62.png"].map((src) => (
                  <Image key={src} src={src} alt="Feature thumbnail" width={196} height={111} className="h-[94px] w-full rounded-xl object-cover md:h-[111px]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf9] px-4 py-12 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1360px]">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-5xl">Trusted by High-<span className="font-medium italic text-[#4d4d4d]">Performing Teams</span></h2>
            <p className="mx-auto mt-3 max-w-[900px] text-sm font-medium text-[#4d4d4d] md:text-base">Creators, agencies, and marketing teams use AIMy Blogs to deliver consistent content without burnout.</p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <article key={item} className="rounded-[28px] border border-[#e45c03] bg-white p-5">
                <p className="text-[#fb6503]">★★★★★</p>
                <p className="mt-4 text-sm font-medium text-[#171717]">PublishType has amazing content quality and helped us scale posting across channels in one workflow.</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0e6] text-sm font-bold">S</div>
                  <div>
                    <p className="text-sm font-bold">Sarah Khan</p>
                    <p className="text-xs text-[#4d4d4d]">Content Creator</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-[#e9e9e9] bg-white p-4">
                  <div className="rounded-full bg-[#fff0e6] p-3 text-[#fb6503]"><Icon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-xs font-medium text-[#4d4d4d]">{stat.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1360px]">
          <h2 className="text-center text-3xl font-bold md:text-5xl">Pricing That Grows as <span className="font-medium italic text-[#4d4d4d]">You Grow</span></h2>
          <p className="mx-auto mt-3 max-w-[700px] text-center text-sm font-medium text-[#4d4d4d] md:text-base">Choose a plan that fits your workflow today, then upgrade anytime as you scale.</p>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className="overflow-hidden rounded-[30px] border border-[#e9e9e9] bg-[#fffefd]">
                <div className={plan.featured ? "bg-[#fb6503] p-5 text-white" : "bg-gradient-to-b from-[#fff9f1] to-[#fff7ed] p-5 text-[#1e1e1e]"}>
                  <p className="text-sm font-bold">{plan.name}</p>
                  <p className="mt-3 text-3xl font-bold">{plan.price}<span className={plan.featured ? "text-sm text-white" : "text-sm text-[#6a6a6a]"}>/{plan.period}</span></p>
                  <button className="mt-4 w-full rounded-full border border-[#e9e9e9] bg-white px-5 py-2 text-sm font-bold text-[#171717]">Get Started</button>
                </div>
                <div className="space-y-3 bg-[#fffbf7] p-5">
                  {plan.points.map((point) => (
                    <div key={point} className="flex items-center gap-2 text-sm font-medium"><Check className="h-4 w-4 text-[#fb6503]" />{point}</div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 pt-8 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1360px]">
          <h2 className="text-center text-3xl font-bold md:text-5xl">Frequently Asked Questions</h2>
          <p className="mx-auto mt-3 max-w-[700px] text-center text-sm font-medium text-[#4d4d4d] md:text-base">Everything you need to know before getting started with AIMy Blogs.</p>
          <div className="mt-8 divide-y divide-[#e9e9e9] rounded-2xl border border-[#e9e9e9] bg-white">
            {faqs.map((question, index) => {
              const isOpen = openFaq === index
              return (
                <button key={question} type="button" onClick={() => setOpenFaq(isOpen ? null : index)} className="w-full px-4 py-4 text-left md:px-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-base font-medium md:text-xl">{index + 1}. {question}</p>
                    {isOpen ? <Minus className="h-5 w-5 text-[#4d4d4d]" /> : <Plus className="h-5 w-5 text-[#4d4d4d]" />}
                  </div>
                  {isOpen && <p className="mt-3 max-w-3xl text-sm font-medium text-[#4d4d4d]">Yes. AIMy Blogs supports guided generation, optimization, and publishing workflows for beginners and teams.</p>}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="mx-4 mb-4 mt-4 overflow-hidden rounded-t-[40px] bg-gradient-to-b from-[#fff6f0] via-[rgba(255,246,240,0.82)] to-[rgba(255,211,183,0.7)] px-5 pb-8 pt-12 md:mx-8 lg:mx-12">
        <div className="mx-auto max-w-[1360px]">
          <p className="text-center text-5xl font-black text-[#fb6503]/20 md:text-8xl lg:text-[170px] lg:leading-none">LOGOIPSUM</p>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#bababa] pb-5">
            <div>
              <p className="text-sm font-medium text-[#212121]">All Assistant That Captures Every Details.</p>
              <div className="mt-3 flex items-center gap-3 text-[#212121]">
                <Twitter className="h-5 w-5" />
                <Facebook className="h-5 w-5" />
                <Linkedin className="h-5 w-5" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-[#212121]">
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/docs">Documentation</Link>
            </div>
            <div className="w-full max-w-[360px]">
              <p className="mb-2 text-sm font-bold text-[#212121]">Stay Connected</p>
              <div className="flex items-center rounded-full bg-[#fff0e6] p-1">
                <input className="w-full bg-transparent px-3 py-2 text-sm outline-none" placeholder="Enter Your Email" />
                <button className="rounded-full bg-[#fffefd] px-4 py-2 text-sm font-bold">Submit</button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-[#212121]">
            <div className="flex items-center gap-4">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Term & Condition</Link>
            </div>
            <p className="text-xs">© 2025 logoipsum. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
