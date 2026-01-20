import React from 'react';

type Role = 'admin' | 'manager' | 'agent';

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const roleStyles: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  agent: 'bg-green-100 text-green-800',
};

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  agent: 'Agent',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleStyles[role]} ${className}`}
    >
      {roleLabels[role]}
    </span>
  );
};

export default RoleBadge;
