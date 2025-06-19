<script lang="ts">
	import { cn } from '$lib/utils';
	import type { DialogHeaderProps } from './dialog';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
	<slot />
</div> 