
import React from 'react';

interface IconProps {
  name: string;
  className?: string;
  fill?: boolean;
}

export const Icon: React.FC<IconProps> = ({ name, className = '', fill = false }) => {
  return (
    <span 
      className={`material-symbols-outlined select-none ${className}`}
      style={{ fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 20` }}
    >
      {name}
    </span>
  );
};
