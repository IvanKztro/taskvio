<script lang="ts">
	import type { Timestamp } from 'firebase/firestore';

	let { dataDate }: { dataDate: any } = $props();

	const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

	let date = $derived.by(() => {
		if (!dataDate) return null;
		if (dataDate?.seconds) return new Date(dataDate.seconds * 1000);
		if (dataDate instanceof Date) return dataDate;
		return null;
	});

	let now = new Date();

	let isOverdue = $derived(date ? date.getTime() < now.getTime() : false);
	let isNear = $derived(
		date ? !isOverdue && date.getTime() - now.getTime() <= THREE_DAYS_MS : false
	);

	let colorClass = $derived(
		isOverdue ? 'bg-red-500 text-white' : isNear ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'
	);

	let dotClass = $derived(
		isOverdue ? 'bg-red-600' : isNear ? 'bg-yellow-500' : 'bg-green-600'
	);

	let label = $derived.by(() => {
		if (!date) return 'No date';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	});
</script>

{#if date}
	<span
		class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {colorClass}"
	>
		<span class="size-1.5 rounded-full {dotClass}"></span>
		{label}
	</span>
{/if}
