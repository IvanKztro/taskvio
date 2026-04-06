import type { UserInterface } from '$lib/modules/hyvflow/types/userInterfaces';
import { firekitDoc, firekitDocMutations, firekitUser } from 'svelte-firekit';

class UserInterfacesManager {
	private static instance: UserInterfacesManager;
	private _uid = $derived(firekitUser.user?.uid);

	private _userInterfacesDoc = $derived.by(() => {
		const uid = this._uid;
		if (uid == null) return null;
		return firekitDoc(`userInterfaceState/${uid}`);
	});

	private _userInterfaces: UserInterface | any = $derived.by(() => {
		return this._userInterfacesDoc?.data;
	});

	private _loading: boolean = $derived(this._userInterfacesDoc?.loading ?? false);

	static getInstance(): UserInterfacesManager {
		if (!UserInterfacesManager.instance) {
			UserInterfacesManager.instance = new UserInterfacesManager();
		}
		return UserInterfacesManager.instance;
	}

	get userInterfaces(): UserInterface {
		return this._userInterfaces;
	}

	initialize(_uid: string) {
		// Doc is derived from firekitUser; no-op for compatibility
	}

	get loading(): boolean {
		return this._loading;
	}

	async updateUserInterfaceState(type: string, value: any) {
		firekitDocMutations.set(
			`userInterfaceState/${firekitUser.uid}`,
			{ [type]: value },
			{ merge: true, timestamps: true }
		);
	}
}

export const userInterfacesManager = UserInterfacesManager.getInstance();
