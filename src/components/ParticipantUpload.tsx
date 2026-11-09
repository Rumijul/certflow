"use client";

import React, { useState } from 'react';
import { Participant } from '@/types';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { FileSpreadsheet, Upload, ArrowRight, UserCheck, AlertCircle, FileText } from 'lucide-react';

interface ParticipantUploadProps {
  participants: Participant[];
  onUpload: (participants: Participant[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ParticipantUpload({
  participants,
  onUpload,
  onNext,
  onBack,
}: ParticipantUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processData = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      setError('The uploaded file contains no rows.');
      return;
    }

    const firstRow = rows[0];
    const keys = Object.keys(firstRow);

    const nameKey = keys.find((k) =>
      /^(full[_\s]?name|name|participant|student|attendee)$/i.test(k.trim())
    ) || keys[0];

    const emailKey = keys.find((k) =>
      /^(email|e-mail|mail|email[_\s]?address)$/i.test(k.trim())
    ) || keys.find((k) => String(firstRow[k]).includes('@')) || keys[1];

    const parsedList: Participant[] = rows
      .filter((row) => row[nameKey] && String(row[nameKey]).trim().length > 0)
      .map((row, idx) => ({
        id: `p_${Date.now()}_${idx}`,
        name: String(row[nameKey]).trim(),
        email: emailKey && row[emailKey] ? String(row[emailKey]).trim() : '',
        customData: row,
        approved: true,
        status: 'pending',
      }));

    if (parsedList.length === 0) {
      setError('Could not extract any valid participant names from the file.');
      return;
    }

    setError(null);
    onUpload(parsedList);
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setError(null);

    const isCsv = file.name.endsWith('.csv');

    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data);
        },
        error: (err) => {
          setError('Failed to parse CSV: ' + err.message);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet);
          processData(json);
        } catch (err: any) {
          setError('Failed to parse Excel file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const loadSampleData = () => {
    const dummy = [
      { id: '1', name: 'Maria Cassandra Santos', email: 'cassandra.santos@gmail.com', approved: true, status: 'pending' as const },
      { id: '2', name: 'Juan Carlos Dela Cruz', email: 'juancarlos.delacruz@outlook.com', approved: true, status: 'pending' as const },
      { id: '3', name: 'Alexander Gabriel Montgomery III', email: 'alex.montgomery@domain.edu', approved: true, status: 'pending' as const },
      { id: '4', name: 'Chloe Francesca Reyes-Villanueva', email: 'chloe.reyes@gmail.com', approved: true, status: 'pending' as const },
      { id: '5', name: 'Mark Andrei Alcantara', email: 'andrei.alcantara@ess.edu.ph', approved: true, status: 'pending' as const },
    ];
    setFileName('sample_cohort_2026.xlsx');
    onUpload(dummy);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242b3b]">
        <div>
          <div className="text-[11px] font-mono uppercase text-slate-400">Step 2 — Roster Ingestion</div>
          <h2 className="text-lg font-bold text-white tracking-tight">Upload Participant Roster</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded bg-[#1b202c] hover:bg-[#242b3b] border border-[#242b3b] text-xs font-medium text-slate-300 transition"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={participants.length === 0}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-semibold text-white transition flex items-center gap-1.5"
          >
            Next: Review ({participants.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className={`border border-dashed rounded-lg p-6 text-center transition flex flex-col items-center justify-center min-h-[160px] ${
          dragActive
            ? 'border-blue-500 bg-blue-950/20'
            : 'border-[#242b3b] hover:border-slate-600 bg-[#14171f]'
        }`}
      >
        <FileSpreadsheet className="w-6 h-6 text-slate-400 mb-2" />
        <h3 className="text-sm font-semibold text-white">Drop .xlsx, .xls, or .csv roster</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-0.5">
          Columns for Name and Email will be automatically detected.
        </p>

        <div className="flex items-center gap-2 mt-4">
          <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold cursor-pointer transition flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Select File
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
              className="hidden"
            />
          </label>
          <span className="text-xs text-slate-600">or</span>
          <button
            type="button"
            onClick={loadSampleData}
            className="px-3 py-1.5 bg-[#1b202c] hover:bg-[#242b3b] text-slate-300 rounded text-xs font-medium border border-[#242b3b] transition"
          >
            Load 5 Test Records
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Participants Preview Table */}
      {participants.length > 0 && (
        <div className="bg-[#14171f] border border-[#242b3b] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#242b3b] bg-[#10131a]">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Roster Preview ({participants.length} entries)
              </span>
            </div>
            {fileName && (
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 bg-[#1b202c] px-2 py-0.5 rounded border border-[#242b3b]">
                <FileText className="w-3 h-3 text-slate-400" /> {fileName}
              </span>
            )}
          </div>

          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0e12] text-slate-400 uppercase tracking-wider sticky top-0 border-b border-[#242b3b]">
                <tr>
                  <th className="px-3.5 py-2 font-mono text-[11px]">#</th>
                  <th className="px-3.5 py-2 font-mono text-[11px]">Participant Name</th>
                  <th className="px-3.5 py-2 font-mono text-[11px]">Email</th>
                  <th className="px-3.5 py-2 font-mono text-[11px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242b3b]">
                {participants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-[#1b202c] transition">
                    <td className="px-3.5 py-2 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="px-3.5 py-2 font-medium text-slate-200">{p.name}</td>
                    <td className="px-3.5 py-2 text-slate-400 font-mono">
                      {p.email || <span className="text-amber-400/80 italic">No email</span>}
                    </td>
                    <td className="px-3.5 py-2 text-right">
                      <button
                        onClick={() => {
                          const updated = participants.filter((item) => item.id !== p.id);
                          onUpload(updated);
                        }}
                        className="text-slate-500 hover:text-rose-400 transition text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
