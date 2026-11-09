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

    // Attempt to detect column headers
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);

    // Heuristics for name & email columns
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
    setFileName('sample_work_immersion_cohort.xlsx');
    onUpload(dummy);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Step 2 of 6</span>
          <h2 className="text-2xl font-bold text-white tracking-tight">Upload Participant List</h2>
          <p className="text-sm text-slate-400 mt-1">
            Drop an Excel (.xlsx/.xls) or CSV file containing participant names and email addresses.
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
            onClick={onNext}
            disabled={participants.length === 0}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            Generate Certificates ({participants.length}) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
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
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center min-h-[220px] ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
        }`}
      >
        <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-white">Drag & drop your Excel or CSV roster</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Supports columns for <strong>Full Name</strong> and <strong>Email Address</strong>. Extra columns will be preserved automatically.
        </p>

        <div className="flex items-center gap-3 mt-5">
          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md transition flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Browse Files
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
          <span className="text-xs text-slate-500">or</span>
          <button
            type="button"
            onClick={loadSampleData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            Load 5 Test Records
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Participants Preview Table */}
      {participants.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Detected Participants ({participants.length})
              </h3>
            </div>
            {fileName && (
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg">
                <FileText className="w-3 h-3 text-indigo-400" /> {fileName}
              </span>
            )}
          </div>

          <div className="overflow-x-auto max-h-[340px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Participant Full Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {participants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-850/50 transition">
                    <td className="px-4 py-3 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {p.email || <span className="text-amber-500/80 italic">No email</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          const updated = participants.filter((item) => item.id !== p.id);
                          onUpload(updated);
                        }}
                        className="text-slate-500 hover:text-rose-400 transition"
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
