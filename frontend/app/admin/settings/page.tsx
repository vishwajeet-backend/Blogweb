"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { AdminNavTabs } from '@/components/layout/admin-nav-tabs';

type ProfileData = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  bio: string;
  website: string;
  twitterHandle: string;
  linkedinUrl: string;
  avatar: string;
};

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    bio: '',
    website: '',
    twitterHandle: '',
    linkedinUrl: '',
    avatar: '',
  });
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/admin/settings');
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [loading, user, router]);

  const loadProfile = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/admin/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load profile');

      const nextProfile: ProfileData = json.data.profile;
      setProfile(nextProfile);
      setForm({
        firstName: nextProfile.firstName || '',
        lastName: nextProfile.lastName || '',
        bio: nextProfile.bio || '',
        website: nextProfile.website || '',
        twitterHandle: nextProfile.twitterHandle || '',
        linkedinUrl: nextProfile.linkedinUrl || '',
        avatar: nextProfile.avatar || '',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    loadProfile();
  }, [user]);

  const onSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token found');

      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to save profile');

      setProfile(json.data.profile);
      setSuccess('Profile settings saved');
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const bioLength = useMemo(() => form.bio.length, [form.bio]);

  if (loading || !user) return <div className="p-8 text-sm text-[#57534D]">Loading settings...</div>;
  if (user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#FAF9F6]" style={{ fontFamily: 'Satoshi, var(--font-geist-sans), sans-serif' }}>
      <div className="mx-auto max-w-[980px] px-3 py-5 sm:px-4 md:px-6">
        <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
          <p className="text-[22px] font-bold text-[#1C1917]">Admin Panel</p>
        </div>

        <AdminNavTabs />

        <main className="mt-2">
          <div>
            <h1 className="text-[32px] font-bold text-[#1C1917]">Profile Settings</h1>
            <p className="mt-1 text-[16px] font-medium text-[#79716B]">Manage your personal information and public presence.</p>
          </div>

          {error && <div className="mt-4 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{error}</div>}
          {success && <div className="mt-4 rounded border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-sm text-[#166534]">{success}</div>}

          {loadingData ? (
            <div className="mt-10 text-[#6A6A6A]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading profile...</div>
          ) : (
            <div className="mt-5 space-y-8 rounded-[10px] border border-[#E7E5E4] bg-[#FAF9F6] p-4 sm:p-6">
              <section className="grid gap-6 border-b border-[#E7E5E4] pb-8 md:grid-cols-[220px_1fr]">
                <div>
                  <h2 className="text-[22px] font-medium text-[#1C1917] sm:text-[24px] md:text-[31px]">Profile Picture</h2>
                  <p className="mt-1 text-[14px] text-[#79716B] md:text-[16px]">This will be displayed on your public profile.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {form.avatar ? (
                    <img src={form.avatar} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E5E7EB] text-xl font-bold text-[#4B5563]">
                      {(profile?.name || user.name).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="rounded-[8px] bg-[#FB6503] px-4 py-2 text-sm font-medium text-white">Upload New</button>
                      <button className="rounded-[8px] border border-[#D6D3D1] bg-white px-4 py-2 text-sm text-[#44403B]">Remove</button>
                    </div>
                    <input
                      value={form.avatar}
                      onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.value }))}
                      placeholder="Avatar URL"
                      className="mt-3 w-full rounded-[8px] border border-[#D6D3D1] bg-white px-3 py-2 text-[14px] text-[#1C1917] outline-none"
                    />
                    <p className="mt-2 text-[13px] text-[#79716B]">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 border-b border-[#E7E5E4] pb-8 md:grid-cols-[220px_1fr]">
                <div>
                  <h2 className="text-[22px] font-medium text-[#1C1917] sm:text-[24px] md:text-[31px]">Personal Information</h2>
                  <p className="mt-1 text-[14px] text-[#79716B] md:text-[16px]">Update your basic personal details.</p>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <LabeledInput label="First name" value={form.firstName} onChange={(value) => setForm((prev) => ({ ...prev, firstName: value }))} />
                    <LabeledInput label="Last name" value={form.lastName} onChange={(value) => setForm((prev) => ({ ...prev, lastName: value }))} />
                  </div>
                  <LabeledInput label="Email address" value={profile?.email || ''} disabled />
                  <label className="block">
                    <span className="mb-1 block text-[16px] text-[#44403B]">Bio</span>
                    <textarea
                      value={form.bio}
                      maxLength={200}
                      onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                      className="h-32 w-full resize-none rounded-[8px] border border-[#D6D3D1] bg-white px-3 py-2 text-[16px] text-[#1C1917] outline-none"
                    />
                    <span className="mt-1 block text-right text-[13px] text-[#A6A09B]">{bioLength}/200</span>
                  </label>
                </div>
              </section>

              <section className="grid gap-6 border-b border-[#E7E5E4] pb-8 md:grid-cols-[220px_1fr]">
                <div>
                  <h2 className="text-[22px] font-medium text-[#1C1917] sm:text-[24px] md:text-[31px]">Social Profiles</h2>
                  <p className="mt-1 text-[14px] text-[#79716B] md:text-[16px]">Where can people find you online?</p>
                </div>
                <div className="space-y-4">
                  <LabeledInput label="Website" value={form.website} onChange={(value) => setForm((prev) => ({ ...prev, website: value }))} placeholder="https://www.example.com" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <LabeledInput label="Twitter" value={form.twitterHandle} onChange={(value) => setForm((prev) => ({ ...prev, twitterHandle: value }))} placeholder="username" />
                    <LabeledInput label="LinkedIn" value={form.linkedinUrl} onChange={(value) => setForm((prev) => ({ ...prev, linkedinUrl: value }))} placeholder="in/username" />
                  </div>
                </div>
              </section>

              <section className="grid gap-6 md:grid-cols-[220px_1fr]">
                <div>
                  <h2 className="text-[22px] font-medium text-[#1C1917] sm:text-[24px] md:text-[31px]">Public Profile</h2>
                  <p className="mt-1 text-[14px] text-[#79716B] md:text-[16px]">Control your profile URL and visibility.</p>
                </div>
                <div className="space-y-3">
                  <LabeledInput
                    label="Profile URL"
                    value={`${profile?.email || ''}@${form.firstName || 'user'}.${form.lastName || 'name'}`.toLowerCase()}
                    disabled
                  />
                  <button className="inline-flex items-center gap-2 text-[14px] text-[#57534D] sm:text-[16px]">
                    <Link2 className="h-4 w-4" /> Preview public profile
                  </button>
                  <div className="rounded-[8px] border border-[#E7E5E4] bg-white px-3 py-3">
                    <p className="text-[16px] font-medium text-[#1C1917]">Make Profile Public</p>
                    <p className="text-[16px] text-[#79716B]">Allow users to find you via search engines.</p>
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#E7E5E4] pt-6 sm:flex-row">
                <button onClick={() => router.push('/admin')} className="rounded-[8px] border border-[#D6D3D1] bg-white px-4 py-2 text-[14px] text-[#44403B] sm:text-[16px]">
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#FB6503] px-4 py-2 text-[14px] font-medium text-white disabled:opacity-60 sm:text-[16px]"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[16px] text-[#44403B]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-11 w-full rounded-[8px] border border-[#D6D3D1] bg-white px-3 text-[16px] text-[#1C1917] outline-none disabled:bg-[#FAFAF9] disabled:text-[#79716B]"
      />
    </label>
  );
}
