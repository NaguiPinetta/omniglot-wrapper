export { default as Button } from './Button.svelte';

import type { HTMLButtonAttributes } from 'svelte/elements';

interface ButtonProps extends HTMLButtonAttributes {
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  danger: 'bg-red-600 text-white hover:bg-red-700'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

export function getButtonClasses(props: ButtonProps): string {
  const variant = props.variant || 'default';
  const size = props.size || 'md';
  
  return `inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${variantClasses[variant]} ${sizeClasses[size]}`;
} 