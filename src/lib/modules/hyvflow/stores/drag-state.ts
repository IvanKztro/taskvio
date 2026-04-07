/**
 * Module-level drag state shared across all board-tasks instances.
 * Plain JS object (not reactive) — only lives during a single drag gesture.
 */
export const dragState = {
	data: null as any,

	set(data: any) {
		this.data = data;
	},
	get(): any {
		return this.data;
	},
	clear() {
		this.data = null;
	}
};
