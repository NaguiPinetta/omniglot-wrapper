import type { HTMLInputAttributes } from 'svelte/elements';
import type { HTMLAttributes } from 'svelte/elements';

export type InputProps = HTMLInputAttributes;
export type InputLabelProps = HTMLAttributes<HTMLLabelElement>;
export type InputDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type InputErrorProps = HTMLAttributes<HTMLParagraphElement>; 