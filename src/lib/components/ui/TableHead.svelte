<script lang="ts">
	import { cn } from '$lib/utils';
	import type { TableHeadProps } from './table';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<th class={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0', className)}>
	<slot />
</th> 