<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { IconPlus, IconLayoutKanban } from '@tabler/icons-svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import {
		isopensprint,
		sprintActions,
		sprintsActions,
		sprintIndexStore
	} from '$lib/modules/hyvflow/stores/actions/sprint-action';
	import { milestoneActions } from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import BoardSprints from '$lib/modules/hyvflow/components/tasks/board/board-sprints.svelte';

	let { currentTab = 'kanban' }: { currentTab?: string } = $props();

	let milestone = $derived(projectManager.milestoneData);
	let sprints = $derived(milestone?.arraySprints ?? []);

	function handleAddSprint(afterIndex = -1) {
		milestoneActions.set(milestone);
		sprintActions.set(undefined);
		sprintsActions.set(sprints);
		sprintIndexStore.set(afterIndex);
		isopensprint.set(true);
	}
</script>

<div class="flex h-full flex-col ">
	{#if sprints.length === 0}
		<!-- Empty state -->
		<div class="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<div class="flex size-16 items-center justify-center rounded-full bg-muted">
				<IconLayoutKanban class="size-8 text-muted-foreground" />
			</div>
			<div>
				<p class="text-base font-medium">No sprints yet</p>
				<p class="mt-1 text-sm text-muted-foreground">Create your first sprint to start organizing tasks.</p>
			</div>
			<Button onclick={() => handleAddSprint(-1)} class="gap-2">
				<IconPlus class="size-4" />
				Create Sprint
			</Button>
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto p-4">
			{#each sprints as sprint, i}
				<BoardSprints {sprint} sprintIndex={i} sprintId={sprint.id} />

				<!-- Add Sprint after each sprint -->
				<div class="mb-6 mt-1 flex">
					<Button
						variant="ghost"
						size="sm"
						class="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
						onclick={() => handleAddSprint(i)}
					>
						<IconPlus class="size-3.5" />
						Add Sprint
					</Button>
				</div>
			{/each}
		</div>
	{/if}
</div>
