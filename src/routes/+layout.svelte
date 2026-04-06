<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher } from 'mode-watcher';
	import { FirebaseApp } from 'svelte-firekit';

	let { children } = $props();
</script>

<ModeWatcher />
<Toaster richColors position="top-right" />

<FirebaseApp>
	{@render children()}
</FirebaseApp>
