<script lang="ts">
	import type { Task } from '$lib/modules/hyvflow/types/task';
	import { TaskStatus } from '$lib/modules/hyvflow/types/task';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import {
		updateTasksPositionsByDragDrop,
		moveTaskTree
	} from '$lib/modules/hyvflow/stores/firestore-batch/task-batch';
	import { notificationManager } from '$lib/modules/hyvflow/stores/notifications-manager.svelte';
	import { NotificationType } from '$lib/modules/hyvflow/types/notifications';
	import { firekitUser } from 'svelte-firekit';
	import { Timestamp } from 'firebase/firestore';
	import { page } from '$app/stores';
	import BoardTask from '$lib/modules/hyvflow/components/tasks/board/board-task.svelte';

	let {
		statusIndex,
		status,
		statusname,
		tasks,
		sprintIndex,
		sprintId,
		level = 0,
		showSorting,
		draggingTask
	}: {
		statusIndex: number;
		status: any;
		statusname: string;
		tasks: Task[];
		sprintIndex: number;
		sprintId: string;
		level?: number;
		showSorting: boolean;
		draggingTask?: Task;
	} = $props();

	// ---- drag state (shared up/down via bindable on each BoardTask) ----
	let taskIndexDrop = $state(-1);
	let taskdropdata = $state<any>(null);
	let isdraggingtask = $state(false);
	let isdraggingstatus = $state(false);
	let datatemp = $state<any>(null);
	let isDragOverList = $state(false);

	// ---- milestone path helpers ----
	function milestonePath(projectId: string, milestoneId: string) {
		return `projects/${projectId}/milestones/${milestoneId}`;
	}

	// ---- drop: same status + same sprint ----
	async function dropSameStatusAndSprint(
		draggedTask: Task,
		sourceList: Task[],
		dropIndex: number
	) {
		const mutableList = [...sourceList];
		const fromIdx = mutableList.findIndex((t) => t.id === draggedTask.id);
		if (fromIdx === -1) return;

		mutableList.splice(fromIdx, 1);
		const insertAt = dropIndex > fromIdx ? dropIndex - 1 : dropIndex;
		mutableList.splice(insertAt, 0, draggedTask);

		const milestone = projectManager.milestoneData;
		if (!milestone) return;
		await updateTasksPositionsByDragDrop(mutableList, milestone);
	}

	// ---- drop: different status or different sprint ----
	async function dropDifferentStatusOrSprint(
		draggedTask: Task,
		sourceList: Task[],
		targetList: Task[],
		dropIndex: number
	) {
		const milestone = projectManager.milestoneData;
		if (!milestone) return;

		const uid = firekitUser.uid as string;

		// Build activity entry
		const newActivity = {
			createdBy: uid,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Moved to ${statusname}${sprintId ? ' (sprint change)' : ''}`
		};

		// Update dragged task
		const updatedTask: Task = {
			...draggedTask,
			status: status?.status ?? draggedTask.status,
			sprintId,
			activities: [...(draggedTask.activities ?? []), newActivity]
		};

		// Remove from source list, insert into target list at dropIndex
		const newSourceList = sourceList.filter((t) => t.id !== draggedTask.id);
		const newTargetList = [...targetList];
		newTargetList.splice(dropIndex, 0, updatedTask);

		await Promise.all([
			updateTasksPositionsByDragDrop(newSourceList, milestone),
			updateTasksPositionsByDragDrop(newTargetList, milestone)
		]);

		// Notify assignees
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

	// ---- drop: task from another milestone ----
	async function dropInOtherMilestone(draggedTask: Task, sourceInfo: any) {
		const fromMilestoneId: string = sourceInfo.sourceMilestoneId;
		const toMilestoneId = projectManager.milestoneId;
		const projectId = projectManager.projectId;
		if (!fromMilestoneId || !toMilestoneId || fromMilestoneId === toMilestoneId) return;

		const fromPath = milestonePath(projectId, fromMilestoneId);
		const toPath = milestonePath(projectId, toMilestoneId);
		await moveTaskTree(draggedTask, fromPath, toPath);
	}

	// ---- ondragover: calculate drop index ----
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOverList = true;
		const target = e.currentTarget as HTMLElement;
		const children = Array.from(target.querySelectorAll('[data-task-card]')) as HTMLElement[];
		if (children.length === 0) {
			taskIndexDrop = 0;
			return;
		}
		let idx = children.length;
		for (let i = 0; i < children.length; i++) {
			const rect = children[i].getBoundingClientRect();
			const midY = rect.top + rect.height / 2;
			if (e.clientY < midY) {
				idx = i;
				break;
			}
		}
		taskIndexDrop = idx;
	}

	function handleDragLeave() {
		isDragOverList = false;
		taskIndexDrop = -1;
	}

	// ---- ondrop ----
	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOverList = false;

		if (!datatemp) return;

		const { task: draggedTask, taskslist: sourceList, sourceMilestoneId } = datatemp;
		const dropIndex = taskIndexDrop >= 0 ? taskIndexDrop : tasks.length;

		// Cross-milestone
		if (sourceMilestoneId && sourceMilestoneId !== projectManager.milestoneId) {
			await dropInOtherMilestone(draggedTask, datatemp);
			datatemp = null;
			taskIndexDrop = -1;
			return;
		}

		const isSameStatus = draggedTask.status === status?.status;
		const isSameSprint = draggedTask.sprintId === sprintId;

		if (isSameStatus && isSameSprint) {
			await dropSameStatusAndSprint(draggedTask, sourceList, dropIndex);
		} else {
			await dropDifferentStatusOrSprint(draggedTask, sourceList, tasks, dropIndex);
		}

		datatemp = null;
		taskIndexDrop = -1;
	}
</script>

<div
	class="relative flex flex-col gap-1.5"
	role="list"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	{#each tasks as task, i}
		<!-- Ghost drop preview above this card -->
		{#if isDragOverList && taskIndexDrop === i}
			<div class="h-1.5 rounded-full bg-primary/40 transition-all"></div>
		{/if}

		<div data-task-card role="listitem">
			<BoardTask
				{task}
				taskslist={tasks}
				taskIndex={i}
				{statusIndex}
				{status}
				{statusname}
				{sprintIndex}
				{sprintId}
				{level}
				{showSorting}
				{draggingTask}
				bind:taskIndexDrop
				bind:taskdropdata
				bind:isdraggingtask
				bind:isdraggingstatus
				bind:datatemp
			/>
		</div>
	{/each}

	<!-- Ghost at end of list -->
	{#if isDragOverList && taskIndexDrop >= tasks.length}
		<div class="h-1.5 rounded-full bg-primary/40 transition-all"></div>
	{/if}

	<!-- Empty drop target indicator -->
	{#if tasks.length === 0 && isDragOverList}
		<div
			class="flex h-10 items-center justify-center rounded-lg border-2 border-dashed border-primary/40 text-xs text-muted-foreground"
		>
			Drop here
		</div>
	{/if}
</div>
