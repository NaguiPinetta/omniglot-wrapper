<script lang="ts">
	import { cn } from '$lib/utils';
	import type { CardProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps } from './card';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
	<slot />
</div> 