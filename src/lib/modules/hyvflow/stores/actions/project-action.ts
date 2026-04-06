import { ProjectStatus, type Project } from '$lib/modules/hyvflow/types/project';
import { firekitDocMutations } from 'svelte-firekit';
import { toast } from 'svelte-sonner';
import { get, writable } from 'svelte/store';

export let isopenproject = writable<boolean>(false);
export let isopendeleteproject = writable<boolean>(false);
export let projectActions = writable<Project | undefined>(undefined);

export async function deleteProject() {
	const projecttemp = get(projectActions);

	const res = await firekitDocMutations.update(`projects/${projecttemp?.id}`, {
		status: ProjectStatus.Canceled
	});

	if (res.success) {
		isopendeleteproject.set(false);
		toast.success('Project was deleted successfully!', {
			action: {
				label: 'Undo',
				onClick: async () => {
					await firekitDocMutations.update(`projects/${projecttemp?.id}`, {
						status: ProjectStatus.Active
					});
				}
			},
			duration: 4000
		});
		projectActions.set(undefined);
	} else {
		isopendeleteproject.set(false);
		toast.error('Error deleting this project!');
		projectActions.set(undefined);
	}
}
