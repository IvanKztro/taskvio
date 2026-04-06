<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		flagtype = '',
		hastext = '',
		className = ''
	}: {
		flagtype?: string;
		hastext?: string;
		className?: string;
	} = $props();

	const colorMap: Record<string, { dot: string; text: string; label: string }> = {
		Urgent: { dot: 'bg-red-500', text: 'text-red-500', label: 'Urgent' },
		High: { dot: 'bg-orange-400', text: 'text-orange-400', label: 'High' },
		Normal: { dot: 'bg-blue-400', text: 'text-blue-400', label: 'Normal' },
		Low: { dot: 'bg-gray-400', text: 'text-gray-400', label: 'Low' }
	};

	let config = $derived(colorMap[flagtype ?? ''] ?? colorMap['Normal']);
</script>

<span class={cn('inline-flex items-center gap-1', className)}>
	<span class={cn('size-2 rounded-full flex-shrink-0', config.dot)}></span>
	{#if hastext}
		<span class={cn('text-xs font-medium', config.text)}>{config.label}</span>
	{/if}
</span>
