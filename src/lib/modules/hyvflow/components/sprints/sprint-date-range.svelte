<script lang="ts">
	import type { SprintApp } from '$lib/modules/hyvflow/types/milestone';

	let { sprint }: { sprint: SprintApp } = $props();

	function formatDate(timestamp: any): string {
		if (!timestamp?.seconds) return '';
		return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	let startFormatted = $derived(formatDate(sprint.startDate));
	let endFormatted = $derived(formatDate(sprint.endDate));

	let label = $derived.by(() => {
		if (startFormatted && endFormatted) return `${startFormatted} - ${endFormatted}`;
		if (startFormatted) return `From ${startFormatted}`;
		if (endFormatted) return `Until ${endFormatted}`;
		return 'No dates';
	});
</script>

<span class="text-xs text-muted-foreground">{label}</span>
