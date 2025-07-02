<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils';
	import type { DialogProps, DialogTriggerProps, DialogContentProps, DialogHeaderProps, DialogTitleProps, DialogDescriptionProps, DialogFooterProps } from './dialog';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let className: string | undefined = undefined;
	export { className as class };

	function handleBackdropClick() {
		dispatch('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			dispatch('close');
		}
	}
</script>

{#if open}
	<div
		class={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-sm', className)}
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		tabindex="-1"
		role="dialog"
	>
		<div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white shadow-lg duration-200 sm:rounded-lg">
			<slot />
		</div>
	</div>
{/if} 