<script lang="ts">
	import { IconGripVertical } from '@tabler/icons-svelte';
	import { firekitCollection, firekitDocMutations } from 'svelte-firekit';
	import { where, orderBy } from 'firebase/firestore';
	import { Timestamp } from 'firebase/firestore';
	import { firekitUser } from 'svelte-firekit';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { userInterfacesManager } from '$lib/modules/hyvflow/stores/user-interfaces-manager.svelte';
	import { sidebarOpen } from '$lib/modules/hyvflow/stores/hyvflow-general';
	import { dragState } from '$lib/modules/hyvflow/stores/drag-state';
	import type { ArrayStatus } from '$lib/modules/hyvflow/types/milestone';
	import type { Task } from '$lib/modules/hyvflow/types/task';
	import BoardTasks from '$lib/modules/hyvflow/components/tasks/board/board-tasks.svelte';
	import AddNewTask from '$lib/modules/hyvflow/components/tasks/board/add-new-task.svelte';
	import SortingTasks from '$lib/modules/hyvflow/components/tasks/board/sorting-tasks.svelte';
	import StatusOptions from '$lib/modules/hyvflow/components/tasks/board/status-options.svelte';
	import { updateTasksPositionsByDragDrop } from '$lib/modules/hyvflow/stores/firestore-batch/task-batch';
	import { toast } from 'svelte-sonner';
	import { NotificationType } from '$lib/modules/hyvflow/types/notifications';
	import { notificationManager } from '$lib/modules/hyvflow/stores/notifications-manager.svelte';

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
	// Track drag-enter/leave with counter to handle child-element transitions
	let dragOverCount = $state(0);
	let isStatusDragOver = $derived(statusdropdata?.type === 'status' && statusIndexDrop === statusIndex && statusdropdata?.statusIndex !== statusIndex);

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

	let tasks = $derived<Task[]>(
		(tasksCollection?.data ?? []).filter((t) => !t.parentId || t.parentId === '')
	);

	// ---- Task-drop onto this column (from header/add-task area or empty column) ----
	async function handleTaskDrop(draggedTask: Task, sourceList: Task[]) {
		const milestone = projectManager.milestoneData;
		if (!milestone) return;

		const isSameStatus = draggedTask.status === status.status;
		const isSameSprint = draggedTask.sprintId === sprintId;
		if (isSameStatus && isSameSprint) return; // nothing to do

		const uid = firekitUser.uid as string;
		const newActivity = {
			createdBy: uid,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Moved to ${status.name}`
		};

		const updatedTask: Task = {
			...draggedTask,
			status: status.status,
			sprintId,
			activities: [...(draggedTask.activities ?? []), newActivity]
		};

		const newSourceList = sourceList.filter((t) => t.id !== draggedTask.id);
		const newTargetList = [...tasks, updatedTask];

		await Promise.all([
			updateTasksPositionsByDragDrop(newSourceList, milestone),
			updateTasksPositionsByDragDrop(newTargetList, milestone)
		]);

		const assignees = draggedTask.assignees ?? [];
		const mentions = assignees
			.map((a: any) => a?.uid ?? a?.id ?? a)
			.filter((id: string) => id !== uid);

		if (mentions.length > 0) {
			await notificationManager.createNewNotification({
				link: `/p/${projectManager.projectId}/m/${draggedTask?.milestoneId}/${draggedTask?.id}`,
				mentions,
				title: `Task: ${draggedTask.name}`,
				typeNotification: NotificationType.Updates,
				typeItem: 'task',
				description: newActivity.description,
				createdBy: uid,
				unreadBy: mentions,
				itemId: draggedTask.id
			});
		}
	}

	// ---- column drag-and-drop: status reordering via grip handle ----
	function handleGripDragStart(e: DragEvent) {
		if (!e.dataTransfer) return;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'status', statusIndex }));
		statusdropdata = { type: 'status', statusIndex, sprintId };
	}

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		dragOverCount++;
	}

	function handleDragLeave() {
		dragOverCount--;
	}

	function handleDragOver(e: DragEvent) {
		// Accept both task drags and status drags
		const hasTask = !!dragState.get();
		const hasStatus = statusdropdata?.type === 'status';
		if (!hasTask && !hasStatus) return;
		e.preventDefault();
		if (hasStatus) statusIndexDrop = statusIndex;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOverCount = 0;

		// Status column reordering
		if (statusdropdata?.type === 'status') {
			const fromIndex: number = statusdropdata.statusIndex;
			const toIndex = statusIndex;
			statusdropdata = null;
			statusIndexDrop = -1;
			if (fromIndex === toIndex) return;

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
			return;
		}

		// Task drop on column header / empty area (board-tasks handles drops on the task list)
		const data = dragState.get();
		if (!data) return;
		await handleTaskDrop(data.task, data.taskslist);
		dragState.clear();
	}

	let isTaskDragOver = $derived(dragOverCount > 0 && !statusdropdata);
</script>

<div
	class="relative flex shrink-0 flex-col rounded-lg border transition-all duration-150
		{isStatusDragOver ? 'border-primary shadow-md shadow-primary/20' : 'border-border/40'}
		{isTaskDragOver ? 'border-primary/50 bg-primary/5' : 'bg-muted/20'}"
	style="width: 300px; min-width: 280px;"
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondragover={handleDragOver}
	ondrop={handleDrop}
	role="group"
>
	<!-- Status drop indicator -->
	{#if isStatusDragOver}
		<div class="pointer-events-none absolute -left-1 top-0 h-full w-0.5 rounded-full bg-primary"></div>
	{/if}

	<!-- Header -->
	<div class="flex items-center gap-1.5 border-b border-border/40 px-2 py-2">
		<!-- Grip handle — ONLY drag target for status reorder -->
		<button
			draggable="true"
			ondragstart={handleGripDragStart}
			class="flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/30 hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
			title="Drag to reorder column"
			aria-label="Drag to reorder status column"
		>
			<IconGripVertical class="size-3.5" />
		</button>

		<span
			class="size-2.5 shrink-0 rounded-full"
			style="background-color: {status.color || '#94a3b8'};"
		></span>
		<span class="flex-1 truncate text-sm font-medium">{status.name}</span>
		<span class="shrink-0 text-xs text-muted-foreground">{tasks.length}</span>
		<SortingTasks bind:showSorting {status} {sprintId} />
		<StatusOptions {status} {statusIndex} {sprintId} />
	</div>

	<!-- Add new task -->
	<div class="px-2 pt-2">
		<AddNewTask {status} taskslength={tasks.length} {sprintId} />
	</div>

	<!-- Tasks list -->
	<div class="min-h-[60px] flex-1 overflow-y-auto p-2">
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
