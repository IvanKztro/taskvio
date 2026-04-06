<script lang="ts">
	import { firekitAuth } from 'svelte-firekit';
	import { signUpSchema } from '$lib/modules/auth/schemas/sign-up';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibot } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { IconEye, IconEyeOff } from '@tabler/icons-svelte';

	let showPassword = $state(false);

	const form = superForm(defaults(valibot(signUpSchema)), {
		validators: valibot(signUpSchema),
		dataType: 'json',
		SPA: true,
		resetForm: false,
		clearOnSubmit: 'errors-and-message',
		async onUpdate({ form }) {
			if (!form.valid) return;
			try {
				const { email, password, firstName, lastName } = form.data;
				await firekitAuth.registerWithEmail(email, password, `${firstName} ${lastName}`);
				toast.success('Account created! Welcome to TaskIO.');
				goto('/');
			} catch (error) {
				toast.error(error instanceof Error ? error.message : 'Sign up failed.');
			}
		}
	});

	const { form: formData, enhance, submitting } = form;
</script>

<form method="POST" use:enhance class="space-y-4">
	<div class="grid grid-cols-2 gap-3">
		<Form.Field {form} name="firstName">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>First name</Form.Label>
					<Input {...props} bind:value={$formData.firstName} placeholder="John" autocomplete="given-name" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="lastName">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Last name</Form.Label>
					<Input {...props} bind:value={$formData.lastName} placeholder="Smith" autocomplete="family-name" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} bind:value={$formData.email} placeholder="you@example.com" type="email" autocomplete="email" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Password</Form.Label>
				<div class="relative">
					<Input
						{...props}
						bind:value={$formData.password}
						placeholder="••••••••"
						type={showPassword ? 'text' : 'password'}
						autocomplete="new-password"
						class="pr-10"
					/>
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}
							<IconEyeOff class="size-4" />
						{:else}
							<IconEye class="size-4" />
						{/if}
					</button>
				</div>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button class="w-full" disabled={$submitting}>
		{$submitting ? 'Creating account...' : 'Create account'}
	</Form.Button>
</form>
