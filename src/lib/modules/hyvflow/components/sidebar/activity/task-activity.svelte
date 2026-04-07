<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import type { Task, ActivityTask } from '$lib/modules/hyvflow/types/task';
	import { Timestamp } from 'firebase/firestore';
	import { firekitUser } from 'svelte-firekit';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { getInitials, timeAgo } from '$lib/utils';
	import { IconSend } from '@tabler/icons-svelte';
	import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
	import { firebaseService } from 'svelte-firekit';
	import { toast } from 'svelte-sonner';
	import ImagePreviewList from './image-preview-list.svelte';

	let {
		taskValue,
		membersByProject = []
	}: {
		taskValue: Task;
		membersByProject: any[];
	} = $props();

	let commentText = $state('');
	let scrollContainer: HTMLElement | undefined = $state();
	let isDragging = $state(false);
	let isUploading = $state(false);

	type ImageItem = { id: string; url: string; fileName: string };
	let arrayImages = $state<ImageItem[]>([]);

	const activities = $derived<ActivityTask[]>(taskValue?.activities || []);

	function getMemberInfo(uid: string) {
		return membersByProject.find((m: any) => m.uid === uid || m.id === uid);
	}

	async function addComment() {
		if (!commentText.trim() && arrayImages.length === 0) return;
		if (isUploading) return;

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'comment',
			description: commentText.trim(),
			images: arrayImages as any
		};

		taskManager.addNewActivity(newactivity, taskValue, {});
		commentText = '';
		arrayImages = [];

		setTimeout(() => {
			if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}, 100);
	}

	async function uploadImageToFirebase(file: File): Promise<ImageItem | null> {
		const storage = firebaseService.getStorageInstance();
		if (!storage) {
			toast.error('Storage not available');
			return null;
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.error('File size must be less than 10MB');
			return null;
		}

		const fileId = crypto.randomUUID();
		const fileName = `${fileId}-${file.name}`;
		const filePath = `tasks/${taskValue.id}/comments/${fileName}`;
		const storageRef = ref(storage, filePath);
		const uploadTask = uploadBytesResumable(storageRef, file);

		return new Promise((resolve, reject) => {
			uploadTask.on(
				'state_changed',
				null,
				(err) => {
					console.error('Upload error:', err);
					toast.error('Failed to upload image');
					reject(err);
				},
				async () => {
					const url = await getDownloadURL(uploadTask.snapshot.ref);
					resolve({ id: fileId, url, fileName });
				}
			);
		});
	}

	async function handleFiles(files: File[]) {
		isUploading = true;
		try {
			for (const file of files) {
				if (!file.type.startsWith('image/')) {
					toast.error('Only image files are allowed');
					continue;
				}
				const result = await uploadImageToFirebase(file);
				if (result) arrayImages = [...arrayImages, result];
			}
		} catch (err) {
			console.error('handleFiles error:', err);
		} finally {
			isUploading = false;
		}
	}

	async function handlePaste(event: ClipboardEvent) {
		const items = event.clipboardData?.items;
		if (!items) return;
		const imageFiles: File[] = [];
		for (const item of Array.from(items)) {
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (file) imageFiles.push(file);
			}
		}
		if (imageFiles.length) {
			event.preventDefault();
			await handleFiles(imageFiles);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		if (event.dataTransfer?.files.length) {
			await handleFiles(Array.from(event.dataTransfer.files));
		}
	}

	async function deleteImage(index: number) {
		const storage = firebaseService.getStorageInstance();
		const img = arrayImages[index];
		if (!img) return;
		arrayImages = arrayImages.filter((_, i) => i !== index);
		if (storage) {
			try {
				const fileRef = ref(storage, `tasks/${taskValue.id}/comments/${img.fileName}`);
				await deleteObject(fileRef);
			} catch {
				// ignore if already gone
			}
		}
	}

	$effect(() => {
		if (activities.length > 0 && scrollContainer) {
			setTimeout(() => {
				if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}, 200);
		}
	});
</script>

<div class="flex h-full flex-col">
	<h3 class="border-b px-4 py-3 text-sm font-semibold">Activity & Updates</h3>

	<div
		bind:this={scrollContainer}
		class="flex-1 space-y-3 overflow-y-auto px-4 py-3"
		style="max-height: calc(100dvh - 300px);"
	>
		{#if activities.length === 0}
			<p class="py-8 text-center text-sm text-muted-foreground">No activity yet</p>
		{:else}
			{#each activities as activity}
				{@const member = getMemberInfo(activity.createdBy)}
				<div class="flex gap-2">
					<Avatar.Root class="size-7 shrink-0">
						{#if member?.photoURL}
							<Avatar.Image src={member.photoURL} alt={member?.displayName} />
						{/if}
						<Avatar.Fallback class="text-[10px]">
							{getInitials(member?.displayName)}
						</Avatar.Fallback>
					</Avatar.Root>
					<div class="flex-1 rounded-md border bg-muted/30 p-2">
						<div class="flex items-baseline gap-2">
							<span class="text-xs font-medium">{member?.displayName || 'Unknown'}</span>
							<span class="text-[10px] text-muted-foreground">
								{activity.createdAt?.seconds
									? timeAgo(new Date(activity.createdAt.seconds * 1000))
									: ''}
							</span>
						</div>
						<p
							class="mt-0.5 text-xs {activity.typeAct === 'comment'
								? ' p-2'
								: 'text-muted-foreground'}"
						>
							{activity.description}
						</p>
						{#if activity.images?.length}
							<div class="mt-1 flex flex-wrap gap-1">
								{#each activity.images as img}
									<button
										type="button"
										class="size-14 rounded border p-0 overflow-hidden"
										onclick={() => window.open((img as any).url ?? img, '_blank')}
									>
										<img
											src={(img as any).url ?? img}
											alt="attachment"
											class="size-full object-cover"
										/>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<div class="border-t p-3">
		{#if arrayImages.length > 0}
			<ImagePreviewList images={arrayImages} ondelete={deleteImage} />
		{/if}
		<Textarea
			bind:value={commentText}
			placeholder={isDragging
				? 'Drop image here...'
				: 'Write a comment... (paste or drop images)'}
			class="mt-1 h-[72px] resize-none text-sm transition-colors {isDragging
				? 'ring-2 ring-primary bg-primary/5'
				: ''}"
			onpaste={handlePaste}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			onkeydown={(e) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					addComment();
				}
			}}
		/>
		<div class="mt-2 flex items-center justify-between">
			<span class="text-[10px] text-muted-foreground">
				{isUploading ? 'Uploading...' : 'Shift+Enter for new line'}
			</span>
			<Button size="sm" class="h-7 gap-1" onclick={addComment} disabled={isUploading}>
				<IconSend class="size-3.5" />
			</Button>
		</div>
	</div>
</div>
