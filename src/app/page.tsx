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
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    imageOverlays: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [participants, setParticipants] = useState<Participant[]>([]);

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
    { number: 1, label: 'Design & Overlays', icon: Layers, desc: 'Canvas layout' },
    { number: 2, label: 'Upload Roster', icon: Users, desc: 'Excel / CSV' },
    { number: 3, label: 'Audit & Approve', icon: CheckCircle2, desc: 'Vector preview' },
    { number: 4, label: 'Dispatch & Flex', icon: Send, desc: 'Email + LinkedIn' },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Modern Top Navigation Bar */}
      <header className="border-b border-white/[0.07] bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  Cert<span className="text-indigo-400">Flow</span>
                </span>
                <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                  Immersion Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Next-Gen Certificate Generation & Dispatch Rail</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Offline-First Engine</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 rounded-xl border border-white/[0.08] bg-slate-900/90 hover:bg-slate-800 hover:text-white text-slate-300 text-xs font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Stepper Progress Bar */}
      <div className="border-b border-white/[0.05] bg-slate-950/40 backdrop-blur-md py-3.5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between md:justify-center md:gap-8 overflow-x-auto py-1">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = currentStep === s.number;
              const isPast = currentStep > s.number;

              return (
                <React.Fragment key={s.number}>
                  <button
                    onClick={() => setCurrentStep(s.number)}
                    className={`flex items-center gap-3 text-xs font-medium transition shrink-0 group ${
                      isActive
                        ? 'text-white'
                        : isPast
                        ? 'text-emerald-400 hover:text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                          : isPast
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-400 border border-white/[0.05] group-hover:border-white/[0.15]'
                      }`}
                    >
                      {isPast ? '✓' : s.number}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-xs leading-none">{s.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.desc}</div>
                    </div>
                  </button>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-slate-700 hidden md:block shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 relative z-10">
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

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-slate-950/60 py-4 text-center text-xs text-slate-400 relative z-10">
        <span>CertFlow v1.0 • Designed for Senior High School Work Immersion Cohorts</span>
      </footer>

      {/* SMTP / App Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
