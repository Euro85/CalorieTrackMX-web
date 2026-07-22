'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, CheckCircle, Brain, Key } from 'lucide-react';
import { loadAISettings, saveAISettings } from '@/lib/aiService';
import type { AISettings, AIProvider } from '@/lib/types';

const PROVIDERS: { value: AIProvider; label: string; models: string[] }[] = [
  {
    value: 'anthropic',
    label: 'Anthropic (Claude)',
    models: [
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-6',
      'claude-opus-4-8',
    ],
  },
  {
    value: 'openai',
    label: 'OpenAI (GPT)',
    models: [
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4-turbo',
    ],
  },
  {
    value: 'gemini',
    label: 'Google (Gemini)',
    models: [
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AISettings>({ provider: 'anthropic', apiKey: '', model: 'claude-haiku-4-5-20251001' });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setSettings(loadAISettings()); }, []);

  const handleSave = () => {
    saveAISettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedProvider = PROVIDERS.find(p => p.value === settings.provider)!;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configuración del portal profesional</p>
      </div>

      {/* NutriIA section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-prof-50 flex items-center justify-center">
            <Brain size={18} className="text-prof-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">NutriIA — Asistente de IA</h2>
            <p className="text-xs text-gray-400">Configura tu proveedor de IA para las consultas</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setSettings(s => ({ ...s, provider: p.value, model: p.models[0] }))}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                    settings.provider === p.value
                      ? 'border-prof-500 bg-prof-50 text-prof-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
            <select
              value={settings.model}
              onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-prof-500 bg-white"
            >
              {selectedProvider.models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Key size={13} />
                API Key ({selectedProvider.label})
              </span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-prof-500"
                placeholder="sk-... o api-key-..."
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Tu clave se guarda localmente en este navegador. Nunca se envía a nuestros servidores.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-prof-600 hover:bg-prof-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            {saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saved ? 'Guardado' : 'Guardar ajustes de NutriIA'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm text-amber-800 font-medium mb-1">¿Cómo obtener una API Key?</p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>Anthropic: <span className="font-mono">console.anthropic.com</span></li>
          <li>OpenAI: <span className="font-mono">platform.openai.com/api-keys</span></li>
          <li>Gemini: <span className="font-mono">aistudio.google.com/apikey</span></li>
        </ul>
      </div>
    </div>
  );
}
