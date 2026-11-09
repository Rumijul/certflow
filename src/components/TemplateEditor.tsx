"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CertificateTemplate, TemplateField, TemplateImageOverlay } from '@/types';
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
  Image as ImageIcon,
  PenTool,
  Stamp
} from 'lucide-react';

interface TemplateEditorProps {
  template: CertificateTemplate;
  onChange: (template: CertificateTemplate) => void;
  onNext: () => void;
}

export function TemplateEditor({ template, onChange, onNext }: TemplateEditorProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(template.fields[0]?.id || null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  const [isDraggingField, setIsDraggingField] = useState(false);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sampleLongName, setSampleLongName] = useState(false);

  const selectedField = template.fields.find((f) => f.id === selectedFieldId) || template.fields[0];
  const selectedOverlay = template.imageOverlays?.find((o) => o.id === selectedOverlayId);

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

  const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'logo' | 'seal') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight || 1;
        const newOverlay: TemplateImageOverlay = {
          id: 'ov_' + Math.random().toString(36).substring(2, 9),
          name: file.name.replace(/\.[^/.]+$/, ''),
          type,
          dataUrl,
          x: type === 'signature' ? 68 : type === 'seal' ? 47 : 10,
          y: type === 'signature' ? 76 : type === 'seal' ? 76 : 10,
          width: type === 'signature' ? 20 : type === 'seal' ? 8 : 12,
          aspectRatio,
        };

        const currentOverlays = template.imageOverlays || [];
        onChange({
          ...template,
          imageOverlays: [...currentOverlays, newOverlay],
        });
        setSelectedOverlayId(newOverlay.id);
        setActiveTab('image');
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

  const updateSelectedOverlay = (updates: Partial<TemplateImageOverlay>) => {
    if (!selectedOverlay) return;
    const current = template.imageOverlays || [];
    const updated = current.map((o) =>
      o.id === selectedOverlay.id ? { ...o, ...updates } : o
    );
    onChange({ ...template, imageOverlays: updated });
  };

  const removeOverlay = (id: string) => {
    const current = template.imageOverlays || [];
    const filtered = current.filter((o) => o.id !== id);
    onChange({ ...template, imageOverlays: filtered });
    setSelectedOverlayId(filtered[0]?.id || null);
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
    setActiveTab('text');
  };

  const removeField = (id: string) => {
    if (template.fields.length <= 1) return;
    const updated = template.fields.filter((f) => f.id !== id);
    onChange({ ...template, fields: updated });
    setSelectedFieldId(updated[0]?.id || null);
  };

  // Dragging field handlers
  const handleMouseDownField = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    setSelectedOverlayId(null);
    setActiveTab('text');
    setIsDraggingField(true);
  };

  // Dragging overlay handlers
  const handleMouseDownOverlay = (e: React.MouseEvent, overlayId: string) => {
    e.stopPropagation();
    setSelectedOverlayId(overlayId);
    setSelectedFieldId(null);
    setActiveTab('image');
    setIsDraggingOverlay(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDraggingField && selectedField) {
        let newX = (mouseX / rect.width) * 100 - selectedField.width / 2;
        let newY = (mouseY / rect.height) * 100 - 3;
        newX = Math.max(0, Math.min(100 - selectedField.width, newX));
        newY = Math.max(0, Math.min(95, newY));
        updateSelectedField({ x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
      }

      if (isDraggingOverlay && selectedOverlay) {
        let newX = (mouseX / rect.width) * 100 - selectedOverlay.width / 2;
        let newY = (mouseY / rect.height) * 100 - 3;
        newX = Math.max(0, Math.min(100 - selectedOverlay.width, newX));
        newY = Math.max(0, Math.min(95, newY));
        updateSelectedOverlay({ x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingField(false);
      setIsDraggingOverlay(false);
    };

    if (isDraggingField || isDraggingOverlay) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingField, isDraggingOverlay, selectedField, selectedOverlay]);

  return (
    <div className="space-y-4">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242b3b]">
        <div>
          <div className="text-[11px] font-mono uppercase text-slate-400">Step 1 — Template & Layout</div>
          <h2 className="text-lg font-bold text-white tracking-tight">Configure Certificate Template</h2>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b202c] hover:bg-[#242b3b] border border-[#242b3b] rounded text-xs font-medium text-slate-200 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            Upload Background
            <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} className="hidden" />
          </label>
          <button
            onClick={onNext}
            disabled={!template.imageDataUrl}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-semibold text-white transition flex items-center gap-1.5"
          >
            Next: Participants <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visual Canvas Area */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-[#10131a] border border-[#242b3b] rounded-lg p-4 min-h-[460px]">
          {template.imageDataUrl ? (
            <div className="relative w-full max-w-4xl select-none group">
              <div
                ref={containerRef}
                className="relative overflow-hidden rounded border border-[#242b3b] bg-white [container-type:size]"
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

                {/* Image Overlays */}
                {template.imageOverlays?.map((overlay) => {
                  const isSelected = selectedOverlay?.id === overlay.id;

                  return (
                    <div
                      key={overlay.id}
                      onMouseDown={(e) => handleMouseDownOverlay(e, overlay.id)}
                      style={{
                        left: `${overlay.x}%`,
                        top: `${overlay.y}%`,
                        width: `${overlay.width}%`,
                      }}
                      className={`absolute cursor-move select-none p-1 transition-all ${
                        isSelected
                          ? 'border-2 border-amber-500 bg-amber-500/10'
                          : 'border border-dashed border-slate-500/60 hover:border-amber-400'
                      }`}
                    >
                      <img
                        src={overlay.dataUrl}
                        alt={overlay.name}
                        className="w-full h-auto object-contain pointer-events-none"
                      />
                      {isSelected && (
                        <div className="absolute -top-5 left-0 bg-amber-600 text-white text-[10px] font-mono px-1 py-0.2 rounded whitespace-nowrap">
                          {overlay.name} ({overlay.x.toFixed(0)}%, {overlay.y.toFixed(0)}%)
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Text Placeholders */}
                {template.fields.map((field) => {
                  const isSelected = selectedField?.id === field.id && !selectedOverlayId;
                  const displayName =
                    field.key === 'name'
                      ? sampleLongName
                        ? 'Maria Alexandra De Los Santos-Hernandez'
                        : '{{Full Name}}'
                      : `{{${field.name}}}`;

                  return (
                    <div
                      key={field.id}
                      onMouseDown={(e) => handleMouseDownField(e, field.id)}
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
                      className={`absolute cursor-move select-none transition-all ${
                        isSelected
                          ? 'border-2 border-blue-500 bg-blue-500/10'
                          : 'border border-dashed border-slate-500/60 hover:border-blue-400'
                      }`}
                    >
                      <div
                        className="truncate leading-none"
                        style={{
                          fontSize: `calc(${field.fontSize} * (100cqh / 1080))`,
                        }}
                      >
                        {displayName}
                      </div>

                      {isSelected && (
                        <div className="absolute -top-5 left-0 bg-blue-600 text-white text-[10px] font-mono px-1 py-0.2 rounded whitespace-nowrap">
                          {field.name} ({field.x.toFixed(0)}%, {field.y.toFixed(0)}%)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Helpers */}
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
                <span className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-slate-400" /> Click and drag boxes to position
                </span>
                <button
                  type="button"
                  onClick={() => setSampleLongName(!sampleLongName)}
                  className="hover:text-blue-400 flex items-center gap-1 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {sampleLongName ? 'Show Placeholder' : 'Test Long Name'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-2">
              <Upload className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No template loaded. Choose an image to begin.</p>
            </div>
          )}
        </div>

        {/* Inspector Panel */}
        <div className="lg:col-span-4 bg-[#14171f] border border-[#242b3b] rounded-lg p-4 space-y-4">
          {/* Segmented Switcher */}
          <div className="flex bg-[#0c0e12] p-0.5 rounded border border-[#242b3b]">
            <button
              onClick={() => {
                setActiveTab('text');
                setSelectedOverlayId(null);
                if (!selectedFieldId) setSelectedFieldId(template.fields[0]?.id || null);
              }}
              className={`flex-1 py-1 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition ${
                activeTab === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-3 h-3" /> Text Fields
            </button>
            <button
              onClick={() => {
                setActiveTab('image');
                setSelectedFieldId(null);
                if (!selectedOverlayId && template.imageOverlays?.length) {
                  setSelectedOverlayId(template.imageOverlays[0].id);
                }
              }}
              className={`flex-1 py-1 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition ${
                activeTab === 'image'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" /> Overlays
            </button>
          </div>

          {/* TAB 1: TEXT FIELDS */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#242b3b]">
                <span className="text-[11px] font-mono uppercase text-slate-400">Variables</span>
                <button
                  onClick={addCustomField}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Field
                </button>
              </div>

              {/* Active Field Tabs */}
              <div className="flex flex-wrap gap-1">
                {template.fields.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFieldId(f.id);
                      setSelectedOverlayId(null);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      selectedField?.id === f.id && !selectedOverlayId
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1b202c] text-slate-400 hover:text-slate-200 border border-[#242b3b]'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {selectedField ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Field Name</label>
                    <input
                      type="text"
                      value={selectedField.name}
                      onChange={(e) => updateSelectedField({ name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#0c0e12] border border-[#242b3b] rounded text-xs text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Font Family</label>
                      <select
                        value={selectedField.fontFamily}
                        onChange={(e: any) => updateSelectedField({ fontFamily: e.target.value })}
                        className="w-full px-2 py-1.5 bg-[#0c0e12] border border-[#242b3b] rounded text-xs text-slate-200"
                      >
                        <option value="Helvetica">Modern (Sans)</option>
                        <option value="Times-Roman">Classic (Serif)</option>
                        <option value="Courier">Monospace</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedField.color}
                          onChange={(e) => updateSelectedField({ color: e.target.value })}
                          className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedField.color}
                          onChange={(e) => updateSelectedField({ color: e.target.value })}
                          className="flex-1 px-2 py-1 bg-[#0c0e12] border border-[#242b3b] rounded text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Base Font Size</span>
                      <span className="font-mono text-slate-300">{selectedField.fontSize}pt</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="72"
                      value={selectedField.fontSize}
                      onChange={(e) => updateSelectedField({ fontSize: Number(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Safe Boundary Width</span>
                      <span className="font-mono text-slate-300">{selectedField.width}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="95"
                      value={selectedField.width}
                      onChange={(e) => updateSelectedField({ width: Number(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center bg-[#0c0e12] border border-[#242b3b] rounded p-0.5 gap-0.5">
                      <button
                        onClick={() => updateSelectedField({ align: 'left' })}
                        className={`p-1 rounded ${
                          selectedField.align === 'left' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlignLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateSelectedField({ align: 'center' })}
                        className={`p-1 rounded ${
                          selectedField.align === 'center' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlignCenter className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateSelectedField({ align: 'right' })}
                        className={`p-1 rounded ${
                          selectedField.align === 'right' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlignRight className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => updateSelectedField({ bold: !selectedField.bold })}
                      className={`px-2.5 py-1 border rounded text-xs font-semibold flex items-center gap-1 ${
                        selectedField.bold
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                          : 'border-[#242b3b] text-slate-400 hover:text-white'
                      }`}
                    >
                      <Bold className="w-3 h-3" /> Bold
                    </button>
                  </div>

                  {template.fields.length > 1 && (
                    <button
                      onClick={() => removeField(selectedField.id)}
                      className="w-full mt-2 py-1.5 border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 text-xs rounded transition flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Field
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: IMAGE OVERLAYS */}
          {activeTab === 'image' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center p-2.5 border border-[#242b3b] hover:border-amber-500 bg-[#0c0e12] rounded cursor-pointer transition text-center">
                  <PenTool className="w-4 h-4 text-amber-400 mb-1" />
                  <span className="text-xs font-medium text-slate-200">+ Signature</span>
                  <span className="text-[10px] text-slate-500">PNG</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => handleOverlayUpload(e, 'signature')}
                    className="hidden"
                  />
                </label>

                <label className="flex flex-col items-center justify-center p-2.5 border border-[#242b3b] hover:border-blue-500 bg-[#0c0e12] rounded cursor-pointer transition text-center">
                  <Stamp className="w-4 h-4 text-blue-400 mb-1" />
                  <span className="text-xs font-medium text-slate-200">+ Logo / Seal</span>
                  <span className="text-[10px] text-slate-500">Badge / Crest</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => handleOverlayUpload(e, 'logo')}
                    className="hidden"
                  />
                </label>
              </div>

              {template.imageOverlays && template.imageOverlays.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-mono uppercase text-slate-400">Active Overlays:</span>
                  <div className="flex flex-wrap gap-1">
                    {template.imageOverlays.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => {
                          setSelectedOverlayId(o.id);
                          setSelectedFieldId(null);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                          selectedOverlay?.id === o.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-[#1b202c] text-slate-400 hover:text-slate-200 border border-[#242b3b]'
                        }`}
                      >
                        {o.type === 'signature' ? <PenTool className="w-3 h-3" /> : <Stamp className="w-3 h-3" />}
                        {o.name}
                      </button>
                    ))}
                  </div>

                  {selectedOverlay && (
                    <div className="p-3 bg-[#0c0e12] border border-[#242b3b] rounded space-y-3 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white capitalize">
                          {selectedOverlay.name} ({selectedOverlay.type})
                        </span>
                        <button
                          onClick={() => removeOverlay(selectedOverlay.id)}
                          className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Scale / Width</span>
                          <span className="font-mono text-slate-300">{selectedOverlay.width}%</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="40"
                          value={selectedOverlay.width}
                          onChange={(e) => updateSelectedOverlay({ width: Number(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center border border-dashed border-[#242b3b] rounded text-xs text-slate-500">
                  No overlays added yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
