<script lang="ts">
	import { cn } from '$lib/utils';
	import type { CardDescriptionProps } from './card';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<p class={cn('text-sm text-muted-foreground', className)}>
	<slot />
</p> 