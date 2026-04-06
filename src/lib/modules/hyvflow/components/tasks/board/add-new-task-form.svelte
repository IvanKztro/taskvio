<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { IconCalendar } from '@tabler/icons-svelte';
	import { DateFormatter, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { sprintIdstatus, statusActions } from '$lib/modules/hyvflow/stores/actions/status-action';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils';
	import { get } from 'svelte/store';

	let {
		taskslength,
		milestoneId
	}: {
		taskslength: number;
		milestoneId: string;
	} = $props();

	let name = $state('');
	let startDate = $state<DateValue | undefined>();
	let dueDate = $state<DateValue | undefined>();
	let startOpen = $state(false);
	let dueOpen = $state(false);
	let loading = $state(false);

	const df = new DateFormatter('en-US', { dateStyle: 'medium' });
	const todayDate = today(getLocalTimeZone());

	$effect(() => { if (startDate) startOpen = false; });
	$effect(() => { if (dueDate) dueOpen = false; });

	async function handleAdd() {
		if (!name.trim()) return;
		loading = true;

		const projectId = projectManager.projectId;
		const mid = projectManager.milestoneId || milestoneId;
		taskManager.setIds(projectId, mid);

		const sprintId = get(sprintIdstatus);
		const status = get(statusActions);

		try {
			await taskManager.createTask({
				name: name.trim(),
				status: status?.status ?? 'Active',
				sprintId: sprintId ?? '',
				parentId: '',
				position: taskslength + 1,
				...(startDate
					? { startDate: startDate.toDate(getLocalTimeZone()) as any }
					: {}),
				...(dueDate ? { dueDate: dueDate.toDate(getLocalTimeZone()) as any } : {})
			});

			toast.success('Task created');
			name = '';
			startDate = undefined;
			dueDate = undefined;
		} catch {
			toast.error('Error creating task');
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleAdd();
	}
</script>

<div class="space-y-3 p-1">
	<div class="space-y-1">
		<Label class="text-xs">Task Name</Label>
		<Input
			bind:value={name}
			placeholder="Task name..."
			class="h-8 text-sm"
			onkeydown={handleKeydown}
		/>
	</div>

	<div class="flex gap-2">
		<div class="flex-1 space-y-1">
			<Label class="text-xs">Start Date</Label>
			<Popover.Root bind:open={startOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<button
							class={cn(
								buttonVariants({ variant: 'outline' }),
								'h-8 w-full justify-start px-2 text-xs',
								!startDate && 'text-muted-foreground'
							)}
							{...props}
						>
							<IconCalendar class="mr-1 size-3.5" />
							{startDate ? df.format(startDate.toDate(getLocalTimeZone())) : 'Start date'}
						</button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0" trapFocus={false}>
					<Calendar type="single" bind:value={startDate} minValue={todayDate} />
				</Popover.Content>
			</Popover.Root>
		</div>

		<div class="flex-1 space-y-1">
			<Label class="text-xs">Due Date</Label>
			<Popover.Root bind:open={dueOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<button
							class={cn(
								buttonVariants({ variant: 'outline' }),
								'h-8 w-full justify-start px-2 text-xs',
								!dueDate && 'text-muted-foreground'
							)}
							{...props}
						>
							<IconCalendar class="mr-1 size-3.5" />
							{dueDate ? df.format(dueDate.toDate(getLocalTimeZone())) : 'Due date'}
						</button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0" trapFocus={false}>
					<Calendar type="single" bind:value={dueDate} minValue={startDate ?? todayDate} />
				</Popover.Content>
			</Popover.Root>
		</div>
	</div>

	<div class="flex justify-end">
		<Button
			size="sm"
			class="h-8 px-4 text-sm"
			onclick={handleAdd}
			disabled={!name.trim() || loading}
		>
			{loading ? 'Adding...' : 'Add'}
		</Button>
	</div>
</div>
