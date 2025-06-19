<script lang="ts">
	import { cn } from '$lib/utils';
	import type { DialogTriggerProps } from './dialog';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<button class={cn('', className)} on:click>
	<slot />
</button> 