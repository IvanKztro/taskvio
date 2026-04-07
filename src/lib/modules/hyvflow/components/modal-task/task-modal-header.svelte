<script lang="ts">
	import { DateFormatter } from '@internationalized/date';
	import TaskOptions from '../tasks/board/task-options.svelte';
	import BreadcrumbTask from './breadcrumb-task.svelte';
	import type { Task } from '$lib/modules/hyvflow/types/task';

	let { taskValue }: { taskValue: Task } = $props();

	let headerData = $derived({
		displayName: taskValue?.creator?.displayName || null,
		createdAt: taskValue?.createdAt?.seconds || null
	});

	const df = new DateFormatter('en-US', { dateStyle: 'long' });
</script>

<section class="flex h-full items-center justify-between px-2 md:px-4">
	<article class="flex items-center gap-3">
		<BreadcrumbTask />
	</article>
	<article class="flex items-center gap-3 pr-7">
		<small class="text-[9px] md:text-xs">
			Created {headerData?.createdAt
				? df.format(new Date(headerData.createdAt * 1000))
				: 'N/A'} by {headerData?.displayName || 'Unknown'}
		</small>
		<div class="flex h-6 items-center gap-1">
			<TaskOptions task={taskValue} isdialog={true} />
		</div>
	</article>
</section>
