<script lang="ts">
	import { AuthGuard } from 'svelte-firekit';
	import { IconLayoutKanban, IconChecklist, IconUsers, IconBolt } from '@tabler/icons-svelte';

	let { children } = $props();

	const features = [
		{ icon: IconChecklist, text: 'Organize tasks in visual kanban boards' },
		{ icon: IconUsers, text: 'Collaborate with your team in real time' },
		{ icon: IconBolt, text: 'Track sprints, milestones and progress' }
	];
</script>

<AuthGuard redirectTo="/" requireAuth={false}>
	<div class="flex h-[100dvh] w-full overflow-hidden">
		<!-- Left panel (hidden on mobile) -->
		<aside class="hidden w-[420px] shrink-0 flex-col justify-between bg-zinc-950 p-10 lg:flex">
			<!-- Logo -->
			<div class="flex items-center gap-2.5">
				<div class="flex size-8 items-center justify-center rounded-lg bg-primary">
					<IconLayoutKanban class="size-4 text-primary-foreground" />
				</div>
				<span class="text-lg font-bold text-white">TaskIO</span>
			</div>

			<!-- Center content -->
			<div class="space-y-8">
				<div>
					<h1 class="text-3xl font-bold leading-tight text-white">
						Ship faster.<br />Stay organized.
					</h1>
					<p class="mt-3 text-sm leading-relaxed text-zinc-400">
						A minimal project management tool built for teams who move fast and think clearly.
					</p>
				</div>

				<ul class="space-y-4">
					{#each features as { icon: Icon, text }}
						<li class="flex items-start gap-3">
							<div class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-800">
								<Icon class="size-3.5 text-zinc-300" />
							</div>
							<span class="text-sm text-zinc-400">{text}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Footer -->
			<p class="text-xs text-zinc-600">© {new Date().getFullYear()} TaskIO. All rights reserved.</p>
		</aside>

		<!-- Right panel -->
		<main class="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-background p-6">
			<!-- Mobile logo -->
			<div class="mb-8 flex items-center gap-2 lg:hidden">
				<div class="flex size-8 items-center justify-center rounded-lg bg-primary">
					<IconLayoutKanban class="size-4 text-primary-foreground" />
				</div>
				<span class="text-lg font-bold">TaskIO</span>
			</div>

			<div class="w-full max-w-sm">
				{@render children()}
			</div>
		</main>
	</div>
</AuthGuard>
