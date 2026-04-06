<script lang="ts">
	import GoogleSignIn from '$lib/modules/auth/components/google-sign-in.svelte';
	import SignUpForm from '$lib/modules/auth/components/sign-up-form.svelte';
</script>

<svelte:head>
	<title>Sign up · TaskIO</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Create your account</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Already have an account?
			<a href="/sign-in" class="font-medium text-foreground underline-offset-4 hover:underline">Sign in</a>
		</p>
	</div>

	<GoogleSignIn label="Sign up" />

	<div class="relative">
		<div class="absolute inset-0 flex items-center">
			<span class="w-full border-t border-border"></span>
		</div>
		<div class="relative flex justify-center text-xs uppercase">
			<span class="bg-background px-2 text-muted-foreground">or continue with email</span>
		</div>
	</div>

	<SignUpForm />
</div>
