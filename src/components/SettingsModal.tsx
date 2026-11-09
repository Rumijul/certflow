"use client";

import React, { useState, useEffect } from 'react';
import { SmtpSettings } from '@/types';
import { X, CheckCircle, AlertCircle, Save, Send, Mail } from 'lucide-react';

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
        setTestResult({ success: true, message: 'Settings saved successfully.' });
        setTimeout(() => {
          if (onSaved) onSaved();
          onClose();
        }, 600);
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
        setTestResult({ success: true, message: 'SMTP connection verified. Server responded OK.' });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="bg-[#14171f] border border-[#242b3b] rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl text-slate-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#242b3b] bg-[#10131a]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">SMTP & Delivery Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1b202c] rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Org & Event */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Event / Program Name</label>
              <input
                type="text"
                value={settings.eventName}
                onChange={(e) => setSettings({ ...settings, eventName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#0c0e12] border border-[#242b3b] rounded text-slate-200"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Organization Name</label>
              <input
                type="text"
                value={settings.organizationName}
                onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#0c0e12] border border-[#242b3b] rounded text-slate-200"
                required
              />
            </div>
          </div>

          {/* SMTP Credentials */}
          <div className="p-3 bg-[#0c0e12] border border-[#242b3b] rounded space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">SMTP Credentials</span>
              <span className="text-[10px] text-slate-400 font-mono">Gmail / Outlook / Custom</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={settings.host}
                  onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                  className="w-full px-2 py-1.5 bg-[#14171f] border border-[#242b3b] rounded font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Port</label>
                <input
                  type="number"
                  value={settings.port}
                  onChange={(e) => setSettings({ ...settings, port: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 bg-[#14171f] border border-[#242b3b] rounded font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Username / Email</label>
                <input
                  type="text"
                  value={settings.auth.user}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      auth: { ...settings.auth, user: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1.5 bg-[#14171f] border border-[#242b3b] rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Password / App Password</label>
                <input
                  type="password"
                  value={settings.auth.pass}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      auth: { ...settings.auth, pass: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1.5 bg-[#14171f] border border-[#242b3b] rounded font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.secure}
                  onChange={(e) => setSettings({ ...settings, secure: e.target.checked })}
                  className="rounded bg-[#14171f] border-[#242b3b] text-blue-600 focus:ring-0"
                />
                SSL/TLS (Port 465)
              </label>
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testing || !settings.auth.user}
                className="px-2.5 py-1 bg-[#1b202c] hover:bg-[#242b3b] border border-[#242b3b] rounded text-xs font-medium text-slate-200 transition flex items-center gap-1 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
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

          {/* Subject & Body */}
          <div className="space-y-2">
            <div>
              <label className="block text-slate-400 mb-1">Email Subject Template</label>
              <input
                type="text"
                value={settings.subjectTemplate}
                onChange={(e) => setSettings({ ...settings, subjectTemplate: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#0c0e12] border border-[#242b3b] rounded text-slate-200"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Email Message</label>
              <textarea
                rows={3}
                value={settings.bodyTemplate}
                onChange={(e) => setSettings({ ...settings, bodyTemplate: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#0c0e12] border border-[#242b3b] rounded font-mono text-[11px] text-slate-300"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242b3b]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 hover:bg-[#1b202c] rounded text-slate-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold text-white transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
