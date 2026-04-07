<script lang="ts">
	import { IconX } from '@tabler/icons-svelte';

	type ImageItem = {
		id: string;
		url: string;
		fileName: string;
	};

	let {
		images,
		ondelete
	}: {
		images: ImageItem[];
		ondelete: (index: number) => void;
	} = $props();
</script>

<div class="flex flex-wrap gap-2 px-1 pt-1">
	{#each images as image, i}
		<div class="relative size-12">
			<button
				class="absolute -top-1 -right-1 z-10 flex size-4 items-center justify-center rounded-full bg-destructive text-white"
				onclick={(e) => {
					e.stopPropagation();
					ondelete(i);
				}}
			>
				<IconX class="size-3" />
			</button>
			<img
				src={image.url}
				alt="preview"
				class="size-12 cursor-pointer rounded border object-cover"
				onclick={() => window.open(image.url, '_blank')}
			/>
		</div>
	{/each}
</div>
