"use client";

import React, { useState } from 'react';
import { CertificateTemplate, Participant } from '@/types';
import {
  CheckCircle,
  Eye,
  FileDown,
  Mail,
  RefreshCw,
  X,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface CertificateReviewProps {
  template: CertificateTemplate;
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
  onNextToSend: () => void;
  onBack: () => void;
}

export function CertificateReview({
  template,
  participants,
  onUpdateParticipants,
  onNextToSend,
  onBack,
}: CertificateReviewProps) {
  const [previewParticipant, setPreviewParticipant] = useState<Participant | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zipping, setZipping] = useState(false);

  const fetchParticipantPdf = async (participant: Participant): Promise<Blob | null> => {
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          participant,
          imageBase64: template.imageDataUrl,
        }),
      });
      if (res.ok) {
        return await res.blob();
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleOpenPreview = async (participant: Participant) => {
    setPreviewParticipant(participant);
    setPreviewLoading(true);
    setPreviewPdfUrl(null);

    const blob = await fetchParticipantPdf(participant);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    }
    setPreviewLoading(false);
  };

  const handleClosePreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
    }
    setPreviewParticipant(null);
    setPreviewPdfUrl(null);
  };

  const toggleApproval = (id: string) => {
    const updated = participants.map((p) =>
      p.id === id ? { ...p, approved: !p.approved } : p
    );
    onUpdateParticipants(updated);
  };

  const toggleSelectAll = () => {
    const allApproved = participants.every((p) => p.approved);
    const updated = participants.map((p) => ({ ...p, approved: !allApproved }));
    onUpdateParticipants(updated);
  };

  const approvedCount = participants.filter((p) => p.approved).length;
  const missingEmailCount = participants.filter((p) => !p.email).length;

  const downloadAllAsZip = async () => {
    setZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('Certificates');

      for (const p of participants.filter((item) => item.approved)) {
        const blob = await fetchParticipantPdf(p);
        if (blob && folder) {
          const safeName = p.name.replace(/[^a-zA-Z0-9_-]/g, '_');
          folder.file(`${safeName}_Certificate.pdf`, blob);
        }
      }

      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, `Certificates_Batch_${new Date().toISOString().slice(0, 10)}.zip`);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242b3b]">
        <div>
          <div className="text-[11px] font-mono uppercase text-slate-400">Step 3 — Audit & Verification</div>
          <h2 className="text-lg font-bold text-white tracking-tight">Review & Approve Certificates</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded bg-[#1b202c] hover:bg-[#242b3b] border border-[#242b3b] text-xs font-medium text-slate-300 transition"
          >
            Back
          </button>
          <button
            onClick={downloadAllAsZip}
            disabled={zipping || approvedCount === 0}
            className="px-3 py-1.5 bg-[#1b202c] hover:bg-[#242b3b] border border-[#242b3b] rounded text-xs font-medium text-slate-200 transition flex items-center gap-1.5"
          >
            {zipping ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
            )}
            Download ZIP ({approvedCount})
          </button>
          <button
            onClick={onNextToSend}
            disabled={approvedCount === 0}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-semibold text-white transition flex items-center gap-1.5"
          >
            Proceed to Send ({approvedCount}) <Mail className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clean Utility Bar instead of 3 card bento */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#14171f] border border-[#242b3b] rounded text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Total:</span>
            <span className="font-mono font-semibold text-white">{participants.length}</span>
          </div>
          <div className="w-px h-3.5 bg-[#242b3b]" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Approved:</span>
            <span className="font-mono font-semibold text-emerald-400">{approvedCount}</span>
          </div>
          {missingEmailCount > 0 && (
            <>
              <div className="w-px h-3.5 bg-[#242b3b]" />
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{missingEmailCount} missing email</span>
              </div>
            </>
          )}
        </div>

        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition font-medium"
        >
          {participants.every((p) => p.approved) ? (
            <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Square className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>Toggle Select All</span>
        </button>
      </div>

      {/* Table of Generated Records */}
      <div className="bg-[#14171f] border border-[#242b3b] rounded overflow-hidden">
        <div className="overflow-x-auto max-h-[440px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c0e12] text-slate-400 uppercase tracking-wider sticky top-0 border-b border-[#242b3b]">
              <tr>
                <th className="px-3.5 py-2 w-10 text-center font-mono text-[11px]">Approve</th>
                <th className="px-3.5 py-2 font-mono text-[11px]">Recipient Name</th>
                <th className="px-3.5 py-2 font-mono text-[11px]">Destination Email</th>
                <th className="px-3.5 py-2 text-center font-mono text-[11px]">Status</th>
                <th className="px-3.5 py-2 text-right font-mono text-[11px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242b3b]">
              {participants.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-[#1b202c] transition ${!p.approved ? 'opacity-40' : ''}`}
                >
                  <td className="px-3.5 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={p.approved}
                      onChange={() => toggleApproval(p.id)}
                      className="w-3.5 h-3.5 rounded bg-[#0c0e12] border-[#242b3b] text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </td>
                  <td className="px-3.5 py-2 font-medium text-slate-200">
                    {p.name}
                  </td>
                  <td className="px-3.5 py-2 font-mono text-slate-400">
                    {p.email || <span className="text-amber-400/80 italic">No email</span>}
                  </td>
                  <td className="px-3.5 py-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                        p.status === 'sent'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : p.status === 'failed'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-[#1b202c] text-slate-400 border border-[#242b3b]'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-right">
                    <button
                      onClick={() => handleOpenPreview(p)}
                      className="px-2.5 py-1 bg-[#1b202c] hover:bg-[#242b3b] border border-[#242b3b] text-slate-300 hover:text-white rounded text-xs transition inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3 h-3 text-slate-400" /> Preview PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Modal Viewer */}
      {previewParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#14171f] border border-[#242b3b] rounded-lg w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#242b3b] bg-[#10131a]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#1b202c] text-slate-300 border border-[#242b3b] px-1.5 py-0.5 rounded font-mono">
                  Vector PDF
                </span>
                <span className="text-xs font-semibold text-white">
                  {previewParticipant.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {previewPdfUrl && (
                  <a
                    href={previewPdfUrl}
                    download={`${previewParticipant.name}_Certificate.pdf`}
                    className="px-2.5 py-1 bg-[#1b202c] hover:bg-[#242b3b] border border-[#242b3b] text-slate-200 text-xs rounded flex items-center gap-1 transition"
                  >
                    <FileDown className="w-3 h-3" /> Download
                  </a>
                )}
                <button
                  onClick={handleClosePreview}
                  className="p-1 hover:bg-[#1b202c] rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#0c0e12] p-4 flex items-center justify-center overflow-auto">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-slate-500" />
                  <span className="text-xs">Rendering certificate...</span>
                </div>
              ) : previewPdfUrl ? (
                <iframe
                  src={previewPdfUrl}
                  className="w-full h-full rounded border border-[#242b3b] bg-white"
                  title="PDF Preview"
                />
              ) : (
                <span className="text-xs text-rose-400">Failed to render preview.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
