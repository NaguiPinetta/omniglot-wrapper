import type { HTMLTextareaAttributes } from 'svelte/elements';

interface TextareaProps extends HTMLTextareaAttributes {
  error?: boolean;
  resize?: boolean;
}

export function getTextareaClasses(props: TextareaProps): string {
  const errorClasses = props.error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500';
  const resizeClass = props.resize ? '' : 'resize-none';
  
  return `block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${errorClasses} ${resizeClass}`;
} 