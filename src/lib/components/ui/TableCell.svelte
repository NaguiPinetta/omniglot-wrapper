<script lang="ts">
	import { cn } from '$lib/utils';
	import type { TableCellProps } from './table';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<td class={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}>
	<slot />
</td> 