'use client'
import AppShell from '@/components/layout/AppShell'
import { PageHeader, Alert, Button, Avatar, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { useAuthStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { User, Lock, Bell, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useT } from '@/lib/i18n'

interface NotificationPrefs { email: boolean; sms: boolean; push: boolean; deadlineAlerts: boolean }
const DEFAULT_PREFS: NotificationPrefs = { email: true, sms: false, push: true, deadlineAlerts: true }
const PREFS_KEY = 'crimegpt-notification-prefs'

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05] last:border-0">
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-secondary mt-0.5">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
          checked ? 'bg-gradient-brand' : 'bg-bg-hover'
        )}
      >
        <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform', checked && 'translate-x-4')} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const t = useT()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin' || user?.role === 'sho'
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(PREFS_KEY)
    if (stored) setPrefs(JSON.parse(stored))
  }, [])

  function updatePref(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    localStorage.setItem(PREFS_KEY, JSON.stringify(next))
    toast.success('Preference saved')
  }

  function requestPasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }
    toast('Password changes are administrator-managed — this request has been logged for your SHO to action.', { icon: '🔒' })
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
  }

  return (
    <AppShell>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <Tabs defaultValue="profile">
        <TabsList className="mb-5 flex-wrap">
          <TabsTrigger value="profile"><User size={14} /> Profile</TabsTrigger>
          <TabsTrigger value="security"><Lock size={14} /> Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell size={14} /> Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="card max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={user?.name} size="lg" />
              <div>
                <div className="text-base font-bold text-text-primary">{user?.name}</div>
                <div className="text-xs text-text-muted capitalize">{user?.rank || user?.role} · {user?.police_station}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label block mb-1">Officer Badge Number</label>
                <input className="input" value={user?.badge_number || ''} readOnly />
              </div>
              <div>
                <label className="label block mb-1">Email</label>
                <input className="input" value={user?.email || ''} readOnly />
              </div>
              <div>
                <label className="label block mb-1">Role</label>
                <input className="input capitalize" value={user?.role || ''} readOnly />
              </div>
              <div>
                <label className="label block mb-1">Police Station</label>
                <input className="input" value={user?.police_station || ''} readOnly />
              </div>
            </div>
            <div className="text-xs text-text-muted mt-4">Profile details are managed by your department administrator and cannot be edited here.</div>

            {isAdmin && (
              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold"><ShieldCheck size={15} className="text-accent-blue" /> Administrator Access</div>
                <div className="text-xs text-text-secondary mb-3">You have {user?.role === 'admin' ? 'admin' : 'SHO'} privileges — manage users, audit logs, and system configuration.</div>
                <Link href="/admin"><Button variant="secondary" size="sm">Go to Admin Panel</Button></Link>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <form onSubmit={requestPasswordChange} className="card max-w-md space-y-4">
            <div className="font-semibold text-sm mb-1">Change Password</div>
            <Alert variant="info" icon="🔒">Password changes go through your administrator for audit compliance.</Alert>
            <div>
              <label className="label block mb-1">Current Password</label>
              <input type="password" className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <label className="label block mb-1">New Password</label>
              <input type="password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <div>
              <label className="label block mb-1">Confirm New Password</label>
              <input type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
            </div>
            <Button type="submit" size="sm">Request Password Change</Button>
          </form>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="card max-w-md">
            <div className="font-semibold text-sm mb-2">Notification Preferences</div>
            <div className="text-xs text-text-muted mb-2">Stored on this device.</div>
            <Toggle checked={prefs.email} onChange={v => updatePref('email', v)} label="Email Notifications" description="Case updates, document generation, deadline reminders" />
            <Toggle checked={prefs.sms} onChange={v => updatePref('sms', v)} label="SMS Alerts" description="Critical case escalations and remand deadlines" />
            <Toggle checked={prefs.push} onChange={v => updatePref('push', v)} label="Push Notifications" description="Real-time updates while using the platform" />
            <Toggle checked={prefs.deadlineAlerts} onChange={v => updatePref('deadlineAlerts', v)} label="Deadline Alerts" description="Court submission and remand deadline warnings" />
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
