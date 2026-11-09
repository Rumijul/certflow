"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CertificateTemplate, TemplateField } from '@/types';
import {
  Upload,
  Move,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Trash2,
  Plus,
  Eye,
  Check,
  Type,
  Maximize2
} from 'lucide-react';

interface TemplateEditorProps {
  template: CertificateTemplate;
  onChange: (template: CertificateTemplate) => void;
  onNext: () => void;
}

export function TemplateEditor({ template, onChange, onNext }: TemplateEditorProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(template.fields[0]?.id || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sampleLongName, setSampleLongName] = useState(false);

  const selectedField = template.fields.find((f) => f.id === selectedFieldId) || template.fields[0];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onChange({
          ...template,
          imageDataUrl: dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          imageFilename: file.name,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const updateSelectedField = (updates: Partial<TemplateField>) => {
    if (!selectedField) return;
    const updatedFields = template.fields.map((f) =>
      f.id === selectedField.id ? { ...f, ...updates } : f
    );
    onChange({ ...template, fields: updatedFields });
  };

  const addCustomField = () => {
    const newField: TemplateField = {
      id: 'field_' + Math.random().toString(36).substring(2, 9),
      name: 'Custom Field',
      key: 'custom_' + (template.fields.length + 1),
      x: 30,
      y: 60,
      width: 40,
      fontSize: 24,
      fontFamily: 'Helvetica',
      color: '#1e293b',
      align: 'center',
      bold: false,
    };
    onChange({
      ...template,
      fields: [...template.fields, newField],
    });
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    if (template.fields.length <= 1) return; // Keep at least one
    const updated = template.fields.filter((f) => f.id !== id);
    onChange({ ...template, fields: updated });
    setSelectedFieldId(updated[0]?.id || null);
  };

  // Mouse handlers for dragging field box on canvas
  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || !selectedField) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let newX = (mouseX / rect.width) * 100 - selectedField.width / 2;
      let newY = (mouseY / rect.height) * 100 - 3; // Center vertically on drag cursor

      // Clamping bounds
      newX = Math.max(0, Math.min(100 - selectedField.width, newX));
      newY = Math.max(0, Math.min(95, newY));

      updateSelectedField({ x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedField]);

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Step 1 of 6</span>
          <h2 className="text-2xl font-bold text-white tracking-tight">Select or Upload Certificate Template</h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload your certificate design and visually position the participant name and details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 cursor-pointer transition shadow-sm">
            <Upload className="w-4 h-4 text-indigo-400" />
            Upload New Template
            <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} className="hidden" />
          </label>
          <button
            onClick={onNext}
            disabled={!template.imageDataUrl}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            Confirm & Next: Participants <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Canvas Area */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-8 min-h-[500px]">
          {template.imageDataUrl ? (
            <div className="relative w-full max-w-4xl select-none group">
              {/* Outer container matching certificate aspect ratio */}
              <div
                ref={containerRef}
                className="relative overflow-hidden rounded-xl shadow-2xl border border-slate-800 bg-white"
                style={{
                  aspectRatio: `${template.width || 1920} / ${template.height || 1080}`,
                }}
              >
                {/* Background Certificate Image */}
                <img
                  src={template.imageDataUrl}
                  alt="Certificate Template"
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Interactive Dynamic Text Placeholders */}
                {template.fields.map((field) => {
                  const isSelected = selectedField?.id === field.id;
                  const displayName =
                    field.key === 'name'
                      ? sampleLongName
                        ? 'Maria Alexandra De Los Santos-Hernandez'
                        : '{{Full Name}}'
                      : `{{${field.name}}}`;

                  return (
                    <div
                      key={field.id}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                      style={{
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        width: `${field.width}%`,
                        color: field.color,
                        fontFamily:
                          field.fontFamily === 'Times-Roman'
                            ? 'serif'
                            : field.fontFamily === 'Courier'
                            ? 'monospace'
                            : 'sans-serif',
                        fontWeight: field.bold ? 'bold' : 'normal',
                        textAlign: field.align,
                      }}
                      className={`absolute cursor-move px-2 py-1 transition-shadow ${
                        isSelected
                          ? 'border-2 border-indigo-500 bg-indigo-500/10 shadow-lg ring-2 ring-indigo-400/20 rounded'
                          : 'border border-dashed border-slate-400/50 hover:border-indigo-400 bg-white/20 backdrop-blur-[1px]'
                      }`}
                    >
                      <div className="truncate text-center" style={{ fontSize: `clamp(10px, 2.5vw, ${field.fontSize}px)` }}>
                        {displayName}
                      </div>

                      {isSelected && (
                        <div className="absolute -top-6 left-0 bg-indigo-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
                          {field.name} ({field.x.toFixed(0)}%, {field.y.toFixed(0)}%)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Canvas Helpers */}
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 px-2">
                <span className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-indigo-400" /> Click and drag the box to adjust position
                </span>
                <button
                  type="button"
                  onClick={() => setSampleLongName(!sampleLongName)}
                  className="hover:text-indigo-400 flex items-center gap-1 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {sampleLongName ? 'Show Placeholder' : 'Test Long Name (Overflow check)'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-4">
              <Upload className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
              <p className="text-sm text-slate-400">No template loaded. Choose an image to begin.</p>
            </div>
          )}
        </div>

        {/* Property Inspector & Field Controls */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-400" /> Field Properties
            </h3>
            <button
              onClick={addCustomField}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Field
            </button>
          </div>

          {/* Active Field Selector Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {template.fields.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFieldId(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedField?.id === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          {selectedField ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Field Label</label>
                <input
                  type="text"
                  value={selectedField.name}
                  onChange={(e) => updateSelectedField({ name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              {/* Font Family & Style */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Font Style</label>
                  <select
                    value={selectedField.fontFamily}
                    onChange={(e: any) => updateSelectedField({ fontFamily: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  >
                    <option value="Helvetica">Modern (Helvetica)</option>
                    <option value="Times-Roman">Classic (Times Serif)</option>
                    <option value="Courier">Monospace (Courier)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedField.color}
                      onChange={(e) => updateSelectedField({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedField.color}
                      onChange={(e) => updateSelectedField({ color: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Font Size & Weight */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold">Base Font Size</span>
                  <span className="font-mono">{selectedField.fontSize}pt</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="72"
                  value={selectedField.fontSize}
                  onChange={(e) => updateSelectedField({ fontSize: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Bounding Box Width (Safe Zone) */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold">Safe Box Width</span>
                  <span className="font-mono">{selectedField.width}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  value={selectedField.width}
                  onChange={(e) => updateSelectedField({ width: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Text auto-shrinks if a participant's name exceeds this safe boundary.
                </p>
              </div>

              {/* Alignment & Bold */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => updateSelectedField({ align: 'left' })}
                    className={`p-1.5 rounded-lg ${
                      selectedField.align === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateSelectedField({ align: 'center' })}
                    className={`p-1.5 rounded-lg ${
                      selectedField.align === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateSelectedField({ align: 'right' })}
                    className={`p-1.5 rounded-lg ${
                      selectedField.align === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => updateSelectedField({ bold: !selectedField.bold })}
                  className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                    selectedField.bold
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" /> Bold
                </button>
              </div>

              {/* Danger: Delete Field */}
              {template.fields.length > 1 && (
                <button
                  onClick={() => removeField(selectedField.id)}
                  className="w-full mt-4 py-2 border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Field
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
