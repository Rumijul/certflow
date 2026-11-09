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
    <div className="min-h-screen bg-[#0c0e12] text-slate-200 flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="border-b border-[#242b3b] bg-[#14171f] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">CertFlow</span>
                <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                  v1.0
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#1b202c] border border-[#242b3b] text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Offline-ready</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded bg-[#1b202c] hover:bg-[#242b3b] border border-[#242b3b] hover:text-white text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Stepper Bar */}
      <div className="border-b border-[#242b3b] bg-[#10131a] py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between md:justify-center md:gap-8 overflow-x-auto">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = currentStep === s.number;
              const isPast = currentStep > s.number;

              return (
                <React.Fragment key={s.number}>
                  <button
                    onClick={() => setCurrentStep(s.number)}
                    className={`flex items-center gap-2.5 text-xs font-medium transition shrink-0 ${
                      isActive
                        ? 'text-white'
                        : isPast
                        ? 'text-emerald-400 hover:text-white'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-semibold transition ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isPast
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-[#1b202c] text-slate-400 border border-[#242b3b]'
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
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden md:block shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
