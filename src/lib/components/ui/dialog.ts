export { default as Dialog } from './Dialog.svelte';
export { default as DialogContent } from './DialogContent.svelte';
export { default as DialogHeader } from './DialogHeader.svelte';
export { default as DialogTitle } from './DialogTitle.svelte';
export { default as DialogTrigger } from './DialogTrigger.svelte';

import type { HTMLAttributes } from 'svelte/elements';

export type DialogProps = HTMLAttributes<HTMLDivElement>;
export type DialogTriggerProps = HTMLAttributes<HTMLButtonElement>;
export type DialogContentProps = HTMLAttributes<HTMLDivElement>;
export type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;
export type DialogTitleProps = HTMLAttributes<HTMLHeadingElement>;
export type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type DialogFooterProps = HTMLAttributes<HTMLDivElement>; 