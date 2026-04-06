<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { IconPlus, IconGripVertical } from '@tabler/icons-svelte';
	import { firekitCollection } from 'svelte-firekit';
	import { where, orderBy } from 'firebase/firestore';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { userInterfacesManager } from '$lib/modules/hyvflow/stores/user-interfaces-manager.svelte';
	import { sidebarOpen } from '$lib/modules/hyvflow/stores/hyvflow-general';
	import type { ArrayStatus } from '$lib/modules/hyvflow/types/milestone';
	import type { Task } from '$lib/modules/hyvflow/types/task';
	import BoardTasks from '$lib/modules/hyvflow/components/tasks/board/board-tasks.svelte';
	import AddNewTask from '$lib/modules/hyvflow/components/tasks/board/add-new-task.svelte';
	import SortingTasks from '$lib/modules/hyvflow/components/tasks/board/sorting-tasks.svelte';
	import StatusOptions from '$lib/modules/hyvflow/components/tasks/board/status-options.svelte';
	import { firekitDocMutations } from 'svelte-firekit';
	import { toast } from 'svelte-sonner';

	let {
		status,
		statusIndex,
		sprintIndex,
		sprintId,
		statusIndexDrop = $bindable(),
		statusdropdata = $bindable(),
		datatemp = $bindable(),
		statusdrop = $bindable()
	}: {
		status: ArrayStatus;
		statusIndex: number;
		sprintIndex: number;
		sprintId: string;
		statusIndexDrop: number;
		statusdropdata: any;
		datatemp: any;
		statusdrop: boolean;
	} = $props();

	let showSorting = $state(false);

	let currentSort = $derived(
		userInterfacesManager.userInterfaces?.[`sort_${sprintId}_${status?.status}`] ?? 'position'
	);

	let tasksCollection = $derived.by(() => {
		const pid = projectManager.projectId;
		const mid = projectManager.milestoneId;
		if (!pid || !mid || !sprintId) return null;

		return firekitCollection<Task>(`projects/${pid}/milestones/${mid}/tasks`, [
			where('status', '==', status.status),
			where('sprintId', '==', sprintId),
			orderBy('position')
		]);
	});

	// Filter top-level tasks client-side (parentId === '' or missing)
	let tasks = $derived<Task[]>(
		(tasksCollection?.data ?? []).filter((t) => !t.parentId || t.parentId === '')
	);

	// ---- column drag-and-drop (reordering statuses) ----
	function handleDragStart(e: DragEvent) {
		if (!e.dataTransfer) return;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'status', statusIndex }));
		statusdropdata = { type: 'status', statusIndex, sprintId };
	}

	function handleDragOver(e: DragEvent) {
		// Only handle status column reordering here; task drops are handled by board-tasks inside
		if (statusdropdata?.type !== 'status') return;
		e.preventDefault();
		statusIndexDrop = statusIndex;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		if (!statusdropdata || statusdropdata.type !== 'status') return;
		const fromIndex: number = statusdropdata.statusIndex;
		const toIndex = statusIndex;
		if (fromIndex === toIndex) {
			statusdropdata = null;
			statusIndexDrop = -1;
			return;
		}

		const milestone = projectManager.milestoneData;
		if (!milestone) return;

		const updated = [...(milestone.arrayStatus ?? [])];
		const [moved] = updated.splice(fromIndex, 1);
		updated.splice(toIndex, 0, moved);
		const reordered = updated.map((s, i) => ({ ...s, position: i + 1 }));

		const res = await firekitDocMutations.update(
			`projects/${milestone.projectId}/milestones/${milestone.id}`,
			{ arrayStatus: reordered }
		);
		if (!res.success) toast.error('Error reordering statuses');

		statusdropdata = null;
		statusIndexDrop = -1;
	}

	// Can drop indicator
	let canDropHere = $derived(
		statusdropdata?.type === 'status' && statusIndexDrop === statusIndex && statusdropdata.statusIndex !== statusIndex
	);

	let sidebarWidth = $derived($sidebarOpen ? '470px' : '200px');
	let colWidth = $derived(`calc((100dvw - ${sidebarWidth}) / 1)`);
</script>

<div
	class="relative flex shrink-0 flex-col rounded-lg border border-border/40 bg-muted/20"
	style="width: 300px; min-width: 280px;"
	ondragover={handleDragOver}
	ondrop={handleDrop}
	role="group"
>
	<!-- Drop indicator left -->
	{#if canDropHere}
		<div class="pointer-events-none absolute -left-1 top-0 h-full w-0.5 rounded-full bg-primary"></div>
	{/if}

	<!-- Header -->
	<div class="flex items-center gap-1.5 border-b border-border/40 px-2 py-2">
		<!-- Drag handle (only way to reorder columns) -->
		<button
			draggable="true"
			ondragstart={handleDragStart}
			class="flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
			title="Drag to reorder"
			aria-label="Drag to reorder status"
		>
			<IconGripVertical class="size-3.5" />
		</button>

		<!-- Color dot -->
		<span
			class="size-2.5 shrink-0 rounded-full"
			style="background-color: {status.color || '#94a3b8'};"
		></span>

		<!-- Status name -->
		<span class="flex-1 truncate text-sm font-medium">{status.name}</span>

		<!-- Task count -->
		<span class="shrink-0 text-xs text-muted-foreground">{tasks.length}</span>

		<!-- Sorting -->
		<SortingTasks bind:showSorting {status} {sprintId} />

		<!-- Status options -->
		<StatusOptions {status} {statusIndex} {sprintId} />
	</div>

	<!-- Add new task (top) -->
	<div class="px-2 pt-2">
		<AddNewTask {status} taskslength={tasks.length} {sprintId} />
	</div>

	<!-- Tasks list -->
	<div class="flex-1 overflow-y-auto p-2">
		<BoardTasks
			{statusIndex}
			{status}
			statusname={status.name}
			{tasks}
			{sprintIndex}
			{sprintId}
			showSorting={false}
		/>
	</div>
</div>
