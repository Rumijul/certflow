"use client";

import React, { useState } from 'react';
import { CertificateTemplate, Participant, SmtpSettings } from '@/types';
import {
  Send,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  Share2,
  FileCheck,
  ShieldCheck,
  Download,
  Settings
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface CertificateDispatcherProps {
  template: CertificateTemplate;
  participants: Participant[];
  onOpenSettings: () => void;
  onBack: () => void;
}

export function CertificateDispatcher({
  template,
  participants,
  onOpenSettings,
  onBack,
}: CertificateDispatcherProps) {
  const [sending, setSending] = useState(false);
  const [sentList, setSentList] = useState<Record<string, { status: 'sent' | 'failed'; error?: string }>>({});
  const [progress, setProgress] = useState(0);

  const approvedParticipants = participants.filter((p) => p.approved);

  const startBatchDispatch = async () => {
    setSending(true);
    setProgress(0);

    const total = approvedParticipants.length;
    let completed = 0;

    for (const participant of approvedParticipants) {
      try {
        const res = await fetch('/api/send-certificate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template,
            participant,
            imageBase64: template.imageDataUrl,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSentList((prev) => ({
            ...prev,
            [participant.id]: { status: 'sent' },
          }));
        } else {
          setSentList((prev) => ({
            ...prev,
            [participant.id]: { status: 'failed', error: data.error || 'Failed to dispatch' },
          }));
        }
      } catch (err: any) {
        setSentList((prev) => ({
          ...prev,
          [participant.id]: { status: 'failed', error: err.message },
        }));
      }

      completed += 1;
      setProgress(Math.round((completed / total) * 100));
    }

    setSending(false);
  };

  const successCount = Object.values(sentList).filter((s) => s.status === 'sent').length;
  const failureCount = Object.values(sentList).filter((s) => s.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Step 5 & 6 of 6</span>
          <h2 className="text-2xl font-bold text-white tracking-tight">Send Certificates & Participant Experience</h2>
          <p className="text-sm text-slate-400 mt-1">
            Dispatch personalized PDF attachments with social media sharing guides to approved recipients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            disabled={sending}
            className="px-4 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-400 transition"
          >
            Back to Review
          </button>
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            SMTP Credentials
          </button>
          <button
            onClick={startBatchDispatch}
            disabled={sending || approvedParticipants.length === 0}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-white shadow-xl shadow-indigo-600/30 transition flex items-center gap-2"
          >
            {sending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? `Sending (${progress}%)...` : `Send ${approvedParticipants.length} Certificates Now`}
          </button>
        </div>
      </div>

      {/* Dispatch Control Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" /> Automated Email Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              Each recipient receives a customized email containing their PDF certificate attachment and one-click social share actions.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" /> {successCount} Sent
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5" /> {failureCount} Failed
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {sending && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Sending certificates to approved recipients...</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Recipient Deliverable Simulator (Step 6 Experience) */}
        <div className="border border-slate-800 bg-slate-950/70 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-indigo-400" /> Step 6: What The Recipient Receives
            </span>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Ready for Socials
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">From: Events & Certification Team</span>
              <span className="text-slate-500 font-mono text-[10px]">Just now</span>
            </div>
            <p className="font-semibold text-white">Hi Participant,</p>
            <p className="text-slate-400">
              Congratulations on completing the program! Attached to this email is your official Certificate of Completion (PDF).
            </p>
            <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs text-slate-200 font-mono truncate">
                Official_Certificate_Of_Completion.pdf
              </span>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-400">One-click social sharing:</span>
              <span className="px-2 py-0.5 bg-[#0077b5]/20 text-[#0077b5] border border-[#0077b5]/40 rounded text-[10px] font-bold">
                + Add to LinkedIn Profile
              </span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">
                Share on X (Twitter)
              </span>
            </div>
          </div>
        </div>

        {/* Live Dispatch Log */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Dispatch Queue Status</span>
            <span className="text-slate-500 font-mono">{approvedParticipants.length} recipients queued</span>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40 text-xs">
            {approvedParticipants.map((p) => {
              const res = sentList[p.id];
              return (
                <div key={p.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-850/40">
                  <div className="flex items-center gap-2.5">
                    {res?.status === 'sent' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : res?.status === 'failed' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-600 ml-1 shrink-0" />
                    )}
                    <span className="font-medium text-slate-200">{p.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">&lt;{p.email}&gt;</span>
                  </div>

                  <div>
                    {res?.status === 'sent' && (
                      <span className="text-emerald-400 font-mono text-[11px]">Delivered</span>
                    )}
                    {res?.status === 'failed' && (
                      <span className="text-rose-400 text-[11px] truncate max-w-xs block" title={res.error}>
                        {res.error || 'Failed'}
                      </span>
                    )}
                    {!res && (
                      <span className="text-slate-500 text-[11px]">Waiting</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
