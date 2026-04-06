<script lang="ts">
	import { firekitAuth } from 'svelte-firekit';
	import { signInSchema } from '$lib/modules/auth/schemas/sign-in';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibot } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { IconEye, IconEyeOff } from '@tabler/icons-svelte';

	let showPassword = $state(false);

	const form = superForm(defaults(valibot(signInSchema)), {
		validators: valibot(signInSchema),
		dataType: 'json',
		SPA: true,
		resetForm: false,
		clearOnSubmit: 'errors-and-message',
		async onUpdate({ form }) {
			if (!form.valid) return;
			try {
				await firekitAuth.signInWithEmail(form.data.email, form.data.password);
				toast.success('Welcome back!');
				goto('/');
			} catch (error) {
				toast.error(error instanceof Error ? error.message : 'Sign in failed.');
			}
		}
	});

	const { form: formData, enhance, submitting } = form;
</script>

<form method="POST" use:enhance class="space-y-4">
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
				<div class="flex items-center justify-between">
					<Form.Label>Password</Form.Label>
					<a href="/forgot-password" class="text-xs text-muted-foreground hover:text-foreground transition-colors">
						Forgot password?
					</a>
				</div>
				<div class="relative">
					<Input
						{...props}
						bind:value={$formData.password}
						placeholder="••••••••"
						type={showPassword ? 'text' : 'password'}
						autocomplete="current-password"
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
		{$submitting ? 'Signing in...' : 'Sign in'}
	</Form.Button>
</form>
