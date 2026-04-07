<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { ActivityTask } from '$lib/modules/hyvflow/types/task';
	import { Timestamp } from 'firebase/firestore';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { firekitUser } from 'svelte-firekit';
	import { IconPlayerPause, IconPlayerPlay } from '@tabler/icons-svelte';

	let {
		trackTime = $bindable(),
		taskValue
	}: {
		trackTime: any;
		taskValue: any;
	} = $props();

	let displayTime: string = $state('');
	let running: boolean = $state(false);
	let startTime: number = $state(0);
	let interval: any = $state();

	function startStopwatch() {
		if (!running) {
			running = true;
			startTime = Date.now() - (trackTime || 0) * 1000;
			interval = setInterval(() => {
				const elapsedTime = Date.now() - startTime;
				updateDisplayTime(elapsedTime);
			}, 1000);
		} else {
			running = false;
			clearInterval(interval);
			changeTrackTime();
		}
	}

	function updateDisplayTime(elapsedTime: number) {
		trackTime = Math.floor(elapsedTime / 1000);
		const minutes = Math.floor(trackTime / 60);
		const seconds = trackTime % 60;
		displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}

	async function changeTrackTime() {
		const newactivity: ActivityTask = {
			createdBy: firekitUser.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Updated Track Time: ${displayTime}`
		};
		taskManager.addNewActivity(newactivity, taskValue, { updated: { trackTime: trackTime } });
	}

	const trackt: number = trackTime ? trackTime : 0;
	updateDisplayTime(trackt * 1000);

	$effect(() => {
		if (taskValue) {
			const trackt: number = trackTime ? trackTime : 0;
			updateDisplayTime(trackt * 1000);
		}
	});
</script>

<div class="flex items-center gap-2">
	<Button variant="outline" class="flex w-full items-center justify-start">
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				class="{!running
					? 'bg-blue-400'
					: 'bg-red-400'} flex size-6 items-center justify-center rounded-full p-1 text-white"
				onclick={() => startStopwatch()}
			>
				{#if !running}
					<IconPlayerPlay class="size-3.5" />
				{:else}
					<IconPlayerPause class="size-3.5" />
				{/if}
			</Button>
			<span class="cursor-pointer select-none text-sm">
				{displayTime || 'Add time'}
			</span>
		</div>
	</Button>
</div>
