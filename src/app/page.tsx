"use client";

import React, { useState, useEffect } from 'react';
import { CertificateTemplate, Participant } from '@/types';
import { TemplateEditor } from '@/components/TemplateEditor';
import { ParticipantUpload } from '@/components/ParticipantUpload';
import { CertificateReview } from '@/components/CertificateReview';
import { CertificateDispatcher } from '@/components/CertificateDispatcher';
import { SettingsModal } from '@/components/SettingsModal';
import {
  Award,
  Layers,
  Users,
  CheckCircle2,
  Send,
  Settings,
} from 'lucide-react';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Default initial template
  const [template, setTemplate] = useState<CertificateTemplate>({
    id: 'tpl_default',
    title: 'Executive Certificate Template',
    imageFilename: 'sample-template.png',
    imageDataUrl: '/sample-template.png',
    width: 1920,
    height: 1080,
    fields: [
      {
        id: 'f_name',
        name: 'Participant Name',
        key: 'name',
        x: 15,
        y: 35,
        width: 70,
        fontSize: 44,
        fontFamily: 'Times-Roman',
        color: '#0f172a',
        align: 'center',
        bold: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [participants, setParticipants] = useState<Participant[]>([]);

  // Auto-convert public image to Data URL on mount for standalone PDF generation
  useEffect(() => {
    fetch('/sample-template.png')
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setTemplate((prev) => ({
            ...prev,
            imageDataUrl: reader.result as string,
          }));
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => console.error('Failed to load default template image:', err));
  }, []);

  const steps = [
    { number: 1, label: 'Template & Design', icon: Layers },
    { number: 2, label: 'Upload Roster', icon: Users },
    { number: 3, label: 'Review & Approve', icon: CheckCircle2 },
    { number: 4, label: 'Send & Deliver', icon: Send },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">CertFlow</h1>
                <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-semibold">
                  Immersion MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Offline-first Certificate Issuance System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:text-white text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Step Stepper Progress Bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between sm:justify-center sm:gap-12 overflow-x-auto py-1">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = currentStep === s.number;
              const isPast = currentStep > s.number;

              return (
                <button
                  key={s.number}
                  onClick={() => setCurrentStep(s.number)}
                  className={`flex items-center gap-2.5 text-xs font-semibold transition shrink-0 ${
                    isActive
                      ? 'text-indigo-400'
                      : isPast
                      ? 'text-emerald-400 hover:text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                        : isPast
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.number}
                  </div>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {currentStep === 1 && (
          <TemplateEditor
            template={template}
            onChange={setTemplate}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <ParticipantUpload
            participants={participants}
            onUpload={setParticipants}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <CertificateReview
            template={template}
            participants={participants}
            onUpdateParticipants={setParticipants}
            onNextToSend={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <CertificateDispatcher
            template={template}
            participants={participants}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onBack={() => setCurrentStep(3)}
          />
        )}
      </main>

      {/* SMTP / App Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
