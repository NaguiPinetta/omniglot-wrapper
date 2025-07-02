<script lang="ts">
	import { cn } from '$lib/utils';
	import type { DialogContentProps } from './dialog';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class={cn('fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg', className)}>
	<slot />
</div> 