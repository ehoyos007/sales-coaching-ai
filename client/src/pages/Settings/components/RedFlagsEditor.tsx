import React, { useState } from 'react';
import type { RubricRedFlag, RedFlagInput, RedFlagSeverity, ThresholdType } from '../../../types';

interface RedFlagsEditorProps {
  redFlags: RubricRedFlag[];
  onUpdateRedFlag: (index: number, updates: Partial<RedFlagInput>) => void;
  onAddRedFlag: (flag: RedFlagInput) => void;
  onRemoveRedFlag: (index: number) => void;
  isEditable: boolean;
}

const SEVERITY_CONFIG: Record<RedFlagSeverity, { label: string; color: string; bgColor: string; borderColor: string }> = {
  critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  high: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  medium: { label: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
};

export const RedFlagsEditor: React.FC<RedFlagsEditorProps> = ({
  redFlags,
  onUpdateRedFlag,
  onAddRedFlag,
  onRemoveRedFlag,
  isEditable,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFlag, setNewFlag] = useState<Partial<RedFlagInput>>({
    flag_key: '',
    display_name: '',
    description: '',
    severity: 'medium',
    threshold_type: 'boolean',
    is_enabled: true,
  });

  // Group flags by severity
  const groupedFlags = {
    critical: redFlags.filter(f => f.severity === 'critical'),
    high: redFlags.filter(f => f.severity === 'high'),
    medium: redFlags.filter(f => f.severity === 'medium'),
  };

  const handleAddFlag = () => {
    if (!newFlag.flag_key || !newFlag.display_name || !newFlag.description || !newFlag.severity) return;

    onAddRedFlag({
      flag_key: newFlag.flag_key,
      display_name: newFlag.display_name,
      description: newFlag.description,
      severity: newFlag.severity,
      threshold_type: newFlag.threshold_type,
      threshold_value: newFlag.threshold_value,
      is_enabled: newFlag.is_enabled ?? true,
    });

    setNewFlag({
      flag_key: '',
      display_name: '',
      description: '',
      severity: 'medium',
      threshold_type: 'boolean',
      is_enabled: true,
    });
    setShowAddForm(false);
  };

  const generateKey = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  };

  const getOriginalIndex = (flag: RubricRedFlag) => {
    return redFlags.findIndex(f => f.id === flag.id);
  };

  const renderFlagCard = (flag: RubricRedFlag) => {
    const originalIndex = getOriginalIndex(flag);
    const config = SEVERITY_CONFIG[flag.severity];

    return (
      <div
        key={flag.id}
        className={`border rounded-lg p-4 transition-opacity ${config.borderColor} ${
          flag.is_enabled ? '' : 'opacity-50'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isEditable && (
                <button
                  onClick={() => onUpdateRedFlag(originalIndex, { is_enabled: !flag.is_enabled })}
                  className={`p-1 rounded transition-colors ${
                    flag.is_enabled ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'
                  }`}
                  title={flag.is_enabled ? 'Disable flag' : 'Enable flag'}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    {flag.is_enabled ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    )}
                  </svg>
                </button>
              )}
              <h4 className="font-medium text-slate-900">{flag.display_name}</h4>
              <span className="text-xs text-slate-400 font-mono">({flag.flag_key})</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{flag.description}</p>

            {/* Threshold Configuration */}
            {flag.threshold_type === 'percentage' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Threshold:</span>
                {isEditable ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={flag.threshold_value || 0}
                      onChange={e => onUpdateRedFlag(originalIndex, { threshold_value: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-slate-700">{flag.threshold_value}%</span>
                )}
              </div>
            )}

            {/* Severity Selector */}
            {isEditable && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-slate-500">Severity:</span>
                <select
                  value={flag.severity}
                  onChange={e => onUpdateRedFlag(originalIndex, { severity: e.target.value as RedFlagSeverity })}
                  className="text-sm border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
            )}
          </div>

          {/* Remove Button */}
          {isEditable && (
            <button
              onClick={() => onRemoveRedFlag(originalIndex)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Remove flag"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Red Flags</h3>
          <p className="text-sm text-slate-500 mt-1">
            Configure red flags that trigger alerts during coaching analysis.
          </p>
        </div>
        {isEditable && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Red Flag
          </button>
        )}
      </div>

      {/* Severity Groups */}
      {(['critical', 'high', 'medium'] as const).map(severity => {
        const flags = groupedFlags[severity];
        if (flags.length === 0) return null;

        const config = SEVERITY_CONFIG[severity];

        return (
          <div key={severity} className="mb-8">
            <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${config.borderColor}`}>
              <div className={`w-3 h-3 rounded-full ${config.bgColor} border ${config.borderColor}`} />
              <h4 className={`text-sm font-semibold uppercase tracking-wide ${config.color}`}>
                {config.label} ({flags.length})
              </h4>
            </div>
            <div className="space-y-3">
              {flags.map(renderFlagCard)}
            </div>
          </div>
        );
      })}

      {/* Add Flag Form */}
      {showAddForm && (
        <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
          <h4 className="font-medium text-slate-900 mb-4">Add New Red Flag</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                value={newFlag.display_name || ''}
                onChange={e => setNewFlag({
                  ...newFlag,
                  display_name: e.target.value,
                  flag_key: generateKey(e.target.value),
                })}
                placeholder="e.g., Missing Consent Verification"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Key</label>
              <input
                type="text"
                value={newFlag.flag_key || ''}
                onChange={e => setNewFlag({ ...newFlag, flag_key: e.target.value })}
                placeholder="e.g., missing_consent_verification"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={newFlag.description || ''}
              onChange={e => setNewFlag({ ...newFlag, description: e.target.value })}
              placeholder="Describe what triggers this red flag..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
              <select
                value={newFlag.severity || 'medium'}
                onChange={e => setNewFlag({ ...newFlag, severity: e.target.value as RedFlagSeverity })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Threshold Type</label>
              <select
                value={newFlag.threshold_type || 'boolean'}
                onChange={e => setNewFlag({ ...newFlag, threshold_type: e.target.value as ThresholdType })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="boolean">Boolean (Yes/No)</option>
                <option value="percentage">Percentage Threshold</option>
              </select>
            </div>
            {newFlag.threshold_type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Threshold Value (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newFlag.threshold_value || 0}
                  onChange={e => setNewFlag({ ...newFlag, threshold_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewFlag({
                  flag_key: '',
                  display_name: '',
                  description: '',
                  severity: 'medium',
                  threshold_type: 'boolean',
                  is_enabled: true,
                });
              }}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddFlag}
              disabled={!newFlag.flag_key || !newFlag.display_name || !newFlag.description}
              className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Add Red Flag
            </button>
          </div>
        </div>
      )}

      {!isEditable && (
        <p className="mt-6 text-sm text-slate-500 text-center italic">
          Create a new version to edit red flags
        </p>
      )}
    </div>
  );
};

export default RedFlagsEditor;
