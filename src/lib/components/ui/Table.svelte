<script lang="ts">
	import { cn } from '$lib/utils';
	import type { TableProps, TableHeaderProps, TableBodyProps, TableFooterProps, TableHeadProps, TableRowProps, TableCellProps, TableCaptionProps } from './table';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<table class={cn('w-full caption-bottom text-sm', className)}>
	<slot />
</table> 