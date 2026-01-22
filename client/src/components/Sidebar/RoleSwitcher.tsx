import React, { useState, useRef, useEffect } from 'react';
import type { UserRole } from '../../types';

// localStorage key for role override
const ROLE_OVERRIDE_KEY = 'dev_roleOverride';

/**
 * Get the current role override from localStorage
 */
export function getRoleOverride(): UserRole | null {
  if (typeof window === 'undefined') return null;
  const override = localStorage.getItem(ROLE_OVERRIDE_KEY);
  if (override === 'admin' || override === 'manager' || override === 'agent') {
    return override;
  }
  return null;
}

/**
 * Set role override and reload the page
 */
export function setRoleOverride(role: UserRole | null): void {
  if (role) {
    localStorage.setItem(ROLE_OVERRIDE_KEY, role);
  } else {
    localStorage.removeItem(ROLE_OVERRIDE_KEY);
  }
  window.location.reload();
}

/**
 * Clear role override (convenience function)
 */
export function clearRoleOverride(): void {
  setRoleOverride(null);
}

interface RoleSwitcherProps {
  currentEffectiveRole: UserRole;
}

const roles: { value: UserRole | null; label: string; description: string }[] = [
  { value: null, label: 'Admin', description: 'Your actual role' },
  { value: 'manager', label: 'Manager', description: 'Simulate manager view' },
  { value: 'agent', label: 'Agent', description: 'Simulate agent view' },
];

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentEffectiveRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentOverride = getRoleOverride();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (roleValue: UserRole | null) => {
    setIsOpen(false);
    // Only trigger reload if the selection is different
    if (roleValue !== currentOverride) {
      setRoleOverride(roleValue);
    }
  };

  const isOverriding = currentOverride !== null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg border transition-colors ${
          isOverriding
            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span>
            View as: <span className="font-medium capitalize">{currentEffectiveRole}</span>
          </span>
          {isOverriding && (
            <span className="px-1 py-0.5 text-[10px] bg-amber-200 text-amber-800 rounded">
              DEV
            </span>
          )}
        </span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wide">
            Simulate Role
          </div>
          {roles.map((role) => {
            const isSelected =
              (role.value === null && currentOverride === null) ||
              role.value === currentOverride;

            return (
              <button
                key={role.value ?? 'admin'}
                onClick={() => handleSelect(role.value)}
                className={`flex items-center justify-between w-full px-3 py-2 text-xs transition-colors ${
                  isSelected
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                role="menuitem"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isSelected ? 'bg-primary-500' : 'bg-slate-300'
                    }`}
                  />
                  <span className="font-medium">{role.label}</span>
                </span>
                <span className="text-[10px] text-slate-400">{role.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
