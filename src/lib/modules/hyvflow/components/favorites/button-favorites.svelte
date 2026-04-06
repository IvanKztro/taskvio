<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { IconStar, IconStarFilled } from '@tabler/icons-svelte';
	import type { FavType } from '$lib/modules/hyvflow/types/favorite';
	import { favoriteManager } from '$lib/modules/hyvflow/stores/favorites-manager.svelte';
	import { cn } from '$lib/utils';

	let {
		accept,
		itemid,
		showLabel,
		typebtn = 'ghost'
	}: {
		accept: FavType;
		itemid: string;
		showLabel: boolean;
		typebtn?: string;
	} = $props();

	let isFilled = $derived(favoriteManager.isFavorite(accept, itemid));
	let isStarred = $derived(!!isFilled);

	async function toggle() {
		if (isStarred && isFilled) {
			favoriteManager.removeFavFromUser(accept, isFilled.value);
		} else {
			await favoriteManager.updateFavoriteItem(accept, itemid);
		}
	}
</script>

<Button
	variant={typebtn as any}
	size={showLabel ? 'sm' : 'icon'}
	class={cn(
		showLabel ? 'gap-1.5 px-2' : 'size-7',
		isStarred && 'text-yellow-400 hover:text-yellow-500'
	)}
	onclick={toggle}
	title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
>
	{#if isStarred}
		<IconStarFilled class="size-4 text-yellow-400" />
	{:else}
		<IconStar class="size-4" />
	{/if}
	{#if showLabel}
		<span>{isStarred ? 'Unfavorite' : 'Favorite'}</span>
	{/if}
</Button>
