<script lang="ts">
	import type { Task } from '$lib/modules/hyvflow/types/task';
	import { Badge } from '$lib/components/ui/badge';

	let { task }: { task: Task } = $props();

	let count = $derived(task.urldependencies?.length ?? 0);
</script>

{#if count > 0}
	<Badge variant="secondary" class="gap-1 px-1.5 py-0 text-[10px]">
		<span class="font-medium">{count}</span>
		<span class="text-muted-foreground">{count === 1 ? 'predecessor' : 'predecessors'}</span>
	</Badge>
{/if}
