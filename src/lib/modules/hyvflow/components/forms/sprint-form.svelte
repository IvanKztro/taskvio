<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import { arrayUnion, Timestamp } from 'firebase/firestore';
	import { firekitDocMutations } from 'svelte-firekit';
	import { toast } from 'svelte-sonner';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibot } from 'sveltekit-superforms/adapters';
	import { onMount } from 'svelte';
	import { sprintSchema } from '$lib/modules/hyvflow/schemas/sprint';
	import type { SprintApp } from '$lib/modules/hyvflow/types/milestone';
	import { isopensprint, sprintActions, sprintIndexStore, sprintsActions } from '$lib/modules/hyvflow/stores/actions/sprint-action';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { DateFormatter, fromDate, getLocalTimeZone, type DateValue, today } from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { milestoneActions } from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import { get } from 'svelte/store';
	import { IconCalendar } from '@tabler/icons-svelte';

	const data = defaults(valibot(sprintSchema));
	let startDate = $state<DateValue | undefined>();
	let endDate = $state<DateValue | undefined>();
	const todayDate = today(getLocalTimeZone());
	let minEndDate = $derived(startDate);
	let contentRef = $state<HTMLElement | null>(null);
	let contentRef2 = $state<HTMLElement | null>(null);
	const df = new DateFormatter('en-US', { dateStyle: 'long' });

	const form = superForm(data, {
		validators: valibot(sprintSchema),
		dataType: 'json',
		SPA: true,
		resetForm: false,
		clearOnSubmit: 'errors-and-message',
		async onUpdate({ form }) {
			if (!form.valid) return;
			const { data } = form;

			if (!$sprintActions) {
				const sprintind = Number(get(sprintIndexStore));
				const position = sprintind > -1 ? sprintind + 1 : ($sprintsActions?.length ?? 0) + 1;
				const newsprint: SprintApp = {
					...data,
					id: crypto.randomUUID(),
					position,
					...(startDate ? { startDate: Timestamp.fromDate(startDate.toDate(getLocalTimeZone())) } : {}),
					...(endDate ? { endDate: Timestamp.fromDate(endDate.toDate(getLocalTimeZone())) } : {})
				};

				let allsprints: SprintApp[] | any = get(sprintsActions);
				let response;

				if (sprintind !== -1) {
					allsprints.splice(sprintind + 1, 0, newsprint);
					allsprints = allsprints.map((sprint: SprintApp, index: number) => ({ ...sprint, position: index + 1 }));
					response = await firekitDocMutations.update(
						`projects/${$milestoneActions?.projectId}/milestones/${$milestoneActions?.id}`,
						{ arraySprints: allsprints }
					);
				} else {
					response = await firekitDocMutations.update(
						`projects/${$milestoneActions?.projectId}/milestones/${$milestoneActions?.id}`,
						{ arraySprints: arrayUnion(newsprint) }
					);
				}

				if (response.success) {
					isopensprint.set(false);
					toast.success('Sprint created successfully');
					sprintIndexStore.set(-1);
					sprintsActions.set(undefined);
				} else {
					toast.error('Error creating Sprint');
				}
			} else {
				const updatedSprints = $sprintsActions?.map((sprint: SprintApp) =>
					sprint.id === $sprintActions!.id
						? { ...sprint, ...data, ...(startDate ? { startDate: Timestamp.fromDate(startDate.toDate(getLocalTimeZone())) } : {}), ...(endDate ? { endDate: Timestamp.fromDate(endDate.toDate(getLocalTimeZone())) } : {}) }
						: sprint
				);
				const response = await firekitDocMutations.update(
					`projects/${$milestoneActions?.projectId}/milestones/${$milestoneActions?.id}`,
					{ arraySprints: updatedSprints }
				);
				if (response.success) {
					isopensprint.set(false);
					toast.success('Sprint updated successfully');
				} else {
					toast.error('Error updating Sprint');
				}
			}
			isopensprint.set(false);
			sprintActions.set(undefined);
			sprintsActions.set(undefined);
			milestoneActions.set(undefined);
		}
	});

	const { form: formData, enhance } = form;

	onMount(() => {
		if ($sprintActions) {
			const timeZone = getLocalTimeZone();
			$formData.name = $sprintActions.name;
			if ($sprintActions?.endDate?.seconds) endDate = fromDate(new Date($sprintActions.endDate.seconds * 1000), timeZone);
			if ($sprintActions?.startDate?.seconds) startDate = fromDate(new Date($sprintActions.startDate.seconds * 1000), timeZone);
		}
	});
</script>

<div>
	<form method="POST" use:enhance class="w-full space-y-3">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Sprint Name</Form.Label>
					<Input {...props} bind:value={$formData.name} placeholder="Sprint Name" />
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
				<Label>End Date</Label>
				<Popover.Root>
					<Popover.Trigger class={cn(buttonVariants({ variant: 'outline', class: 'h-[30px] justify-start text-left font-normal' }), !endDate && 'text-muted-foreground')}>
						<IconCalendar class="size-4" />
						{endDate ? df.format(endDate.toDate(getLocalTimeZone())) : 'End date'}
					</Popover.Trigger>
					<Popover.Content bind:ref={contentRef2} class="w-auto p-0" trapFocus={false}>
						<Calendar type="single" bind:value={endDate} minValue={minEndDate} />
					</Popover.Content>
				</Popover.Root>
			</div>
		</section>

		<div class="flex items-center justify-end">
			<Form.Button class="mt-2 ml-auto block px-5" variant="default">Save</Form.Button>
		</div>
	</form>
</div>
