<script lang="ts">
	import { cn } from '$lib/utils';
	import type { CardFooterProps } from './card';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class={cn('flex items-center p-6 pt-0', className)}>
	<slot />
</div> 