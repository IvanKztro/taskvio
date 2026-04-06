import type { FavItem, FavListItem, FavType } from '$lib/modules/hyvflow/types/favorite';
import { arrayRemove, arrayUnion } from 'firebase/firestore';
import { firekitDoc, firekitDocMutations, firekitUser } from 'svelte-firekit';

class FavoriteManager {
	private static instance: FavoriteManager;
	private _uid = $derived(firekitUser.user?.uid);

	private _favoritesDoc = $derived.by(() => {
		const uid = this._uid;
		if (uid == null) return null;
		return firekitDoc(`favorites/${uid}`);
	});

	private _favorites = $derived.by(() => this._favoritesDoc?.data);
	private _loading: boolean = $derived(this._favoritesDoc?.loading ?? false);

	static getInstance(): FavoriteManager {
		if (!FavoriteManager.instance) {
			FavoriteManager.instance = new FavoriteManager();
		}
		return FavoriteManager.instance;
	}

	get favorites() { return this._favorites; }
	get loading(): boolean { return this._loading; }

	isFavorite(favtype: FavType, id: string): FavListItem | undefined {
		if (!this._favorites) return undefined;
		const favorite = this._favorites[favtype]?.find((fv: FavListItem) => fv.value === id);
		return favorite ? (favorite as FavListItem) : undefined;
	}

	async updateFavoriteItem(type: FavType, value: FavItem, projectId?: string) {
		firekitDocMutations.set(
			`favorites/${firekitUser.uid}`,
			{ [type]: arrayUnion({ value, ...(projectId ? { projectId } : {}) }) },
			{ merge: true, timestamps: true }
		);
	}

	removeFavFromUser(type: FavType, value: FavItem, projectId?: string) {
		firekitDocMutations.update(`favorites/${firekitUser.uid}`, {
			[type]: arrayRemove({ value, ...(projectId ? { projectId } : {}) })
		});
	}
}

export const favoriteManager = FavoriteManager.getInstance();
