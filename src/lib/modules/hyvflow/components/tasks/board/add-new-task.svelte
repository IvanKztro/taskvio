<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { IconPlus, IconCalendar } from '@tabler/icons-svelte';
	import * as PopoverCal from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { DateFormatter, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { Timestamp } from 'firebase/firestore';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils';

	let {
		status,
		taskslength,
		sprintId,
		parentId,
		typebutton = 'ghost',
		text,
		btnvariant,
		btnsize
	}: {
		status: any;
		taskslength: number;
		sprintId: string;
		parentId?: string;
		typebutton?: string;
		text?: string;
		btnvariant?: string;
		btnsize?: string;
	} = $props();

	let open = $state(false);
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

		taskManager.setIds(projectManager.projectId, projectManager.milestoneId);

		try {
			await taskManager.createTask({
				name: name.trim(),
				status: status?.status ?? 'Active',
				sprintId,
				parentId: parentId ?? '',
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
			open = false;
		} catch {
			toast.error('Error creating task');
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleAdd();
		if (e.key === 'Escape') open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				variant={(btnvariant ?? typebutton) as any}
				size={(btnsize as any) ?? 'sm'}
				class="h-7 gap-1 px-2 text-xs"
				{...props}
			>
				<IconPlus class="size-3.5" />
				{text ?? 'Add Task'}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-72 p-3" align="start">
		<div class="space-y-3">
			<p class="text-sm font-medium">New Task</p>

			<div class="space-y-1">
				<Label class="text-xs">Name</Label>
				<Input
					bind:value={name}
					placeholder="Task name..."
					class="h-8 text-sm"
					onkeydown={handleKeydown}
					autofocus
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
									{startDate ? df.format(startDate.toDate(getLocalTimeZone())) : 'Start'}
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
									{dueDate ? df.format(dueDate.toDate(getLocalTimeZone())) : 'Due'}
								</button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-auto p-0" trapFocus={false}>
							<Calendar type="single" bind:value={dueDate} minValue={startDate ?? todayDate} />
						</Popover.Content>
					</Popover.Root>
				</div>
			</div>

			<div class="flex justify-end gap-2">
				<Button variant="ghost" size="sm" class="h-7 px-3 text-xs" onclick={() => (open = false)}>
					Cancel
				</Button>
				<Button
					size="sm"
					class="h-7 px-3 text-xs"
					onclick={handleAdd}
					disabled={!name.trim() || loading}
				>
					Add
				</Button>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
