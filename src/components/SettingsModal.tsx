"use client";

import React, { useState, useEffect } from 'react';
import { SmtpSettings } from '@/types';
import { X, CheckCircle, AlertCircle, Save, Send, ShieldCheck, Mail } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function SettingsModal({ isOpen, onClose, onSaved }: SettingsModalProps) {
  const [settings, setSettings] = useState<SmtpSettings>({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: '', pass: '' },
    fromName: 'CertFlow Team',
    fromEmail: '',
    subjectTemplate: 'Your Certificate of Completion: {{eventName}}',
    bodyTemplate: '',
    eventName: 'Work Immersion 2026',
    organizationName: 'Elizabeth Seton School',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setTestResult({ success: true, message: 'Settings saved successfully!' });
        setTimeout(() => {
          if (onSaved) onSaved();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: 'SMTP connection verified! Server responded OK.' });
      } else {
        setTestResult({ success: false, message: data.error || 'SMTP Connection failed.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error during test.' });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Email & Dispatch Settings</h2>
              <p className="text-xs text-slate-400">Configure SMTP credentials to email certificates directly.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Organization & Event Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Event / Program Name
              </label>
              <input
                type="text"
                value={settings.eventName}
                onChange={(e) => setSettings({ ...settings, eventName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Work Immersion 2026"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Organization / School Name
              </label>
              <input
                type="text"
                value={settings.organizationName}
                onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Elizabeth Seton School"
                required
              />
            </div>
          </div>

          {/* SMTP Credentials */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-300">
                <ShieldCheck className="w-4 h-4" /> SMTP Server Configuration
              </h3>
              <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full">
                For Gmail: Use an App Password
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={settings.host}
                  onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-sm"
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Port</label>
                <input
                  type="number"
                  value={settings.port}
                  onChange={(e) => setSettings({ ...settings, port: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-sm"
                  placeholder="465"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Username / Email</label>
                <input
                  type="text"
                  value={settings.auth.user}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      auth: { ...settings.auth, user: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-sm"
                  placeholder="admin@gmail.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">App Password / Secret</label>
                <input
                  type="password"
                  value={settings.auth.pass}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      auth: { ...settings.auth, pass: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-sm font-mono"
                  placeholder="16-character app password"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Sender Display Name</label>
                <input
                  type="text"
                  value={settings.fromName}
                  onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-sm"
                  placeholder="Work Immersion Committee"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">From Email (optional override)</label>
                <input
                  type="email"
                  value={settings.fromEmail}
                  onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-sm"
                  placeholder="cert@ess.edu.ph"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.secure}
                  onChange={(e) => setSettings({ ...settings, secure: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                />
                Use SSL/TLS (Default on Port 465)
              </label>
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testing || !settings.auth.user}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {testing ? (
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full" />
                ) : (
                  <Send className="w-3 h-3 text-indigo-400" />
                )}
                Test Connection
              </button>
            </div>
          </div>

          {/* Test connection alert message */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Email Body & Social Sharing Template */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Subject
              </label>
              <span className="text-[11px] text-slate-500">Variables: {'{{name}}'}, {'{{eventName}}'}</span>
            </div>
            <input
              type="text"
              value={settings.subjectTemplate}
              onChange={(e) => setSettings({ ...settings, subjectTemplate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm"
              required
            />

            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider pt-2">
              Email Plaintext Message
            </label>
            <textarea
              rows={4}
              value={settings.bodyTemplate}
              onChange={(e) => setSettings({ ...settings, bodyTemplate: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300"
              placeholder="Hi {{name}}, attached is your certificate..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-slate-800 rounded-xl text-sm text-slate-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
