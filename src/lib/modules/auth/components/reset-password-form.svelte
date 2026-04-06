<script lang="ts">
	import { firekitAuth } from 'svelte-firekit';
	import { resetPasswordSchema } from '$lib/modules/auth/schemas/reset-password';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibot } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	const form = superForm(defaults(valibot(resetPasswordSchema)), {
		validators: valibot(resetPasswordSchema),
		dataType: 'json',
		SPA: true,
		resetForm: false,
		clearOnSubmit: 'errors-and-message',
		async onUpdate({ form }) {
			if (!form.valid) return;
			try {
				await firekitAuth.sendPasswordReset(form.data.email);
				toast.success('Check your inbox — reset link sent.');
				goto('/sign-in');
			} catch (error) {
				toast.error(error instanceof Error ? error.message : 'Something went wrong.');
			}
		}
	});

	const { form: formData, enhance, submitting } = form;
</script>

<form method="POST" use:enhance class="space-y-4">
	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email address</Form.Label>
				<Input {...props} bind:value={$formData.email} placeholder="you@example.com" type="email" autocomplete="email" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button class="w-full" disabled={$submitting}>
		{$submitting ? 'Sending...' : 'Send reset link'}
	</Form.Button>
</form>
