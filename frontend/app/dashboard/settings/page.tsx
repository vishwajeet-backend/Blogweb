"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  CreditCard,
  Bell,
  Lock,
  User,
  Loader2,
  Check,
  Sparkles,
  ShieldCheck,
  Globe,
  AtSign,
  Trash2,
  RefreshCw,
  Download
} from "lucide-react"
import { toast } from "sonner"
import { useRazorpay, PLAN_PRICING_DISPLAY, PLAN_NAMES, PlanType, BillingPeriod } from "@/lib/hooks/useRazorpay"

interface UserProfile {
  id: string
  name: string
  email: string
  bio?: string | null
  avatar?: string | null
  website?: string | null
  twitterHandle?: string | null
  linkedinUrl?: string | null
  emailVerified: boolean
  subscriptionPlan?: string
  subscriptionStatus?: string
  subscriptionStartDate?: string
  subscriptionEndDate?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const { loading: paymentLoading, initiatePayment } = useRazorpay()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState("")
  const [bio, setBio] = useState("")
  const [website, setWebsite] = useState("")
  const [twitterHandle, setTwitterHandle] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState({
    emailOnPublish: true,
    emailOnMilestone: true,
    emailWeeklyDigest: true,
    emailMonthlyReport: false,
    pushNotifications: true,
    inAppNotifications: true,
  })

  useEffect(() => { fetchUserData() }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) { router.push('/login'); return }

      const profileResponse = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
      if (!profileResponse.ok) { localStorage.removeItem('accessToken'); router.push('/login'); return }

      const profileData = await profileResponse.json()
      const user = profileData.data.user
      setProfile(user)
      setName(user.name || "")
      setAvatar(user.avatar || "")
      setBio(user.bio || "")
      setWebsite(user.website || "")
      setTwitterHandle(user.twitterHandle || "")
      setLinkedinUrl(user.linkedinUrl || "")

      const settingsRes = await fetch('/api/user/settings', { headers: { 'Authorization': `Bearer ${token}` } })
      if (settingsRes.ok) {
        const sData = await settingsRes.json()
        if (sData.data.settings) setSettings(sData.data.settings)
      }
      setLoading(false)
    } catch (e) { toast.error('Failed to load settings'); setLoading(false) }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, avatar, bio, website, twitterHandle, linkedinUrl })
      })
      const data = await res.json()
      if (res.ok) { setProfile(data.data.user); toast.success('Profile updated!') }
      else toast.error(data.error || 'Update failed')
    } catch (e) { toast.error('Error occurred') }
    finally { setSaving(false) }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true)
      const token = localStorage.getItem('accessToken')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', `${name || 'User'} profile photo`)

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload avatar')
      }

      const nextAvatar = data?.url || data?.data?.url || ''
      setAvatar(nextAvatar)
      toast.success('Avatar uploaded')
    } catch (e: any) {
      toast.error(e.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error('Fill all fields')
    if (newPassword !== confirmPassword) return toast.error('Passwords mismatch')
    setChangingPassword(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Password changed! Relogging...')
        setTimeout(() => { localStorage.removeItem('accessToken'); router.push('/login') }, 2000)
      } else toast.error(data.error || 'Password change failed')
    } finally { setChangingPassword(false) }
  }

  const handleSavePreferences = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save preferences')
      }
      toast.success('Preferences Updated')
    } catch (e: any) {
      toast.error(e.message || 'Failed to save preferences')
    }
  }

  const handleDeleteAccount = async () => {
    if (confirm('Permanently delete account?') && prompt('Type DELETE to confirm') === 'DELETE') {
      try {
        const token = localStorage.getItem('accessToken')
        const res = await fetch('/api/user/account', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        if (res.ok) { localStorage.removeItem('accessToken'); router.push('/') }
      } catch (e) { toast.error('Delete failed') }
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Loader2 className="animate-spin" size={40} color="#FF7A33" /></div>

  return (
    <>
      <style jsx global>{`
        /* Tablet and below */
        @media (max-width: 1024px) {
          .settings-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
            padding: 24px 20px !important;
          }
          .settings-main-col {
            grid-column: span 1 !important;
          }
          .settings-sidebar-col {
            grid-column: span 1 !important;
          }
        }

        /* Mobile landscape and below */
        @media (max-width: 768px) {
          .settings-hero {
            padding: 40px 20px !important;
          }
          .settings-hero h1 {
            font-size: 32px !important;
          }
          .settings-card {
            padding: 24px !important;
            border-radius: 24px !important;
          }
          .settings-form-grid {
            grid-template-columns: 1fr !important;
          }
          .settings-form-grid-span-2 {
            grid-column: span 1 !important;
          }
        }

        /* Mobile portrait */
        @media (max-width: 480px) {
          .settings-hero {
            padding: 32px 16px !important;
          }
          .settings-hero h1 {
            font-size: 28px !important;
            line-height: 1.2 !important;
          }
          .settings-hero p {
            font-size: 14px !important;
          }
          .settings-grid {
            padding: 20px 12px !important;
            gap: 20px !important;
          }
          .settings-card {
            padding: 20px !important;
            border-radius: 20px !important;
          }
          .settings-card h2 {
            font-size: 18px !important;
          }
          .settings-input {
            padding: 12px 16px !important;
            font-size: 13px !important;
          }
          .settings-button {
            padding: 12px 24px !important;
            font-size: 12px !important;
          }
        }
      `}</style>

      <div style={{ paddingBottom: '100px' }}>
        {/* Hero Header */}
        <section className="settings-hero" style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), url("/design/BG%2023-01%202.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '60px 40px',
        }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 10px 0' }}>
            Account <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#666', fontFamily: 'serif' }}>Settings</span>
          </h1>
          <p style={{ color: '#666', fontSize: '15px', fontWeight: 500 }}>Manage your profile, billing, and security preferences.</p>
        </section>

        <div className="settings-grid" style={{ padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '40px' }}>

          {/* Profile Card */}
          <div className="settings-main-col" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="settings-card" style={{ backgroundColor: '#fff', borderRadius: '32px', border: '1px solid #eee', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#fcfcfc', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF7A33' }}>
                  <User size={24} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Profile Information</h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                {avatar ? (
                  <img src={avatar} alt="profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f5f5f5', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#555' }}>
                    {(name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    className="settings-input"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Avatar URL"
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #eee', backgroundColor: '#fcfcfc', fontSize: '13px', minWidth: '260px' }}
                  />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleAvatarUpload(file)
                    }}
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #eee', backgroundColor: '#fff', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {uploadingAvatar ? 'UPLOADING...' : 'UPLOAD IMAGE'}
                  </button>
                </div>
              </div>

              <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#999' }}>FULL NAME</label>
                  <input className="settings-input" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '14px 20px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#fcfcfc', fontSize: '14px', fontWeight: 700 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#999' }}>EMAIL ADDRESS</label>
                  <input className="settings-input" value={profile?.email} disabled style={{ padding: '14px 20px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#eee', fontSize: '14px', fontWeight: 700, cursor: 'not-allowed' }} />
                </div>
                <div className="settings-form-grid-span-2" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#999' }}>BIO / DESCRIPTION</label>
                  <textarea className="settings-input" value={bio} onChange={(e) => setBio(e.target.value)} style={{ padding: '14px 20px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#fcfcfc', fontSize: '14px', fontWeight: 700, minHeight: '100px', resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#999' }}>WEBSITE URL</label>
                  <input className="settings-input" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ padding: '14px 20px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#fcfcfc', fontSize: '14px', fontWeight: 700 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#999' }}>TWITTER HANDLE</label>
                  <input className="settings-input" value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} style={{ padding: '14px 20px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#fcfcfc', fontSize: '14px', fontWeight: 700 }} />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="settings-button hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ padding: '14px 32px', borderRadius: '50px', backgroundColor: '#1a1a1a', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} UPDATE PROFILE
              </button>
            </div>

            {/* Security Card */}
            <div className="settings-card" style={{ backgroundColor: '#fff', borderRadius: '32px', border: '1px solid #eee', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#fcfcfc', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF7A33' }}>
                  <ShieldCheck size={24} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Security & Password</h2>
              </div>

              <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div className="settings-form-grid-span-2" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#999' }}>CURRENT PASSWORD</label>
                  <input className="settings-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ padding: '14px 20px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#fcfcfc' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#999' }}>NEW PASSWORD</label>
                  <input className="settings-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ padding: '14px 20px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#fcfcfc' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#999' }}>CONFIRM PASSWORD</label>
                  <input className="settings-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ padding: '14px 20px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#fcfcfc' }} />
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="settings-button"
                style={{ padding: '14px 32px', borderRadius: '50px', backgroundColor: '#fff', color: '#1a1a1a', border: '1px solid #eee', fontWeight: 800, cursor: 'pointer' }}>
                {changingPassword ? 'CHANGING...' : 'CHANGE PASSWORD'}
              </button>
            </div>
          </div>

          {/* Sidebar Cards */}
          <div className="settings-sidebar-col" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Current Plan Card */}
            <div style={{ backgroundColor: '#1a1a1a', borderRadius: '32px', padding: '32px', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Current Plan</p>
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>{PLAN_NAMES[profile?.subscriptionPlan as PlanType] || 'Free'}</h3>
                </div>
                <Sparkles size={24} color="#FF7A33" />
              </div>
              <p style={{ fontSize: '13px', opacity: 0.7, lineHeight: '1.6', marginBottom: '24px' }}>
                Your plan is currently active. Next billing date: {profile?.subscriptionEndDate ? new Date(profile.subscriptionEndDate).toLocaleDateString() : 'N/A'}.
              </p>
              <button onClick={() => router.push('/pricing')} style={{ width: '100%', padding: '14px', borderRadius: '50px', backgroundColor: '#FF7A33', color: '#fff', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>UPGRADE PLAN</button>
            </div>

            {/* Notifications Quick Toggle */}
            <div style={{ backgroundColor: '#fff', borderRadius: '32px', border: '1px solid #eee', padding: '32px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 800 }}>Email Alerts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { k: 'emailOnPublish', l: 'Publish Notifications' },
                  { k: 'emailWeeklyDigest', l: 'Weekly Analytics' },
                  { k: 'pushNotifications', l: 'Browser Push' },
                ].map((s: any) => (
                  <div key={s.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#666' }}>{s.l}</span>
                    <div
                      onClick={() => setSettings({ ...settings, [s.k]: !settings[s.k as keyof typeof settings] })}
                      style={{ width: '40px', height: '22px', backgroundColor: settings[s.k as keyof typeof settings] ? '#FF7A33' : '#eee', borderRadius: '50px', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s', justifyContent: settings[s.k as keyof typeof settings] ? 'flex-end' : 'flex-start' }}>
                      <div style={{ width: '18px', height: '18px', backgroundColor: '#fff', borderRadius: '50%' }}></div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleSavePreferences}
                  style={{ background: 'none', border: 'none', color: '#FF7A33', fontSize: '12px', fontWeight: 800, textAlign: 'left', marginTop: '10px', cursor: 'pointer' }}>SAVE PREFERENCES</button>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{ backgroundColor: '#fff5f5', borderRadius: '32px', border: '1px solid #ffebeb', padding: '32px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: '#ff4b2b' }}>Danger Zone</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#666', lineHeight: '1.6' }}>Deleting your account will erase all articles and platform connections permanently.</p>
              <button
                onClick={handleDeleteAccount}
                style={{ padding: '12px 24px', borderRadius: '50px', backgroundColor: '#ff4b2b', color: '#fff', border: 'none', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>DELETE MY ACCOUNT</button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
