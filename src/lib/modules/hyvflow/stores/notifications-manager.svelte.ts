import type { AppNotification } from '$lib/modules/hyvflow/types/notifications';
import { arrayRemove, limit, orderBy, Timestamp, where } from 'firebase/firestore';
import { firekitCollection, firekitUser, firekitDocMutations } from 'svelte-firekit';

class NotificationManager {
	private static instance: NotificationManager;

	private _unreadNotificationsCollection = $derived.by(() => {
		const uid = firekitUser.user?.uid;
		if (uid == null) return null;
		return firekitCollection<AppNotification>(
			'notifications',
			[where('unreadBy', 'array-contains', uid), orderBy('createdAt', 'desc')],
			limit(60)
		);
	});

	private _allNotificationsCollection = $derived.by(() => {
		const uid = firekitUser.user?.uid;
		if (uid == null) return null;
		return firekitCollection<AppNotification>('notifications', [
			where('mentions', 'array-contains', uid),
			orderBy('createdAt', 'desc')
		]);
	});

	private _unreadNotifications = $derived.by(() => {
		return this._unreadNotificationsCollection?.data ?? [];
	});

	private _allNotifications = $derived.by(() => {
		return this._allNotificationsCollection?.data ?? [];
	});

	private _loadingUnread: boolean = $derived(this._unreadNotificationsCollection?.loading ?? false);
	private _loadingAll: boolean = $derived(this._allNotificationsCollection?.loading ?? false);

	get unreadNotifications() { return this._unreadNotifications; }
	get allNotifications() { return this._allNotifications; }
	get loadingUnread(): boolean { return this._loadingUnread; }
	get loadingAll(): boolean { return this._loadingAll; }

	static getInstance(): NotificationManager {
		if (!NotificationManager.instance) {
			NotificationManager.instance = new NotificationManager();
		}
		return NotificationManager.instance;
	}

	async createNewNotification(data: Partial<AppNotification>) {
		if (!firekitUser.user?.uid)
			throw new Error('User must be authenticated to create Notification');

		return await firekitDocMutations.add('notifications', {
			...data,
			createdAt: Timestamp.now()
		});
	}

	async readNotification(id: string, userid: string) {
		return await firekitDocMutations.update(`notifications/${id}`, {
			unreadBy: arrayRemove(userid)
		});
	}
}

export const notificationManager = NotificationManager.getInstance();
