import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClass = 'font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClass = {
    primary: 'bg-primary-light text-white hover:bg-primary-dark focus:ring-primary-light disabled:bg-gray-400',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-300',
    outline: 'border-2 border-primary-light text-primary-light hover:bg-primary-light hover:text-white focus:ring-primary-light disabled:opacity-50',
  };

  const sizeClass = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Lädt...' : children}
    </button>
  );
}
