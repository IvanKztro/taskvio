<script lang="ts">
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { TaskStatus, type ActivityTask, type Task } from '$lib/modules/hyvflow/types/task';
	import { Timestamp } from 'firebase/firestore';
	import { firekitUser } from 'svelte-firekit';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { NotificationType } from '$lib/modules/hyvflow/types/notifications';
	import { updateTaskStatusRecursively } from '$lib/modules/hyvflow/stores/firestore-batch/task-batch';

	let {
		typestatus = $bindable(),
		taskValue,
		tasklist = [],
		subtasks = [],
		subtasksReady = true,
		openalert = $bindable(),
		openSubtasksDialog = $bindable(),
		pendingStatusChange = $bindable(),
	}: {
		typestatus: string;
		taskValue: Task;
		tasklist?: Task[];
		subtasks?: Task[];
		subtasksReady?: boolean;
		openalert?: boolean;
		openSubtasksDialog?: boolean;
		pendingStatusChange?: { newStatus: string; statusName: string } | null;
	} = $props();

	const milestone = $derived(projectManager.milestoneData);

	function handleSelect(state: any) {
		if (!subtasksReady) return;

		const dependecies = tasklist?.filter((rs: any) => rs.status !== 'Complete');
		if (dependecies && dependecies.length > 0 && state.status === TaskStatus.Complete) {
			openalert = true;
			return;
		}

		if (subtasks && subtasks.length > 0) {
			pendingStatusChange = { newStatus: state.status, statusName: state.name };
			openSubtasksDialog = true;
			return;
		}

		setStatusType(state);
	}

	async function setStatusType(state: any) {
		const drag = milestone.arrayStatus.find((s: any) => s.status === typestatus);
		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Changed status from ${drag?.name} to ${state.name}`
		};
		const task: Partial<Task> = {
			status: state.status,
			position: 1
		};
		if (state.status === TaskStatus.Complete) {
			task.endDate = Timestamp.now();
		}
		taskManager.addNewActivity(newactivity, taskValue, {
			updated: task,
			typeNotification: NotificationType.Status
		});

		typestatus = state.status;
	}

	const isSelected = (state: string) => typestatus == state;
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="flex items-center gap-2">
		<Button
			variant="outline"
			size="icon"
			class="flex w-full justify-start bg-transparent text-start hover:border"
		>
			{#if milestone != null && milestone.arrayStatus}
				{#each milestone.arrayStatus as state}
					{#if isSelected(state.status)}
						<div class="flex items-center justify-start gap-2 rounded-md px-3 py-1">
							<h1
								class="text-xs font-semibold"
								style="color: {state.color === '#E2E8F0' ? 'gray' : state.color};"
							>
								{state.name}
							</h1>
						</div>
					{/if}
				{/each}
			{/if}
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="z-[70] w-56 border border-primary/70" trapFocus={false}>
		{#if milestone != null && milestone.arrayStatus}
			{#each milestone.arrayStatus as state}
				<DropdownMenu.CheckboxItem
					onclick={() => handleSelect(state)}
					class="{isSelected(state.status) && 'bg-primary text-white'} cursor-pointer"
				>
					<span style="background-color: {state.color};" class="mr-2 h-4 w-4 rounded-full"></span>
					{state.name}
				</DropdownMenu.CheckboxItem>
			{/each}
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
