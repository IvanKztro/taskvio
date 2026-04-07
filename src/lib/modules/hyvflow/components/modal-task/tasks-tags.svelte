<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import type { ActivityTask } from '$lib/modules/hyvflow/types/task';
	import { Timestamp } from 'firebase/firestore';
	import { firekitUser } from 'svelte-firekit';
	import { tick } from 'svelte';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { IconTag, IconCircleX } from '@tabler/icons-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let {
		tags = $bindable([]),
		typefield,
		taskValue
	}: {
		tags: any[];
		typefield: string;
		taskValue: any;
	} = $props();

	let openpopovertags = $state<boolean>(false);
	let popoverRef: HTMLElement | null = $state(null);
	let valuesearch: string = $state('');

	async function handleClickOutside(event: MouseEvent) {
		await tick();
		if (popoverRef && !popoverRef.contains(event.target as Node)) {
			closePopover();
		}
	}

	function togglePopover() {
		if (!openpopovertags) {
			openpopovertags = true;
			setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
		} else {
			closePopover();
		}
	}

	function closePopover() {
		openpopovertags = false;
		document.removeEventListener('click', handleClickOutside);
	}

	async function addNewTag(isnewtag: boolean) {
		if (!valuesearch || valuesearch.trim() === '') return;
		tags = [
			...(tags || []),
			{
				title: valuesearch,
				color: 'primary'
			}
		];
		if (typefield === 'input') {
			const newactivity: ActivityTask = {
				createdBy: firekitUser?.uid as string,
				createdAt: Timestamp.now(),
				typeAct: 'act',
				description: `Added new Tag: ${valuesearch}`
			};
			taskManager.addNewActivity(newactivity, taskValue, { updated: { tags } });
		}
		valuesearch = '';
	}

	async function deleteTag(i: number, array: any[]) {
		const tagdelete = array[i];
		array.splice(i, 1);
		tags = [...array];
		if (typefield === 'input') {
			const newactivity: ActivityTask = {
				createdBy: firekitUser?.uid as string,
				createdAt: Timestamp.now(),
				typeAct: 'act',
				description: `Delete Tag: ${tagdelete.title}`
			};
			taskManager.addNewActivity(newactivity, taskValue, { updated: { tags } });
		}
	}
</script>

<div class="relative">
	<Tooltip.Root>
		<Tooltip.Trigger class="w-full cursor-pointer">
			{#if typefield === 'icon'}
				<Button
					variant="outline"
					size="icon"
					onclick={togglePopover}
					class="flex h-6 w-auto cursor-pointer gap-2 px-1 {tags && tags.length > 0
						? 'px-2'
						: ''}"
				>
					<IconTag class="size-3.5" />
					{#if tags && tags.length > 0}
						<small>{tags?.length} tag{tags.length > 1 ? 's' : ''}</small>
					{/if}
				</Button>
			{:else}
				<Button
					variant="outline"
					size="icon"
					onclick={togglePopover}
					class="group flex h-9 w-full items-center justify-start gap-2 pl-3 text-start"
				>
					<IconTag class="size-3.5 shrink-0" />
					{#if tags && tags.length > 0}
						<div class="hide-scrollbar flex gap-1 overflow-x-auto pr-2">
							{#each tags.slice(0, 3) as tag}
								<Badge variant="outline" class="shrink-0">
									<small>{tag.title}</small>
								</Badge>
							{/each}
							{#if tags.length > 3}
								<Badge variant="outline" class="shrink-0 bg-muted/50">
									<small>+{tags.length - 3}</small>
								</Badge>
							{/if}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">Add tags</p>
					{/if}
				</Button>
			{/if}
		</Tooltip.Trigger>
		<Tooltip.Content class="w-auto p-2">
			{#if tags && tags.length > 0}
				<div class="text-xs">
					{#each tags as tag, index}
						<div class="mb-0.5 last:mb-0">
							{index + 1}. {tag.title}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-xs">No tags added yet</p>
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>

	{#if openpopovertags}
		<section
			bind:this={popoverRef}
			class="absolute left-0 z-50 mt-2 w-64 rounded-lg border border-primary/70 bg-background p-3 shadow-lg"
		>
			{#if tags?.length > 0}
				<article class="flex flex-wrap gap-1">
					{#each tags as tag, i}
						<Badge variant="outline" class="flex gap-1">
							<small>{tag.title}</small>
							<button type="button" onclick={() => deleteTag(i, tags)}>
								<IconCircleX class="size-3" />
							</button>
						</Badge>
					{/each}
				</article>
				<Separator class="my-3" />
			{/if}
			<Input
				class="w-full rounded-lg border px-2 py-1"
				bind:value={valuesearch}
				placeholder="Search or Create tag"
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						addNewTag(true);
					}
				}}
			/>
			<p class="mt-2 text-left text-xs text-primary">
				Press Enter to create a new tag
			</p>
		</section>
	{/if}
</div>

<style>
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
