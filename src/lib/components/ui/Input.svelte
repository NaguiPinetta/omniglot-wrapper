<script lang="ts">
	import { cn } from '$lib/utils';
	import type { InputProps } from './input';

	let className: string | undefined = undefined;
	export { className as class };

	export let disabled = false;
	export let type: InputProps['type'] = 'text';
	export let placeholder: string | undefined = undefined;
	export let value: string | undefined = undefined;
	export let name: string | undefined = undefined;
	export let id: string | undefined = undefined;
	export let required = false;
	export let accept: string | undefined = undefined;
	export let onchange: ((event: Event) => void) | undefined = undefined;
</script>

<input
	class={cn(
		'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{disabled}
	{type}
	{placeholder}
	{value}
	{name}
	{id}
	{required}
	{accept}
	on:change={onchange}
	{...$$restProps}
/> 