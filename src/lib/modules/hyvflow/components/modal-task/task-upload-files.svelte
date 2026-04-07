<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Timestamp } from 'firebase/firestore';
	import type { ActivityTask, Task } from '$lib/modules/hyvflow/types/task';
	import { firekitUploadTask, firekitUser } from 'svelte-firekit';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { generateId } from '$lib/utils';
	import { IconFile, IconUpload, IconX } from '@tabler/icons-svelte';

	let {
		taskValue,
		files = $bindable([])
	}: {
		taskValue: Task;
		files: any[];
	} = $props();

	let filesarray: any[] = $derived(taskValue.files || []);
	let file: File | undefined = $state(undefined);
	let fileName: string = $state('');
	let fileType: string = $state('');
	let fileID: string = $state('');
	let loadingimg: boolean = $state(false);
	let inputimg: HTMLInputElement | undefined = $state();
	let isDragging = $state(false);
	let pathfile = $state('');
	let uploadTask: any = $state(null);
	let progress: number = $derived(uploadTask?.progress || 0);

	$effect(() => {
		if (progress === 100 && uploadTask?.downloadURL) {
			uploadSuccessFile();
		}
	});

	function handleFileChange(event: any) {
		file = event.target.files[0];
		fileName = file ? file.name : '';
		fileType = file ? file.type : '';
		uploadFile();
	}

	async function uploadSuccessFile() {
		try {
			const url = uploadTask?.downloadURL;

			const newFile = {
				fileName,
				fileID,
				createdAt: Timestamp.now(),
				createdBy: firekitUser.uid,
				fileType,
				url,
				path: pathfile
			};
			files = [...filesarray, newFile];

			const newactivity: ActivityTask = {
				createdBy: firekitUser.uid as string,
				createdAt: Timestamp.now(),
				typeAct: 'act',
				description: `Upload File: ${fileName}`
			};
			await taskManager.addNewActivity(newactivity, taskValue, { updated: { files } });

			loadingimg = false;
			pathfile = '';
			toast.success('Upload complete');
		} catch (error: any) {
			console.error('Error in uploadSuccessFile:', error);
			toast.error(error.message || 'Failed to complete upload');
			loadingimg = false;
		}
	}

	async function uploadFile() {
		try {
			if (!file) return;

			if (file.size > 30 * 1024 * 1024) {
				toast.error('File size must be less than 30MB');
				return;
			}

			fileID = generateId();
			loadingimg = true;
			pathfile = `tasks/${taskValue?.id}/files/${fileID}`;
			uploadTask = firekitUploadTask(pathfile, file);
		} catch (error: any) {
			console.error('Error uploading file:', error);
			toast.error(error.message || 'Failed to upload file');
			loadingimg = false;
		}
	}

	function getFriendlyFileType(mimeType: string): { name: string; color: string } {
		const mimeTypesMap: Record<string, { name: string; color: string }> = {
			'application/pdf': { name: 'PDF', color: 'text-red-500' },
			'application/msword': { name: 'Word', color: 'text-blue-500' },
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
				name: 'Word',
				color: 'text-blue-500'
			},
			'application/vnd.ms-excel': { name: 'Excel', color: 'text-green-500' },
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
				name: 'Excel',
				color: 'text-green-500'
			},
			'image/jpeg': { name: 'Image', color: 'text-orange-500' },
			'image/png': { name: 'Image', color: 'text-orange-500' },
			'image/gif': { name: 'Image', color: 'text-orange-500' },
			'text/plain': { name: 'Text', color: 'text-gray-500' }
		};
		return mimeTypesMap[mimeType] || { name: 'File', color: 'text-muted-foreground' };
	}
</script>

<section
	class="mt-4 flex w-full cursor-pointer flex-col items-center rounded-md border-2 transition-colors {isDragging
		? 'border-primary bg-primary/5'
		: 'border-dashed border-border'}"
	onclick={() => inputimg?.click()}
	ondragover={(e) => {
		e.preventDefault();
		isDragging = true;
	}}
	ondragleave={() => {
		isDragging = false;
	}}
	ondrop={(e) => {
		e.preventDefault();
		if (e.dataTransfer?.files?.length && inputimg) {
			const fileList = e.dataTransfer.files;
			const dt = new DataTransfer();
			dt.items.add(fileList[0]);
			inputimg.files = dt.files;
			handleFileChange({ target: inputimg });
			isDragging = false;
		}
	}}
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') inputimg?.click();
	}}
>
	<div class="flex items-center gap-2 py-4">
		<input bind:this={inputimg} type="file" hidden onchange={handleFileChange} />
		<IconUpload class="size-4 text-muted-foreground" />
		<p class="text-sm text-muted-foreground">
			Click or drag to <span class="font-medium text-foreground underline">upload</span>
		</p>
	</div>
	{#if loadingimg}
		<div class="w-full px-4 pb-4">
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>{fileName}</span>
				<span>{Math.round(progress)}%</span>
			</div>
			<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full bg-primary transition-all"
					style="width: {progress}%"
				></div>
			</div>
		</div>
	{/if}
</section>

{#if filesarray.length > 0}
	<section class="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
		{#each filesarray as fileItem, i}
			{@const typeInfo = getFriendlyFileType(fileItem?.fileType)}
			<a
				href={fileItem.url}
				target="_blank"
				rel="noopener noreferrer"
				class="group flex items-center gap-2 rounded-md border p-2 transition-colors hover:bg-muted/50"
			>
				<IconFile class="size-5 shrink-0 {typeInfo.color}" />
				<div class="min-w-0 flex-1">
					<p class="truncate text-xs font-medium">{fileItem.fileName}</p>
					<p class="text-[10px] text-muted-foreground">{typeInfo.name}</p>
				</div>
			</a>
		{/each}
	</section>
{/if}
