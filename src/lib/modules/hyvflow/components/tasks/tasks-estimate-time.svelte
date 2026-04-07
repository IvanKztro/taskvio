<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import type { ActivityTask, Task } from '$lib/modules/hyvflow/types/task';
	import { Timestamp } from 'firebase/firestore';
	import { firekitUser } from 'svelte-firekit';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { IconHourglass, IconPlus, IconMinus } from '@tabler/icons-svelte';

	let { taskValue }: { taskValue: Task } = $props();

	let open = $state(false);
	let hours = $state(0);
	let minutes = $state(0);

	$effect(() => {
		if (taskValue?.timeEstimate) {
			const parts = taskValue.timeEstimate.match(/(\d+)h\s*(\d+)m/);
			if (parts) {
				hours = parseInt(parts[1]) || 0;
				minutes = parseInt(parts[2]) || 0;
			} else {
				const hMatch = taskValue.timeEstimate.match(/(\d+)h/);
				const mMatch = taskValue.timeEstimate.match(/(\d+)m/);
				hours = hMatch ? parseInt(hMatch[1]) : 0;
				minutes = mMatch ? parseInt(mMatch[1]) : 0;
			}
		}
	});

	function formatEstimate(): string {
		if (hours === 0 && minutes === 0) return '';
		return `${hours}h ${minutes}m`;
	}

	async function saveEstimate() {
		const estimate = formatEstimate();
		open = false;

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Updated Time Estimate: ${estimate || 'None'}`
		};
		taskManager.addNewActivity(newactivity, taskValue, {
			updated: { timeEstimate: estimate }
		});
	}

	function incrementHours() {
		if (hours < 99) hours++;
	}
	function decrementHours() {
		if (hours > 0) hours--;
	}
	function incrementMinutes() {
		minutes = Math.min(minutes + 15, 45);
	}
	function decrementMinutes() {
		if (minutes >= 15) minutes -= 15;
		else minutes = 0;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger class="w-full">
		<Button variant="outline" class="flex w-full items-center justify-start gap-2 text-left">
			<IconHourglass class="size-4 text-muted-foreground" />
			{#if taskValue?.timeEstimate}
				<span class="text-xs">{taskValue.timeEstimate}</span>
			{:else}
				<span class="text-xs text-muted-foreground">Add estimate</span>
			{/if}
		</Button>
	</Popover.Trigger>
	<Popover.Content class="z-[70] w-64 p-4">
		<p class="mb-3 text-sm font-medium">Time Estimate</p>
		<div class="flex items-center gap-4">
			<div class="flex flex-col items-center gap-1">
				<label class="text-xs text-muted-foreground">Hours</label>
				<div class="flex items-center gap-1">
					<Button variant="outline" size="sm" class="size-7 p-0" onclick={decrementHours}>
						<IconMinus class="size-3" />
					</Button>
					<Input
						type="number"
						bind:value={hours}
						class="h-8 w-14 text-center text-sm"
						min="0"
						max="99"
					/>
					<Button variant="outline" size="sm" class="size-7 p-0" onclick={incrementHours}>
						<IconPlus class="size-3" />
					</Button>
				</div>
			</div>
			<div class="flex flex-col items-center gap-1">
				<label class="text-xs text-muted-foreground">Minutes</label>
				<div class="flex items-center gap-1">
					<Button variant="outline" size="sm" class="size-7 p-0" onclick={decrementMinutes}>
						<IconMinus class="size-3" />
					</Button>
					<Input
						type="number"
						bind:value={minutes}
						class="h-8 w-14 text-center text-sm"
						min="0"
						max="59"
					/>
					<Button variant="outline" size="sm" class="size-7 p-0" onclick={incrementMinutes}>
						<IconPlus class="size-3" />
					</Button>
				</div>
			</div>
		</div>
		<Button class="mt-3 w-full" size="sm" onclick={saveEstimate}>Save</Button>
	</Popover.Content>
</Popover.Root>
