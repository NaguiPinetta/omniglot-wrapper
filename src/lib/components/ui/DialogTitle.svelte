<script lang="ts">
	import { cn } from '$lib/utils';
	import type { DialogTitleProps } from './dialog';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<h2 class={cn('text-lg font-semibold leading-none tracking-tight', className)}>
	<slot />
</h2> 