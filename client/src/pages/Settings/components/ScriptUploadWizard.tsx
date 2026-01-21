import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import type { ProductType, ScriptWithSyncStatus } from '../../../types';
import type { FileRejection } from 'react-dropzone';
import { PRODUCT_TYPE_LABELS, MAX_FILE_SIZE_BYTES } from '../../../types';

interface ScriptUploadWizardProps {
  onClose: () => void;
  onUpload: (file: File, name: string, productType: ProductType, versionNotes?: string) => Promise<ScriptWithSyncStatus | null>;
  isUploading: boolean;
  onUploadComplete: () => void;
}

type Step = 'upload' | 'details' | 'complete';

export const ScriptUploadWizard: React.FC<ScriptUploadWizardProps> = ({
  onClose,
  onUpload,
  isUploading,
  onUploadComplete,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [productType, setProductType] = useState<ProductType>('aca');
  const [versionNotes, setVersionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploadedScript, setUploadedScript] = useState<ScriptWithSyncStatus | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload a .txt, .pdf, .docx, or .md file.');
      } else {
        setError(rejection.errors[0]?.message || 'Invalid file');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      // Auto-fill name from filename (without extension)
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setName(baseName);
      setStep('details');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md'],
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
  });

  const handleSubmit = async () => {
    if (!file || !name.trim()) return;

    setError(null);
    const result = await onUpload(file, name.trim(), productType, versionNotes.trim() || undefined);

    if (result) {
      setUploadedScript(result);
      setStep('complete');
    }
  };

  const handleClose = () => {
    if (step === 'complete') {
      onUploadComplete();
    }
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {step === 'upload' && 'Upload Sales Script'}
            {step === 'details' && 'Script Details'}
            {step === 'complete' && 'Upload Complete'}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input {...getInputProps()} />
                <svg className="h-12 w-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {isDragActive ? (
                  <p className="text-primary-600 font-medium">Drop the file here...</p>
                ) : (
                  <>
                    <p className="text-slate-900 font-medium">
                      Drag and drop your script file here
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      or click to browse
                    </p>
                  </>
                )}
                <p className="text-slate-400 text-xs mt-4">
                  Supported formats: .txt, .pdf, .docx, .md (max {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB)
                </p>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && file && (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setStep('upload');
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Script Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Script Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., ACA Sales Script v3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Product Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={productType}
                  onChange={e => setProductType(e.target.value as ProductType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map(type => (
                    <option key={type} value={type}>
                      {PRODUCT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Version Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Version Notes (optional)
                </label>
                <textarea
                  value={versionNotes}
                  onChange={e => setVersionNotes(e.target.value)}
                  placeholder="e.g., Updated compliance disclosures for Q1 2026"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && uploadedScript && (
            <div className="text-center py-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Script Uploaded Successfully</h4>
              <p className="text-sm text-slate-500 mb-4">
                <strong>{uploadedScript.name}</strong> (v{uploadedScript.version}) has been uploaded.
              </p>
              <div className="bg-slate-50 rounded-lg p-4 text-left">
                <p className="text-sm text-slate-600 mb-2">
                  Next steps:
                </p>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">1.</span>
                    <span>Review the script content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">2.</span>
                    <span>Click "Sync" to analyze impact on coaching rubric</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">3.</span>
                    <span>Approve changes and activate the script</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          {step === 'upload' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}

          {step === 'details' && (
            <>
              <button
                onClick={() => setStep('upload')}
                disabled={isUploading}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || isUploading}
                className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <LoadingSpinner size="sm" className="text-white" />
                    Uploading...
                  </>
                ) : (
                  'Upload Script'
                )}
              </button>
            </>
          )}

          {step === 'complete' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptUploadWizard;
