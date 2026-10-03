import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCrown, faDesktop } from '@fortawesome/free-solid-svg-icons';
import { faTwitch } from '@fortawesome/free-brands-svg-icons';

export interface UserRoleBadgeProps {
  role?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  role = 'usuario',
  size = 'md',
  className = '',
  style = {}
}) => {
  const effectiveRole = (role || 'usuario').toLowerCase();

  const sizeStyle = {
    sm: { fontSize: '0.72rem' },
    md: { fontSize: '0.85rem' },
    lg: { fontSize: '1.35rem' }
  }[size];

  if (effectiveRole === 'streamer') {
    return (
      <span
        className={`user-role-badge role-streamer ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#A970FF',
          filter: 'drop-shadow(0 0 6px rgba(169, 112, 255, 0.9))',
          marginLeft: '6px',
          verticalAlign: 'middle',
          lineHeight: 1,
          ...sizeStyle,
          ...style
        }}
        title="Streamer"
      >
        <FontAwesomeIcon icon={faTwitch} />
      </span>
    );
  }

  if (effectiveRole === 'webmaster') {
    return (
      <span
        className={`user-role-badge role-webmaster ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4ADE80',
          filter: 'drop-shadow(0 0 6px rgba(74, 222, 128, 0.9))',
          marginLeft: '6px',
          verticalAlign: 'middle',
          lineHeight: 1,
          ...sizeStyle,
          ...style
        }}
        title="Webmaster"
      >
        <FontAwesomeIcon icon={faDesktop} />
      </span>
    );
  }

  if (effectiveRole === 'vip') {
    return (
      <span
        className={`user-role-badge role-vip ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFD700',
          filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.9))',
          marginLeft: '6px',
          verticalAlign: 'middle',
          lineHeight: 1,
          ...sizeStyle,
          ...style
        }}
        title="VIP"
      >
        <FontAwesomeIcon icon={faCrown} />
      </span>
    );
  }

  // Usuario (silueta de persona por defecto)
  return (
    <span
      className={`user-role-badge role-usuario ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94A3B8',
        filter: 'drop-shadow(0 0 4px rgba(148, 163, 184, 0.7))',
        marginLeft: '6px',
        verticalAlign: 'middle',
        lineHeight: 1,
        ...sizeStyle,
        ...style
      }}
      title="Usuario"
    >
      <FontAwesomeIcon icon={faUser} />
    </span>
  );
};

export const renderBadge = (role?: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  return <UserRoleBadge role={role} size={size} />;
};

export default UserRoleBadge;
