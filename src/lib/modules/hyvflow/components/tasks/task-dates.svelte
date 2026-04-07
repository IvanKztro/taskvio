<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import {
		DateFormatter,
		getLocalTimeZone,
		today,
		fromDate,
		type DateValue
	} from '@internationalized/date';
	import type { ActivityTask, Task } from '$lib/modules/hyvflow/types/task';
	import { Timestamp } from 'firebase/firestore';
	import { firekitUser } from 'svelte-firekit';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { IconCalendar } from '@tabler/icons-svelte';

	let {
		taskValue,
		labelValue
	}: {
		taskValue: Task;
		labelValue: 'startDate' | 'dueDate';
	} = $props();

	const df = new DateFormatter('en-US', { dateStyle: 'medium' });

	let value = $state<DateValue | undefined>(undefined);
	let open = $state(false);

	$effect(() => {
		const dateVal = taskValue?.[labelValue];
		if (dateVal?.seconds) {
			value = fromDate(new Date(dateVal.seconds * 1000), getLocalTimeZone());
		} else {
			value = undefined;
		}
	});

	function handleSelect(newValue: DateValue | undefined) {
		if (!newValue) return;
		value = newValue;
		open = false;

		const jsDate = newValue.toDate(getLocalTimeZone());
		const timestamp = Timestamp.fromDate(jsDate);

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Updated ${labelValue === 'startDate' ? 'Start Date' : 'Due Date'}: ${df.format(jsDate)}`
		};

		taskManager.addNewActivity(newactivity, taskValue, {
			updated: { [labelValue]: timestamp }
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger class="w-full">
		<Button variant="outline" class="flex w-full items-center justify-start gap-2 text-left">
			<IconCalendar class="size-4 text-muted-foreground" />
			{#if value}
				<span class="text-xs">{df.format(value.toDate(getLocalTimeZone()))}</span>
			{:else}
				<span class="text-xs text-muted-foreground">Pick a date</span>
			{/if}
		</Button>
	</Popover.Trigger>
	<Popover.Content class="z-[70] w-auto p-0">
		<Calendar
			{value}
			onValueChange={handleSelect}
			initialFocus
		/>
	</Popover.Content>
</Popover.Root>
