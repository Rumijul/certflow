"use client";

import React, { useState, useEffect } from 'react';
import { CertificateTemplate, Participant } from '@/types';
import {
  CheckCircle,
  Eye,
  FileDown,
  Mail,
  RefreshCw,
  X,
  ExternalLink,
  CheckSquare,
  Square,
  AlertTriangle,
  Sparkles
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
  const [generating, setGenerating] = useState(false);
  const [previewParticipant, setPreviewParticipant] = useState<Participant | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zipping, setZipping] = useState(false);

  // Generate certificate PDF on the fly for a given participant
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Step 3 & 4 of 6</span>
          <h2 className="text-2xl font-bold text-white tracking-tight">Review & Approve Certificates</h2>
          <p className="text-sm text-slate-400 mt-1">
            Audit generated certificates, test layout centering, and approve recipients before distribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-400 transition"
          >
            Back
          </button>
          <button
            onClick={downloadAllAsZip}
            disabled={zipping || approvedCount === 0}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
          >
            {zipping ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-indigo-400" />
            )}
            Download ZIP ({approvedCount})
          </button>
          <button
            onClick={onNextToSend}
            disabled={approvedCount === 0}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            Proceed to Send ({approvedCount}) <Mail className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Review Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Participants</div>
            <div className="text-2xl font-bold text-white">{participants.length}</div>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl text-slate-300">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Approved for Dispatch</div>
            <div className="text-2xl font-bold text-emerald-400">{approvedCount}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Missing Email Warning</div>
            <div className="text-2xl font-bold text-amber-400">
              {participants.filter((p) => !p.email).length}
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table of Generated Records */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            {participants.every((p) => p.approved) ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            Select All Approved
          </button>

          <span className="text-xs text-slate-400">
            Click <strong>Preview PDF</strong> to inspect real alignment & font auto-shrink
          </span>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 w-12 text-center">Approve</th>
                <th className="px-4 py-3">Recipient Name</th>
                <th className="px-4 py-3">Destination Email</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {participants.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-850/50 transition ${!p.approved ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={p.approved}
                      onChange={() => toggleApproval(p.id)}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {p.email || <span className="text-amber-500 italic">No email provided</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        p.status === 'sent'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : p.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleOpenPreview(p)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview PDF
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                  Live Vector PDF
                </span>
                <h3 className="text-sm font-bold text-white">
                  Preview: {previewParticipant.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {previewPdfUrl && (
                  <a
                    href={previewPdfUrl}
                    download={`${previewParticipant.name}_Certificate.pdf`}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Download
                  </a>
                )}
                <button
                  onClick={handleClosePreview}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-xs">Rendering high-res certificate with auto-shrink calculations...</p>
                </div>
              ) : previewPdfUrl ? (
                <iframe
                  src={previewPdfUrl}
                  className="w-full h-full rounded-xl border border-slate-800 shadow-2xl bg-white"
                  title="PDF Preview"
                />
              ) : (
                <p className="text-xs text-rose-400">Failed to render preview.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
