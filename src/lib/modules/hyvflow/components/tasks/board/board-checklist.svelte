<script lang="ts">
	import type { Task, TaskChecklist } from '$lib/modules/hyvflow/types/task';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let { task }: { task: Task } = $props();

	let checklist = $derived<TaskChecklist[]>(task.checklist ?? []);
	let doneCount = $derived(checklist.filter((i) => i.done).length);
	let total = $derived(checklist.length);
	let progressPct = $derived(total > 0 ? Math.round((doneCount / total) * 100) : 0);

	async function toggleItem(index: number) {
		const updated = checklist.map((item, i) =>
			i === index ? { ...item, done: !item.done } : item
		);
		taskManager.setIds(projectManager.projectId, projectManager.milestoneId);
		await taskManager.updateTask({ checklist: updated }, task.id);
	}
</script>

{#if total > 0}
	<div class="mt-2 space-y-2 px-1">
		<!-- Progress bar -->
		<div class="flex items-center gap-2">
			<span class="text-[10px] tabular-nums text-muted-foreground">{doneCount}/{total}</span>
			<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full bg-primary transition-all duration-300"
					style="width: {progressPct}%"
				></div>
			</div>
			<span class="text-[10px] tabular-nums text-muted-foreground">{progressPct}%</span>
		</div>

		<!-- Items -->
		<ul class="space-y-1">
			{#each checklist as item, i}
				<li class="flex items-start gap-2">
					<Checkbox
						checked={item.done}
						onCheckedChange={() => toggleItem(i)}
						class="mt-0.5 size-3.5"
					/>
					<span
						class="text-xs leading-tight {item.done
							? 'text-muted-foreground line-through'
							: 'text-foreground'}"
					>
						{item.name}
					</span>
				</li>
			{/each}
		</ul>
	</div>
{/if}
