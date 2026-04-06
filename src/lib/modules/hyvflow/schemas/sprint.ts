import * as v from 'valibot';

export const sprintSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty('Please enter Sprint name.'))
});
