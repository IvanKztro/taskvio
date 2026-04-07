<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { Task, ActivityTask } from '$lib/modules/hyvflow/types/task';
	import { TaskStatus, TaskType } from '$lib/modules/hyvflow/types/task';
	import { Timestamp } from 'firebase/firestore';
	import { firekitUser } from 'svelte-firekit';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { openmodaltask, currentTaskID } from '$lib/modules/hyvflow/stores/firestore-batch/batch';
	import { updateTasksPositionsByDragDrop } from '$lib/modules/hyvflow/stores/firestore-batch/task-batch';
	import IconFlag from '$lib/modules/hyvflow/components/icon-flag.svelte';
	import { IconPlus, IconGripVertical } from '@tabler/icons-svelte';

	let {
		tasks = [],
		sprintId = '',
		status = 'Active',
		leveltasks = 0,
		currenttask
	}: {
		tasks: Task[];
		sprintId?: string;
		status?: string;
		leveltasks?: number;
		currenttask: Task;
	} = $props();

	let showAddForm = $state(false);
	let newTaskName = $state('');
	let dragIndex = $state<number | null>(null);
	let dropIndex = $state<number | null>(null);

	const milestone = $derived(projectManager.milestoneData);

	async function addSubtask() {
		if (!newTaskName.trim() || !milestone) return;

		taskManager.setIds(projectManager.projectId, projectManager.milestoneId);

		const newTask: Partial<Task> = {
			name: newTaskName.trim(),
			status: TaskStatus.Active,
			taskType: TaskType.Task,
			position: tasks.length,
			sprintId: sprintId || currenttask?.sprintId || '',
			milestoneId: projectManager.milestoneId,
			createdAt: Timestamp.now(),
			createdBy: firekitUser?.uid as string,
			parentId: currenttask.id
		};

		await taskManager.createTask(newTask);

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Added subtask: ${newTaskName.trim()}`
		};
		taskManager.addNewActivity(newactivity, currenttask, {});

		newTaskName = '';
		showAddForm = false;
	}

	function openSubtask(task: Task) {
		currentTaskID.set(task.id);
	}

	function handleDragStart(e: DragEvent, index: number) {
		dragIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		dropIndex = index;
	}

	async function handleDrop(e: DragEvent, index: number) {
		e.preventDefault();
		if (dragIndex === null || dragIndex === index) {
			dragIndex = null;
			dropIndex = null;
			return;
		}

		const mutableList = [...tasks];
		const [moved] = mutableList.splice(dragIndex, 1);
		mutableList.splice(index, 0, moved);

		mutableList.forEach((t, i) => {
			t.position = i;
		});

		if (milestone) {
			await updateTasksPositionsByDragDrop(mutableList, milestone);
		}

		dragIndex = null;
		dropIndex = null;
	}

	function handleDragEnd() {
		dragIndex = null;
		dropIndex = null;
	}

	function getStatusColor(taskStatus: string): string {
		const statusObj = milestone?.arrayStatus?.find((s: any) => s.status === taskStatus);
		return statusObj?.color || '#94a3b8';
	}
</script>

<div class="space-y-1" style="padding-left: {leveltasks * 16}px">
	{#if tasks.length > 0}
		<div class="grid grid-cols-[auto_1fr_100px_100px_80px] gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
			<span class="w-6"></span>
			<span>Name</span>
			<span>Status</span>
			<span>Due Date</span>
			<span>Priority</span>
		</div>
	{/if}

	{#each tasks as task, i (task.id)}
		<div
			class="group grid grid-cols-[auto_1fr_100px_100px_80px] items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-muted/30 {dragIndex === i ? 'opacity-50' : ''} {dropIndex === i ? 'border-t-2 border-t-primary' : ''}"
			draggable="true"
			ondragstart={(e) => handleDragStart(e, i)}
			ondragover={(e) => handleDragOver(e, i)}
			ondrop={(e) => handleDrop(e, i)}
			ondragend={handleDragEnd}
			role="listitem"
		>
			<IconGripVertical class="size-4 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100" />

			<button
				class="cursor-pointer truncate text-left text-sm hover:text-primary"
				onclick={() => openSubtask(task)}
			>
				{task.name}
			</button>

			<span class="text-xs font-medium" style="color: {getStatusColor(task.status)}">
				{milestone?.arrayStatus?.find((s) => s.status === task.status)?.name || task.status}
			</span>

			<span class="text-xs text-muted-foreground">
				{#if task.dueDate?.seconds}
					{new Date(task.dueDate.seconds * 1000).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric'
					})}
				{:else}
					—
				{/if}
			</span>

			<div class="flex items-center">
				{#if task.priority}
					<IconFlag className="w-3.5 h-4" flagtype={task.priority} hastext={false} />
					<small class="ml-1 text-xs">{task.priority}</small>
				{:else}
					<span class="text-xs text-muted-foreground">—</span>
				{/if}
			</div>
		</div>
	{/each}

	{#if showAddForm}
		<div class="flex items-center gap-2 px-2">
			<Input
				bind:value={newTaskName}
				placeholder="Subtask name..."
				class="h-8 flex-1 text-sm"
				autofocus
				onkeydown={(e) => {
					if (e.key === 'Enter') addSubtask();
					if (e.key === 'Escape') (showAddForm = false);
				}}
			/>
			<Button size="sm" class="h-8" onclick={addSubtask}>Add</Button>
			<Button variant="ghost" size="sm" class="h-8" onclick={() => (showAddForm = false)}>
				Cancel
			</Button>
		</div>
	{:else}
		<Button
			variant="ghost"
			size="sm"
			class="mt-1 gap-1 text-muted-foreground hover:text-foreground"
			onclick={() => (showAddForm = true)}
		>
			<IconPlus class="size-4" /> Add subtask
		</Button>
	{/if}
</div>
