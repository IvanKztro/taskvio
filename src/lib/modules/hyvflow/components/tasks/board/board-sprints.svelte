<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { IconPlus, IconChevronDown, IconChevronRight } from '@tabler/icons-svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { userInterfacesManager } from '$lib/modules/hyvflow/stores/user-interfaces-manager.svelte';
	import { sidebarOpen } from '$lib/modules/hyvflow/stores/hyvflow-general';
	import {
		isopensprint,
		sprintActions,
		sprintsActions,
		sprintIndexStore
	} from '$lib/modules/hyvflow/stores/actions/sprint-action';
	import { milestoneActions } from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import { isopenstatus, statusActions } from '$lib/modules/hyvflow/stores/actions/status-action';
	import type { SprintApp } from '$lib/modules/hyvflow/types/milestone';
	import BoardStatus from '$lib/modules/hyvflow/components/tasks/board/board-status.svelte';
	import OptionsMenu from '$lib/modules/hyvflow/components/sprints/options-menu.svelte';
	import SprintDateRange from '$lib/modules/hyvflow/components/sprints/sprint-date-range.svelte';

	let {
		sprint,
		sprintIndex,
		sprintId
	}: {
		sprint: SprintApp;
		sprintIndex: number;
		sprintId: string;
	} = $props();

	let milestone = $derived(projectManager.milestoneData);
	let statuses = $derived(milestone?.arrayStatus ?? []);

	// Persist open/closed state
	let isOpen = $derived.by(() => {
		const ui = userInterfacesManager.userInterfaces;
		return ui?.sprints?.[sprintId]?.open ?? true;
	});

	async function toggleOpen() {
		const current = isOpen;
		await userInterfacesManager.updateUserInterfaceState(`sprints`, {
			...(userInterfacesManager.userInterfaces?.sprints ?? {}),
			[sprintId]: { open: !current }
		});
	}

	// Status drag-and-drop state
	let statusIndexDrop = $state(-1);
	let statusdropdata = $state<any>(null);
	let datatemp = $state<any>(null);
	let statusdrop = $state(false);

	let sidebarWidth = $derived($sidebarOpen ? '270px' : '200px');

	function handleAddStatus() {
		statusActions.set(undefined);
		milestoneActions.set(milestone);
		isopenstatus.set(true);
	}

	function handleAddSprintAfter() {
		milestoneActions.set(milestone);
		sprintActions.set(undefined);
		sprintsActions.set(milestone?.arraySprints ?? []);
		sprintIndexStore.set(sprintIndex);
		isopensprint.set(true);
	}
</script>

<div class="mb-4">
	<!-- Sprint header -->
	<div class="mb-2 flex items-center gap-2 px-1">
		<button
			onclick={toggleOpen}
			class="flex items-center gap-1.5 text-sm font-semibold hover:text-foreground"
		>
			{#if isOpen}
				<IconChevronDown class="size-4 text-muted-foreground" />
			{:else}
				<IconChevronRight class="size-4 text-muted-foreground" />
			{/if}
			{sprint.name}
		</button>

		<SprintDateRange {sprint} />

		<OptionsMenu {sprint} className="ml-auto" />
	</div>

	<!-- Sprint content (status columns) -->
	{#if isOpen}
		<div
			class="flex gap-3 overflow-x-auto pb-3"
			style="max-width: calc(100dvw - {sidebarWidth}); min-height: calc(100dvh - 135px);"
		>
			{#each statuses as status, i}
				<BoardStatus
					{status}
					statusIndex={i}
					{sprintIndex}
					{sprintId}
					bind:statusIndexDrop
					bind:statusdropdata
					bind:datatemp
					bind:statusdrop
				/>
			{/each}

			<!-- Add Status button -->
			<div class="flex shrink-0 items-start pt-1">
				<Button
					variant="ghost"
					size="sm"
					class="h-8 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
					onclick={handleAddStatus}
				>
					<IconPlus class="size-3.5" />
					Add Status
				</Button>
			</div>
		</div>
	{/if}
</div>
