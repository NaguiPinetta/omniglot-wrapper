export { default as Textarea } from './Textarea.svelte';

import type { HTMLTextareaAttributes } from 'svelte/elements';

interface TextareaProps extends HTMLTextareaAttributes {
  error?: boolean;
  resize?: boolean;
  rows?: number | null;
}

export function getTextareaClasses(props: TextareaProps): string {
  const errorClasses = props.error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary';
  const resizeClass = props.resize ? '' : 'resize-none';
  
  return `block w-full rounded-md border bg-background text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${errorClasses} ${resizeClass}`;
} 