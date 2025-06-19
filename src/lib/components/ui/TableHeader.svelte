<script lang="ts">
	import { cn } from '$lib/utils';
	import type { TableHeaderProps } from './table';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<thead class={cn('[&_tr]:border-b', className)}>
	<slot />
</thead> 