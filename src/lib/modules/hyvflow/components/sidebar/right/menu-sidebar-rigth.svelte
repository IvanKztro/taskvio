<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import {
		taskcurrentrelationships,
		taskrelationships,
		sideleft
	} from '$lib/modules/hyvflow/stores/actions/tasks-action';
	import { fade } from 'svelte/transition';
	import {
		IconMessageCircle,
		IconClock,
		IconCircleMinus,
		IconSquareCheck,
		IconX,
		IconPlus
	} from '@tabler/icons-svelte';
	import TaskActivity from '../activity/task-activity.svelte';

	let {
		taskValue,
		membersByProject
	}: {
		taskValue: any;
		membersByProject: any[];
	} = $props();

	function setSideBar(typesidebar: string, tr?: any) {
		if (tr?.type) taskcurrentrelationships.set(tr);
		sideleft.set(typesidebar);
	}
</script>

<article
	class={$sideleft === ''
		? 'w-0'
		: $sideleft === 'chat'
			? 'relative border-l border-l-border bg-background/70 pr-[70px] sm:w-full lg:w-[70%]'
			: 'relative border-l border-l-border bg-background/70 pr-[75px] sm:w-full lg:w-[650px]'}
	transition:fade={{ delay: 500 }}
>
	{#if $sideleft && $sideleft !== ''}
		<Button
			variant="destructive"
			size="icon"
			class="absolute right-20 top-1 z-10 size-5 cursor-pointer rounded-full p-1 opacity-70 hover:opacity-100"
			onclick={() => setSideBar('')}
			aria-label="Close panel"
		>
			<IconX class="size-4" />
		</Button>
	{/if}
	{#if $sideleft === 'chat'}
		<TaskActivity {taskValue} {membersByProject} />
	{:else if $sideleft === 'relationship'}
		<div class="p-4">
			<h3 class="mb-3 text-sm font-semibold">Relationships</h3>
			{#if $taskrelationships && $taskrelationships.length > 0}
				{#each $taskrelationships as group}
					<div class="mb-3">
						<p class="mb-1 text-xs font-medium capitalize text-muted-foreground">{group.type}</p>
						{#each group.items as item}
							<div class="rounded-md border px-3 py-2 text-sm">
								{item.taskDetails?.name || item.taskuid}
							</div>
						{/each}
					</div>
				{/each}
			{:else}
				<p class="text-sm text-muted-foreground">No relationships</p>
			{/if}
		</div>
	{:else if $sideleft === 'items'}
		<div class="p-4">
			<h3 class="mb-3 text-sm font-semibold capitalize">
				{$taskcurrentrelationships?.type || 'Dependencies'}
			</h3>
			{#if $taskcurrentrelationships?.items?.length > 0}
				{#each $taskcurrentrelationships.items as item}
					<div class="mb-2 rounded-md border px-3 py-2">
						<p class="text-sm font-medium">{item.taskDetails?.name || item.taskuid}</p>
						<p class="text-xs text-muted-foreground">
							Status: {item.taskDetails?.status || 'Unknown'}
						</p>
					</div>
				{/each}
			{:else}
				<p class="text-sm text-muted-foreground">No items</p>
			{/if}
		</div>
	{/if}
</article>

<article
	class="fixed right-3 flex h-full w-[65px] flex-col gap-2 border-l border-l-border px-0.5"
	style="height: calc(100dvh - 120px);"
>
	<Button
		variant="secondary"
		size="lg"
		onclick={() => setSideBar($sideleft === 'chat' ? '' : 'chat')}
		class="mt-2 flex w-auto cursor-pointer flex-col items-center  px-2 py-3 {$sideleft === 'chat'
			? 'bg-secondary text-blue-500'
			: ''}"
	>
		<div class="flex flex-col items-center">
			<IconMessageCircle class="size-5" />
			<small class="text-[9px]">Updates</small>
		</div>
	</Button>

	{#each $taskrelationships as tr}
		<Button
			variant="secondary"
			size="lg"
			onclick={() => setSideBar('items', tr)}
			class="mt-2 flex w-auto cursor-pointer flex-col items-center rounded-md py-3 {$sideleft ===
				'items' && tr.type === taskValue?.type
				? 'bg-secondary text-blue-500'
				: ''}"
		>
			<div class="icon-wrapper">
				{#if tr.type === 'waiting'}
					<span class="badge bg-yellow-500 text-[10px] text-white">{tr.items.length}</span>
					<IconClock class="size-5" />
				{:else if tr.type === 'blocking'}
					<span class="badge bg-red-500 text-[10px] text-white">{tr.items.length}</span>
					<IconCircleMinus class="size-5" />
				{:else if tr.type === 'link'}
					<span class="badge bg-muted text-[10px]">{tr.items.length}</span>
					<IconSquareCheck class="size-5" />
				{/if}
			</div>
			<small class="text-[9px] capitalize">{tr.type === 'link' ? 'Dependency' : tr.type}</small>
		</Button>
	{/each}

	<Separator />

	<Button
		variant="secondary"
		size="lg"
		onclick={() => setSideBar($sideleft === 'relationship' ? '' : 'relationship')}
		class="mt-2 flex w-auto cursor-pointer flex-col items-center justify-center rounded-md py-3 {$sideleft ===
		'relationship'
			? 'bg-secondary text-blue-500'
			: ''}"
	>
		<div class="flex flex-col items-center">
			<IconPlus class="size-5" />
			<small class="text-[9px]">More</small>
		</div>
	</Button>
</article>

<style>
	.icon-wrapper {
		position: relative;
		display: inline-block;
	}

	.icon-wrapper .badge {
		position: absolute;
		top: -10px;
		right: -10px;
		border-radius: 50%;
		padding: 0px 6px;
		height: auto;
		width: auto;
		font-size: 10px;
		text-align: center;
	}
</style>
