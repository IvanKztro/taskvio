<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import { firekitDocMutations } from 'svelte-firekit';
	import { toast } from 'svelte-sonner';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibot } from 'sveltekit-superforms/adapters';
	import { statusSchema } from '$lib/modules/hyvflow/schemas/status';
	import { isopenstatus, statusActions } from '$lib/modules/hyvflow/stores/actions/status-action';
	import { milestoneActions } from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { get } from 'svelte/store';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';

	let { statusData = undefined } = $props();

	const defaultcolors = $state([
		'#E2E8F0', '#A0A7B2', '#868D98', '#BCA59B', '#C582E6',
		'#F180AE', '#DC666C', '#F9BF36', '#36A16C', '#4ADE80',
		'#42B2B3', '#60A5FA', '#6C86FF', '#8179F1', '#EEAB7B'
	]);

	const data = defaults(valibot(statusSchema));

	const form = superForm(statusData || data, {
		validators: valibot(statusSchema),
		dataType: 'json',
		SPA: true,
		resetForm: false,
		clearOnSubmit: 'errors-and-message',
		async onUpdate({ form }) {
			if (!form.valid) return;
			const { data } = form;
			let updatedStatus = [...(get(milestoneActions)?.arrayStatus || [])];

			if ($statusActions) {
				const currentIndex = updatedStatus.findIndex(
					(p) => p.position === $statusActions!.position && p.status === $statusActions!.status
				);
				if (currentIndex !== -1) {
					const [movedStatus] = updatedStatus.splice(currentIndex, 1);
					const newStatus = { ...movedStatus, ...data };
					updatedStatus.splice(data.position - 1, 0, newStatus);
				}
			} else {
				const formattedName = formatName(data.name);
				const statusFind = updatedStatus.find((s) => formatName(s.status) === formattedName);
				const newStatus = { ...data, status: statusFind ? `${formattedName}-1` : formattedName };
				updatedStatus.splice(data.position - 1, 0, newStatus);
			}

			updatedStatus = updatedStatus.map((s, i) => ({ ...s, position: i + 1 }));

			const response = await firekitDocMutations.update(
				`projects/${$milestoneActions!.projectId}/milestones/${$milestoneActions!.id}`,
				{ arrayStatus: updatedStatus }
			);

			if (response.success) {
				isopenstatus.set(false);
				toast.success('Status updated successfully');
			} else {
				toast.error('Error updating Status');
			}
			milestoneActions.set(undefined);
			statusActions.set(undefined);
		}
	});

	const { form: formData, enhance } = form;

	function updateColor(color: string) { $formData.color = color; }

	function formatName(name: string) {
		return name.trim().split(/\s+/).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
	}
</script>

<div>
	<form method="POST" use:enhance class="w-full space-y-3">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Status Name</Form.Label>
					<Input {...props} bind:value={$formData.name} placeholder="Status Name" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="description">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Description</Form.Label>
					<Textarea {...props} bind:value={$formData.description} placeholder="Description..." class="h-[80px]" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="Color">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Color</Form.Label>
					<RadioGroup.Root bind:value={$formData.color}>
						<section class="mt-1 grid grid-cols-8 gap-1">
							{#each defaultcolors as color}
								<button type="button" class="col-span-1 flex flex-col items-center pb-1" onclick={(e) => { e.stopPropagation(); updateColor(color); }}>
									<RadioGroup.Item value={color} id={color} class="size-[22px] text-white" style="background-color: {color};" />
								</button>
							{/each}
						</section>
					</RadioGroup.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="position">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Position</Form.Label>
					<Select.Root
						type="single"
						name="position"
						value={String($formData.position)}
						onValueChange={(v) => ($formData.position = Number(v))}
					>
						<Select.Trigger>{$formData?.position}</Select.Trigger>
						<Select.Content class="max-h-[250px] overflow-y-auto">
							<Select.Group>
								{#if $milestoneActions?.arrayStatus}
									{#each $milestoneActions.arrayStatus as status}
										<Select.Item value={String(status.position)} label={String(status.position)}>{status.position}</Select.Item>
									{/each}
								{/if}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex items-center justify-end gap-2">
			<Form.Button class="mt-2 ml-auto block px-5" variant="default">Save</Form.Button>
		</div>
	</form>
</div>
