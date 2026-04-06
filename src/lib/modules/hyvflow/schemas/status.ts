import * as v from 'valibot';

export const statusSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty('Please enter Status name.')),
	description: v.pipe(v.string()),
	color: v.pipe(v.string(), v.nonEmpty('Please select Status color.')),
	position: v.pipe(v.number())
});
