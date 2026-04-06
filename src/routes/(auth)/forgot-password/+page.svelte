<script lang="ts">
	import ResetPasswordForm from '$lib/modules/auth/components/reset-password-form.svelte';
</script>

<svelte:head>
	<title>Reset password · TaskIO</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Forgot your password?</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Enter your email and we'll send you a reset link.
		</p>
	</div>

	<ResetPasswordForm />

	<p class="text-center text-sm text-muted-foreground">
		Remember it?
		<a href="/sign-in" class="font-medium text-foreground underline-offset-4 hover:underline">Back to sign in</a>
	</p>
</div>
