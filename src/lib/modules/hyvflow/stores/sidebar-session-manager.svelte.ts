const SESSION_KEY = 'taskio-sidebar-state';

interface SidebarState {
	openProjects: string[];
	currentPath?: string;
}

function createSidebarSessionManager() {
	let state = $state<SidebarState>({ openProjects: [] });

	function loadState() {
		if (typeof window === 'undefined') return;
		const stored = sessionStorage.getItem(SESSION_KEY);
		if (stored) {
			try {
				state = JSON.parse(stored);
			} catch (e) {
				console.error('Failed to parse sidebar state:', e);
			}
		}
	}

	function saveState() {
		if (typeof window === 'undefined') return;
		try {
			sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
		} catch (e) {
			console.error('Failed to save sidebar state:', e);
		}
	}

	return {
		get openProjects() { return state.openProjects; },
		get currentPath() { return state.currentPath; },

		initialize() { loadState(); },

		isProjectOpen(projectId: string): boolean {
			return state.openProjects.includes(projectId);
		},

		toggleProject(projectId: string, isOpen: boolean) {
			if (isOpen) {
				if (!state.openProjects.includes(projectId)) {
					state.openProjects = [...state.openProjects, projectId];
				}
			} else {
				state.openProjects = state.openProjects.filter((id) => id !== projectId);
			}
			saveState();
		},

		// Parse /p/{projectId}/m/{milestoneId}
		syncWithPath(pathname: string) {
			state.currentPath = pathname;
			const segments = pathname.split('/').filter(Boolean);

			// segments: ['p', 'projectId', 'm', 'milestoneId']
			if (segments.length >= 2 && segments[0] === 'p') {
				const projectId = segments[1];
				if (projectId && !state.openProjects.includes(projectId)) {
					state.openProjects = [...state.openProjects, projectId];
				}
			}
			saveState();
		},

		clear() {
			state = { openProjects: [] };
			if (typeof window !== 'undefined') {
				sessionStorage.removeItem(SESSION_KEY);
			}
		}
	};
}

export const sidebarSessionManager = createSidebarSessionManager();
