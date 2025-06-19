<script lang="ts">
	import { cn } from '$lib/utils';
	import type { TableBodyProps } from './table';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<tbody class={cn('[&_tr:last-child]:border-0', className)}>
	<slot />
</tbody> 