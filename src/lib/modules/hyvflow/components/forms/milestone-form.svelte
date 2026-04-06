<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import { MilestoneStatus, type ArrayStatus, type Milestone, type SprintApp } from '$lib/modules/hyvflow/types/milestone';
	import { Timestamp } from 'firebase/firestore';
	import { firekitDocMutations, firekitUser } from 'svelte-firekit';
	import { toast } from 'svelte-sonner';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibot } from 'sveltekit-superforms/adapters';
	import { milestoneSchema } from '$lib/modules/hyvflow/schemas/milestone';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { DateFormatter, fromDate, getLocalTimeZone, type DateValue, today } from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { get } from 'svelte/store';
	import { isopenmilestone, milestoneActions, projectIdStore } from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { onMount } from 'svelte';
	import { IconCalendar } from '@tabler/icons-svelte';

	const data = defaults(valibot(milestoneSchema));
	let startDate = $state<DateValue | undefined>();
	let dueDate = $state<DateValue | undefined>();
	let contentRef = $state<HTMLElement | null>(null);
	const todayDate = today(getLocalTimeZone());
	let minDueDate = $derived(startDate);
	const df = new DateFormatter('en-US', { dateStyle: 'long' });

	const form = superForm(data, {
		validators: valibot(milestoneSchema),
		dataType: 'json',
		SPA: true,
		resetForm: false,
		clearOnSubmit: 'errors-and-message',
		async onUpdate({ form }) {
			if (!form.valid) return;
			const { data } = form;

			if (!$milestoneActions) {
				const arraystatus: ArrayStatus[] = [
					{ position: 1, color: '#E2E8F0', name: 'TO DO', status: 'Active' },
					{ position: 2, color: '#60A5FA', name: 'IN PROGRESS', status: 'InProgress' },
					{ position: 3, color: '#4ADE80', name: 'COMPLETE', status: 'Complete' }
				];
				const arraySprints: SprintApp = { id: crypto.randomUUID(), name: 'Sprint 1', position: 1 };
				const newmilestone: Partial<Milestone> = {
					...data,
					id: '',
					arraySprints: [arraySprints],
					arrayStatus: arraystatus,
					createdBy: firekitUser.uid as string,
					status: MilestoneStatus.Active,
					projectId: get(projectIdStore),
					...(startDate ? { startDate: Timestamp.fromDate(startDate.toDate(getLocalTimeZone())) } : {}),
					...(dueDate ? { dueDate: Timestamp.fromDate(dueDate.toDate(getLocalTimeZone())) } : {})
				};
				const response = await firekitDocMutations.add(`projects/${get(projectIdStore)}/milestones`, newmilestone);
				if (response.success) {
					isopenmilestone.set(false);
					toast.success('Milestone created successfully');
				} else {
					toast.error('Error creating Milestone');
				}
			} else {
				const updated: Partial<Milestone> = {
					...data,
					...(startDate ? { startDate: Timestamp.fromDate(startDate.toDate(getLocalTimeZone())) } : {}),
					...(dueDate ? { dueDate: Timestamp.fromDate(dueDate.toDate(getLocalTimeZone())) } : {})
				};
				const res = await firekitDocMutations.update(
					`projects/${get(projectIdStore)}/milestones/${$milestoneActions.id}`,
					updated
				);
				if (res.success) {
					isopenmilestone.set(false);
					toast.success('Milestone updated successfully');
				} else {
					toast.error('Error updating Milestone');
				}
			}
		}
	});

	onMount(() => {
		if ($milestoneActions) {
			const ml = get(milestoneActions);
			const timeZone = getLocalTimeZone();
			$formData.name = ml?.name || '';
			$formData.description = (ml?.description as string) || '';
			if (ml?.dueDate?.seconds) dueDate = fromDate(new Date(ml.dueDate.seconds * 1000), timeZone);
			if (ml?.startDate?.seconds) startDate = fromDate(new Date(ml.startDate.seconds * 1000), timeZone);
		}
	});

	const { form: formData, enhance } = form;
</script>

<div>
	<form method="POST" use:enhance class="w-full space-y-3">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Milestone Name</Form.Label>
					<Input {...props} bind:value={$formData.name} placeholder="Milestone Name" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<section class="flex w-auto gap-2">
			<div class="flex w-full flex-col gap-1.5">
				<Label>Start Date</Label>
				<Popover.Root>
					<Popover.Trigger class={cn(buttonVariants({ variant: 'outline', class: 'h-[30px] justify-start text-left font-normal' }), !startDate && 'text-muted-foreground')}>
						<IconCalendar class="size-4" />
						{startDate ? df.format(startDate.toDate(getLocalTimeZone())) : 'Start date'}
					</Popover.Trigger>
					<Popover.Content bind:ref={contentRef} class="w-auto p-0" trapFocus={false}>
						<Calendar type="single" bind:value={startDate} minValue={todayDate} />
					</Popover.Content>
				</Popover.Root>
			</div>
			<div class="flex w-full flex-col gap-1.5">
				<Label>Due Date</Label>
				<Popover.Root>
					<Popover.Trigger class={cn(buttonVariants({ variant: 'outline', class: 'h-[30px] justify-start text-left font-normal' }), !dueDate && 'text-muted-foreground')}>
						<IconCalendar class="size-4" />
						{dueDate ? df.format(dueDate.toDate(getLocalTimeZone())) : 'Due date'}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0" trapFocus={false}>
						<Calendar type="single" bind:value={dueDate} minValue={minDueDate} />
					</Popover.Content>
				</Popover.Root>
			</div>
		</section>

		<Form.Field {form} name="description">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Description</Form.Label>
					<Textarea {...props} bind:value={$formData.description} placeholder="Description..." class="h-[100px]" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex items-center justify-end">
			<Form.Button class="mt-2 ml-auto block px-5" variant="default">Save</Form.Button>
		</div>
	</form>
</div>
