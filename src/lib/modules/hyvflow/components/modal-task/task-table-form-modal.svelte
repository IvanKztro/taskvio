<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Timestamp, where } from 'firebase/firestore';
	import { TaskStatus, type ActivityTask, type Task } from '$lib/modules/hyvflow/types/task';
	import { firekitCollection, firekitUser } from 'svelte-firekit';
	import {
		sideleft,
		taskcurrentrelationships,
		taskrelationships
	} from '$lib/modules/hyvflow/stores/actions/tasks-action';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		IconCircle,
		IconCalendar,
		IconHourglass,
		IconTag,
		IconUser,
		IconCircleMinus,
		IconGitMerge,
		IconFlag,
		IconPlug,
		IconAlertTriangle,
		IconCircleCheck
	} from '@tabler/icons-svelte';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import StatusDropdown from '$lib/modules/hyvflow/components/dropdown/tasks/status-dropdown.svelte';
	import TaskDates from '../tasks/task-dates.svelte';
	import TasksEstimateTime from '../tasks/tasks-estimate-time.svelte';
	import TasksTags from './tasks-tags.svelte';
	import MembersSelect from '../workspace/members-select.svelte';
	import PriorityDropdown from '$lib/modules/hyvflow/components/dropdown/tasks/priority-dropdown.svelte';
	import ChronometerDropdown from '$lib/modules/hyvflow/components/dropdown/tasks/chronometer-dropdown.svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { NotificationType } from '../../types/notifications';
	import { updateTaskStatusRecursively } from '$lib/modules/hyvflow/stores/firestore-batch/task-batch';

	let {
		membersByProject,
		taskValue
	}: {
		membersByProject: any[];
		taskValue: Task;
	} = $props();

	function handleBadgeClick(type: string) {
		taskcurrentrelationships.set({
			type,
			items: $taskrelationships.find((g: { type: string }) => g.type === type)?.items || []
		});
		sideleft.set('items');
	}

	let checkboxvalue = $state(false);
	let openalert = $state(false);
	let openSubtasksDialog = $state(false);
	let pendingStatusChange: { newStatus: string; statusName: string } | null = $state(null);

	const milestone = $derived(projectManager.milestoneData);

	const subtasksCollection = $derived.by(() => {
		if (!milestone?.id || !taskValue?.id || !milestone?.projectId) {
			return { data: [] };
		}
		return firekitCollection<Task>(
			`projects/${milestone.projectId}/milestones/${milestone.id}/tasks`,
			[where('parentId', '==', taskValue.id), where('status', '!=', TaskStatus.Canceled)]
		);
	});

	const subtasks = $derived(
		[...(subtasksCollection.data || [])].sort((a, b) => (a.position || 0) - (b.position || 0))
	);

	let subtasksReady = $state(false);
	let lastTaskId = $state<string>('');

	$effect(() => {
		const currentTaskId = taskValue?.id;
		if (currentTaskId !== lastTaskId) {
			subtasksReady = false;
			lastTaskId = currentTaskId || '';
		}
	});

	$effect(() => {
		if (subtasksCollection.data !== undefined) {
			subtasksReady = true;
		}
	});

	const tasksrelationshipCollection = $derived.by(() => {
		const tasksIds = taskValue?.relationships?.map((r: any) => r.taskuid) || [];
		const statusArray = milestone?.arrayStatus?.map((mm: any) => mm.status) || [];

		if (!tasksIds.length || !statusArray.length) return null;

		return firekitCollection<Task>(
			`projects/${milestone?.projectId}/milestones/${milestone?.id}/tasks`,
			[where('id', 'in', tasksIds), where('status', 'in', statusArray)]
		);
	});

	const tasklist = $derived(tasksrelationshipCollection?.data ?? []);

	$effect(() => {
		const groups: any = {};

		if (!tasklist || tasklist.length === 0) {
			taskrelationships.set([]);
			return;
		}

		if (Array.isArray(taskValue?.relationships)) {
			const taskMap = new Map(tasklist.map((task: any) => [task.id, task]));

			taskValue?.relationships?.forEach((relationship: { type: string; taskuid: string }) => {
				if (!groups[relationship.type]) groups[relationship.type] = [];
				const task = taskMap.get(relationship.taskuid);
				groups[relationship.type].push({ ...relationship, taskDetails: task || {} });
			});

			taskrelationships.set(
				Object.entries(groups).map(([type, items]) => ({ type, items }))
			);
		} else {
			taskrelationships.set([]);
		}
	});

	$effect(() => {
		checkboxvalue = taskValue?.status === TaskStatus.Complete;
	});

	async function updateStatusCheck(event: any) {
		const newStatus = checkboxvalue ? TaskStatus.Complete : TaskStatus.Active;
		const drag = milestone.arrayStatus.find((s: any) => s.status === taskValue.status);
		const drop = milestone.arrayStatus.find((s: any) => s.status === newStatus);

		if (!drag || !drop) return;

		if (subtasks.length > 0) {
			event.preventDefault();
			checkboxvalue = !checkboxvalue;
			pendingStatusChange = { newStatus, statusName: drop.name };
			openSubtasksDialog = true;
			return;
		}

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Changed status from ${drag.name} to ${drop.name}`
		};
		taskManager.addNewActivity(newactivity, taskValue, {
			updated: {
				status: newStatus,
				position: checkboxvalue ? 1 : taskValue?.position
			}
		});
		taskValue.status = newStatus;
	}

	function handleCheckbox(event: any) {
		const dependecies = tasklist?.filter((rs: any) => rs.status !== 'Complete');
		if (dependecies.length > 0 && !checkboxvalue) {
			event.preventDefault();
			openalert = true;
		}
	}

	async function applyStatusToTaskOnly() {
		if (!pendingStatusChange) return;

		const newStatus = pendingStatusChange.newStatus;
		const drag = milestone.arrayStatus.find((s: any) => s.status === taskValue.status);
		const drop = milestone.arrayStatus.find((s: any) => s.status === newStatus);
		if (!drag || !drop) return;

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Changed status from ${drag.name} to ${drop.name}`
		};

		taskManager.addNewActivity(newactivity, taskValue, {
			updated: {
				status: newStatus,
				position: newStatus === TaskStatus.Complete ? 1 : taskValue?.position
			}
		});

		taskValue.status = newStatus;
		checkboxvalue = newStatus === TaskStatus.Complete;
		openSubtasksDialog = false;
		pendingStatusChange = null;
	}

	async function applyStatusToTaskAndSubtasks() {
		if (!pendingStatusChange) return;

		const newStatus = pendingStatusChange.newStatus;
		const drag = milestone.arrayStatus.find((s: any) => s.status === taskValue.status);
		const drop = milestone.arrayStatus.find((s: any) => s.status === newStatus);
		if (!drag || !drop) return;

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Changed status from ${drag.name} to ${drop.name}`
		};

		await updateTaskStatusRecursively(taskValue, milestone, newStatus, [newactivity]);

		taskValue.status = newStatus;
		checkboxvalue = newStatus === TaskStatus.Complete;
		openSubtasksDialog = false;
		pendingStatusChange = null;
	}

	async function updatedAssignes(value: any, user: any, typeaction: string) {
		const assignees = value.map((v: any) => (typeof v === 'string' ? v : v.id || v.uid));

		const newactivity: ActivityTask = {
			createdBy: firekitUser.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `${user.displayName} has been ${typeaction}.`
		};
		const tasktTemp = { ...taskValue, assignees };

		taskManager.addNewActivity(newactivity, tasktTemp, {
			updated: { assignees },
			typeNotification: NotificationType.Assignee
		});
	}
</script>

{#if taskValue}
	<section class="mb-2 grid w-full grid-cols-1 md:grid-cols-2">
		<table>
			<tbody>
				<tr class="grid grid-cols-3">
					<th class="col-span-1 flex w-[200px] items-center gap-2 text-sm font-medium text-muted-foreground">
						<IconCircle class="size-4" />
						<p class="text-start text-xs">Status</p>
					</th>
					<th class="col-span-2 flex cursor-pointer items-center gap-2 font-medium">
						<StatusDropdown
							typestatus={taskValue?.status}
							{taskValue}
							{tasklist}
							{subtasks}
							{subtasksReady}
							bind:openalert
							bind:openSubtasksDialog
							bind:pendingStatusChange
						/>
						<input
							type="checkbox"
							class="size-5"
							bind:checked={checkboxvalue}
							onclick={handleCheckbox}
							onchange={updateStatusCheck}
						/>
					</th>
				</tr>
				<tr class="grid grid-cols-3">
					<th class="col-span-1 flex w-[200px] items-center gap-2 text-sm font-medium text-muted-foreground">
						<IconCalendar class="size-4" />
						<p class="text-start text-xs">Start Date</p>
					</th>
					<th class="col-span-2 cursor-pointer font-medium hover:rounded-lg hover:bg-muted/50">
						<TaskDates {taskValue} labelValue="startDate" />
					</th>
				</tr>
				<tr class="grid grid-cols-3">
					<th class="col-span-1 flex w-[200px] items-center gap-2 text-sm font-medium text-muted-foreground">
						<IconCalendar class="size-4" />
						<p class="text-start text-xs">Due Date</p>
					</th>
					<th class="col-span-2 cursor-pointer font-medium hover:rounded-lg hover:bg-muted/50">
						<TaskDates {taskValue} labelValue="dueDate" />
					</th>
				</tr>
				<tr class="grid grid-cols-3">
					<th class="col-span-1 flex w-[200px] items-center gap-2 text-sm font-medium text-muted-foreground">
						<IconHourglass class="size-4" />
						<p class="text-start text-xs">Time Estimate</p>
					</th>
					<th class="col-span-2 cursor-pointer font-medium hover:rounded-lg hover:bg-muted/50">
						<TasksEstimateTime {taskValue} />
					</th>
				</tr>
				<tr class="grid grid-cols-3">
					<th class="col-span-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<IconTag class="size-4" />
						<p class="text-start text-xs">Tags</p>
					</th>
					<th class="col-span-2 cursor-pointer font-medium hover:rounded-lg hover:bg-muted/50">
						{#if taskValue}
							<TasksTags tags={taskValue?.tags} typefield="input" {taskValue} />
						{/if}
					</th>
				</tr>
			</tbody>
		</table>

		<table>
			<tbody>
				<tr class="grid grid-cols-3">
					<th class="col-span-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<IconUser class="size-4" />
						<p class="text-start text-xs">Assignees</p>
					</th>
					<th class="col-span-2 cursor-pointer font-medium hover:rounded-lg hover:bg-muted/50">
						<MembersSelect
							value={taskValue?.assignees || []}
							users={membersByProject}
							typecomp="task"
							updatedField={true}
							updatedClick={updatedAssignes}
						/>
					</th>
				</tr>
				<tr class="grid grid-cols-3">
					<th class="col-span-1 flex w-[200px] items-center gap-2 text-sm font-medium text-muted-foreground">
						<IconFlag class="size-4" />
						<p class="text-start text-xs">Priority</p>
					</th>
					<th class="col-span-2 cursor-pointer font-medium hover:rounded-lg hover:bg-muted/50">
						<PriorityDropdown priority={taskValue?.priority} typefield="field" {taskValue} />
					</th>
				</tr>
				<tr class="grid grid-cols-3">
					<th class="col-span-1 flex w-[200px] items-center gap-2 text-sm font-medium text-muted-foreground">
						<IconHourglass class="size-4" />
						<p class="text-start text-xs">Track Time</p>
					</th>
					<th class="col-span-2 cursor-pointer font-medium hover:rounded-lg hover:bg-muted/50">
						<ChronometerDropdown trackTime={taskValue?.trackTime} {taskValue} />
					</th>
				</tr>
				<tr class="grid grid-cols-3">
					<th class="col-span-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<IconPlug class="size-4" />
						<p class="text-start text-xs">Relationships</p>
					</th>
					<th class="col-span-2 cursor-pointer font-medium hover:rounded-lg hover:bg-muted/50">
						<Button
							variant="outline"
							class="flex h-9 w-full cursor-pointer items-center justify-start px-1 text-start"
							onclick={() => sideleft.set('relationship')}
						>
							<div class="flex h-full flex-wrap items-center gap-1">
								{#if $taskrelationships && $taskrelationships?.length > 0}
									{#each $taskrelationships as group}
										<div
											onclick={(e) => {
												e.stopPropagation();
												handleBadgeClick(group.type);
											}}
											role="button"
											tabindex="0"
											onkeydown={(e) => {
												if (e.key === 'Enter') handleBadgeClick(group.type);
											}}
										>
											<Badge
												variant="outline"
												class="flex h-5 cursor-pointer items-center gap-1 hover:bg-primary hover:text-white"
											>
												{#if group.type === 'link'}
													<IconCircleCheck class="size-3" />
												{:else if group.type === 'waiting'}
													<IconAlertTriangle class="size-3 text-yellow-600" />
												{:else if group.type === 'blocking'}
													<IconCircleMinus class="size-3 text-red-600" />
												{/if}
												<small class="text-[10px]">{group.type}: {group.items.length}</small>
											</Badge>
										</div>
									{/each}
								{:else}
									<span class="ml-2 text-sm text-muted-foreground">Empty</span>
								{/if}
							</div>
						</Button>
					</th>
				</tr>
			</tbody>
		</table>
	</section>
{/if}

<Dialog.Root bind:open={openalert}>
	<Dialog.Content escapeKeydownBehavior="ignore" class="sm:max-w-[550px]">
		<Dialog.Header>
			<Dialog.Title>Hold on — There Are Dependent Tasks</Dialog.Title>
			<Dialog.Description>
				You can't mark this task as complete yet. There are still other tasks that depend on it and haven't been finished.
			</Dialog.Description>
		</Dialog.Header>
		<section class="space-y-2 py-2">
			{#each tasklist as task (task.id)}
				<div class="rounded-md border px-3 py-2">
					<p class="font-medium">{task.name}</p>
					<p class="text-sm text-muted-foreground">Status: {task.status}</p>
				</div>
			{/each}
		</section>
		<Dialog.Footer>
			<Button variant="outline" class="border-primary text-primary" onclick={() => (openalert = false)}>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={openSubtasksDialog}>
	<Dialog.Content escapeKeydownBehavior="ignore" class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<IconGitMerge class="size-5" />
				This Task Has Subtasks
			</Dialog.Title>
			<Dialog.Description>
				This task has {subtasks.length} subtask{subtasks.length > 1 ? 's' : ''}. Would you like to apply the status change to all subtasks as well?
			</Dialog.Description>
		</Dialog.Header>
		<section class="space-y-2 py-2">
			<div class="rounded-md border bg-muted/30 p-3">
				<p class="text-sm font-medium">New Status: {pendingStatusChange?.statusName}</p>
			</div>
			<div class="mt-3 space-y-2">
				<p class="text-sm font-medium">Subtasks ({subtasks.length}):</p>
				<div class="max-h-[200px] space-y-1 overflow-y-auto">
					{#each subtasks as subtask (subtask.id)}
						<div class="rounded-md border px-3 py-2">
							<p class="text-sm font-medium">{subtask.name}</p>
							<p class="text-xs text-muted-foreground">Current: {subtask.status}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>
		<Dialog.Footer class="flex-col gap-2 sm:flex-col">
			<Button onclick={applyStatusToTaskAndSubtasks} class="w-full">
				Update Task and All Subtasks
			</Button>
			<Button onclick={applyStatusToTaskOnly} variant="outline" class="w-full">
				Update Only This Task
			</Button>
			<Button
				variant="ghost"
				onclick={() => {
					openSubtasksDialog = false;
					pendingStatusChange = null;
				}}
				class="w-full"
			>
				Cancel
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	th {
		margin: 10px 10px;
	}

	.text-start {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
</style>
