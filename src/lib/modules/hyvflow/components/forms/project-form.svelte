<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import { projectSchema } from '$lib/modules/hyvflow/schemas/project';
	import { firekitDocMutations, firekitUser } from 'svelte-firekit';
	import { toast } from 'svelte-sonner';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibot } from 'sveltekit-superforms/adapters';
	import { Timestamp } from 'firebase/firestore';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Label } from '$lib/components/ui/label';
	import { IconCalendar } from '@tabler/icons-svelte';
	import { DateFormatter, type DateValue, fromDate, getLocalTimeZone, today } from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { ProjectStatus, type Project } from '$lib/modules/hyvflow/types/project';
	import { MilestoneStatus, type ArrayStatus, type Milestone, type SprintApp } from '$lib/modules/hyvflow/types/milestone';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { isopenproject, projectActions } from '$lib/modules/hyvflow/stores/actions/project-action';
	import { get } from 'svelte/store';
	import { notificationManager } from '$lib/modules/hyvflow/stores/notifications-manager.svelte';
	import { NotificationType } from '$lib/modules/hyvflow/types/notifications';

	const df = new DateFormatter('en-US', { dateStyle: 'long' });
	const data = defaults(valibot(projectSchema));

	let contentRef = $state<HTMLElement | null>(null);
	let startDate = $state<DateValue | undefined>();
	let dueDate = $state<DateValue | undefined>();
	let startDatePopoverOpen = $state(false);
	let dueDatePopoverOpen = $state(false);
	const todayDate = today(getLocalTimeZone());
	let minDueDate = $derived(startDate);

	$effect(() => { if (startDate) startDatePopoverOpen = false; });
	$effect(() => { if (dueDate) dueDatePopoverOpen = false; });

	const form = superForm(data, {
		validators: valibot(projectSchema),
		dataType: 'json',
		SPA: true,
		resetForm: false,
		clearOnSubmit: 'errors-and-message',
		async onUpdate({ form }) {
			if (!form.valid) return;
			const { data } = form;

			if (!$projectActions) {
				const memberIds = data.members.map((m: any) => typeof m === 'string' ? m : m.id);
				const pdata: Partial<Project> = {
					...data,
					members: memberIds,
					status: ProjectStatus.Active,
					createdBy: firekitUser.uid as string,
					createdAt: Timestamp.now(),
					color: '',
					...(startDate ? { startDate: Timestamp.fromDate(startDate.toDate(getLocalTimeZone())) } : {}),
					...(dueDate ? { dueDate: Timestamp.fromDate(dueDate.toDate(getLocalTimeZone())) } : {})
				};
				const response = await firekitDocMutations.add('projects', pdata);
				if (response.success) {
					await setMilestoneDefault(response.data as Project);
				} else {
					toast.error('Error creating project');
				}
			} else {
				const memberIds = data.members.map((m: any) => typeof m === 'string' ? m : m.id);
				const updated: Partial<Project> = {
					...data,
					members: memberIds,
					...(startDate ? { startDate: Timestamp.fromDate(startDate.toDate(getLocalTimeZone())) } : {}),
					...(dueDate ? { dueDate: Timestamp.fromDate(dueDate.toDate(getLocalTimeZone())) } : {})
				};
				const response = await firekitDocMutations.update(`projects/${get(projectActions)?.id}`, updated);
				if (response.success) {
					isopenproject.set(false);
					projectActions.set(undefined);
					toast.success('Project updated successfully');
				} else {
					toast.error('Error updating Project');
				}
			}
		}
	});

	async function setMilestoneDefault(project: Project) {
		const arraystatus: ArrayStatus[] = [
			{ position: 1, color: '#E2E8F0', name: 'TO DO', status: 'Active' },
			{ position: 2, color: '#60A5FA', name: 'IN PROGRESS', status: 'InProgress' },
			{ position: 3, color: '#4ADE80', name: 'COMPLETE', status: 'Complete' }
		];
		const arraySprints: SprintApp = { id: crypto.randomUUID(), name: 'Sprint 1', position: 1 };
		const milestonedefault: Partial<Milestone> = {
			id: '',
			projectId: project.id,
			name: 'Milestone',
			createdBy: firekitUser.uid as string,
			status: MilestoneStatus.Active,
			arrayStatus: arraystatus,
			arraySprints: [arraySprints]
		};
		const response = await firekitDocMutations.add(`projects/${project.id}/milestones`, milestonedefault);
		if (response.success) {
			isopenproject.set(false);
			toast.success('Project created successfully');
			goto(`/p/${project.id}/m/${response.id}`);
		} else {
			toast.error('Error creating default milestone');
		}
	}

	const { form: formData, enhance } = form;

	onMount(() => {
		if ($projectActions) {
			const pp = get(projectActions);
			const timeZone = getLocalTimeZone();
			$formData.name = pp?.name || '';
			$formData.description = pp?.description || '';
			$formData.objectives = pp?.objectives || '';
			$formData.requirements = pp?.requirements || '';
			$formData.resources = pp?.resources || 0;
			$formData.risks = pp?.risks || '';
			$formData.scope = pp?.scope || '';
			$formData.vision = pp?.vision || '';
			$formData.members = pp?.members || [];
			if (pp?.dueDate?.seconds) dueDate = fromDate(new Date(pp.dueDate.seconds * 1000), timeZone);
			if (pp?.startDate?.seconds) startDate = fromDate(new Date(pp.startDate.seconds * 1000), timeZone);
		}
	});
</script>

<div>
	<form method="POST" use:enhance class="h-[75dvh] w-full space-y-3 overflow-y-auto px-2">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Project Name</Form.Label>
					<Input {...props} bind:value={$formData.name} placeholder="Project Name" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="description">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Description</Form.Label>
					<Textarea {...props} bind:value={$formData.description} placeholder="Description..." class="h-[80px]" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<section class="flex w-auto gap-2">
			<div class="flex w-full flex-col gap-1.5">
				<Label>Start Date</Label>
				<Popover.Root bind:open={startDatePopoverOpen}>
					<Popover.Trigger class={cn(buttonVariants({ variant: 'outline', class: 'h-[30px] justify-start text-left font-normal' }), !startDate && 'text-muted-foreground')}>
						<IconCalendar class="size-4" />
						{startDate ? df.format(startDate.toDate(getLocalTimeZone())) : 'Start date'}
					</Popover.Trigger>
					<Popover.Content bind:ref={contentRef} class="w-auto p-0">
						<Calendar type="single" bind:value={startDate} minValue={todayDate} />
					</Popover.Content>
				</Popover.Root>
			</div>
			<div class="flex w-full flex-col gap-1.5">
				<Label>Due Date</Label>
				<Popover.Root bind:open={dueDatePopoverOpen}>
					<Popover.Trigger class={cn(buttonVariants({ variant: 'outline', class: 'h-[30px] justify-start text-left font-normal' }), !dueDate && 'text-muted-foreground')}>
						<IconCalendar class="size-4" />
						{dueDate ? df.format(dueDate.toDate(getLocalTimeZone())) : 'Due date'}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0">
						<Calendar type="single" bind:value={dueDate} minValue={minDueDate} />
					</Popover.Content>
				</Popover.Root>
			</div>
		</section>

		<Form.Field {form} name="objectives">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Objectives</Form.Label>
					<Textarea {...props} bind:value={$formData.objectives} placeholder="Objectives..." class="h-[80px]" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="requirements">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Requirements</Form.Label>
					<Textarea {...props} bind:value={$formData.requirements} placeholder="Requirements..." class="h-[80px]" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="scope">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Scope</Form.Label>
					<Textarea {...props} bind:value={$formData.scope} placeholder="Scope..." class="h-[80px]" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="risks">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Risks</Form.Label>
					<Textarea {...props} bind:value={$formData.risks} placeholder="Risks..." class="h-[80px]" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="vision">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Vision</Form.Label>
					<Textarea {...props} bind:value={$formData.vision} placeholder="Vision..." class="h-[80px]" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex items-center justify-end gap-2 pb-4">
			<Form.Button class="ml-auto block px-5" variant="default">Save</Form.Button>
		</div>
	</form>
</div>
