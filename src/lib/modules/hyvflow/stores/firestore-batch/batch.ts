import { firekitDocMutations, type MutationOperationType } from 'svelte-firekit';
import { writable } from 'svelte/store';

export let openmodaltask = writable<boolean>(false);
export let currentTaskID = writable<string | undefined>();

export interface BatchOperation<T = any> {
	type: MutationOperationType;
	path: string;
	data?: T;
}

export const firestoreBatchManager = {
	async executeBatch(operations: BatchOperation[]): Promise<any> {
		if (!operations?.length) throw new Error('No operations provided');

		const result = await firekitDocMutations.batch(operations);

		if (!result.success) {
			console.error('Batch operation failed:', result);
			throw new Error('Batch operation failed');
		}

		return result;
	}
};
