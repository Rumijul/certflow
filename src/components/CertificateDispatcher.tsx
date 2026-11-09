"use client";

import React, { useState } from 'react';
import { CertificateTemplate, Participant } from '@/types';
import {
  Send,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  Share2,
  FileCheck,
  Settings
} from 'lucide-react';

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242b3b]">
        <div>
          <div className="text-[11px] font-mono uppercase text-slate-400">Step 4 — Email Dispatch</div>
          <h2 className="text-lg font-bold text-white tracking-tight">Send Certificates & Social Flex</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            disabled={sending}
            className="px-3 py-1.5 rounded bg-[#1b202c] hover:bg-[#242b3b] border border-[#242b3b] text-xs font-medium text-slate-300 transition"
          >
            Back
          </button>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 bg-[#1b202c] hover:bg-[#242b3b] border border-[#242b3b] rounded text-xs font-medium text-slate-200 transition flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            SMTP Config
          </button>
          <button
            onClick={startBatchDispatch}
            disabled={sending || approvedParticipants.length === 0}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-semibold text-white transition flex items-center gap-1.5"
          >
            {sending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {sending ? `Sending (${progress}%)...` : `Send ${approvedParticipants.length} Certificates`}
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-[#14171f] border border-[#242b3b] rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" /> Automated Delivery Queue
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates high-res PDF attachments with one-click social share links for each recipient.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/40">
              <CheckCircle className="w-3 h-3" /> {successCount} Sent
            </span>
            <span className="flex items-center gap-1 text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-800/40">
              <AlertCircle className="w-3 h-3" /> {failureCount} Failed
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {sending && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Dispatching certificates...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-[#0c0e12] rounded overflow-hidden border border-[#242b3b]">
              <div
                className="h-full bg-blue-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Recipient Deliverable Preview */}
        <div className="border border-[#242b3b] bg-[#0c0e12] rounded p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-slate-400" /> Recipient Email Preview
            </span>
            <span className="text-[10px] text-slate-400 font-mono">HTML + PDF Attachment</span>
          </div>

          <div className="bg-[#14171f] border border-[#242b3b] rounded p-3 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between border-b border-[#242b3b] pb-2 text-[11px] text-slate-400">
              <span>Subject: Your Certificate of Completion</span>
              <span className="font-mono">Attached: 1 PDF</span>
            </div>
            <p className="font-semibold text-white">Hi Participant,</p>
            <p className="text-slate-400 text-xs">
              Congratulations on completing the program! Attached is your official Certificate of Completion.
            </p>
            <div className="flex items-center gap-2 p-2 bg-[#0c0e12] rounded border border-[#242b3b]">
              <FileCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-xs text-slate-200 font-mono">
                Official_Certificate.pdf
              </span>
            </div>
            <div className="pt-1 flex items-center gap-2 text-[11px]">
              <span className="text-slate-500">Social actions:</span>
              <span className="px-2 py-0.5 bg-[#0077b5]/20 text-[#38bdf8] border border-[#0077b5]/40 rounded text-[10px] font-medium">
                + Add to LinkedIn
              </span>
              <span className="px-2 py-0.5 bg-[#1b202c] text-slate-300 border border-[#242b3b] rounded text-[10px] font-medium">
                Share on X
              </span>
            </div>
          </div>
        </div>

        {/* Dispatch Queue Log */}
        <div className="border border-[#242b3b] rounded overflow-hidden">
          <div className="bg-[#10131a] px-3.5 py-2 border-b border-[#242b3b] flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Recipient Queue</span>
            <span className="text-slate-500 font-mono text-[11px]">{approvedParticipants.length} total</span>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-[#242b3b] text-xs">
            {approvedParticipants.map((p) => {
              const res = sentList[p.id];
              return (
                <div key={p.id} className="px-3.5 py-2 flex items-center justify-between hover:bg-[#1b202c]">
                  <div className="flex items-center gap-2">
                    {res?.status === 'sent' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : res?.status === 'failed' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 ml-1 shrink-0" />
                    )}
                    <span className="font-medium text-slate-200">{p.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">&lt;{p.email}&gt;</span>
                  </div>

                  <div>
                    {res?.status === 'sent' && (
                      <span className="text-emerald-400 font-mono text-[10px]">Delivered</span>
                    )}
                    {res?.status === 'failed' && (
                      <span className="text-rose-400 text-[10px] truncate max-w-xs block" title={res.error}>
                        {res.error || 'Failed'}
                      </span>
                    )}
                    {!res && (
                      <span className="text-slate-500 text-[10px]">Queued</span>
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
