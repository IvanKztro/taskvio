import * as v from 'valibot';

export const milestoneSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty('Please enter Milestone name.')),
	description: v.pipe(v.string(), v.nonEmpty('Please enter Description.'))
});
