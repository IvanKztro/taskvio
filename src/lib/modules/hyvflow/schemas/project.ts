import * as v from 'valibot';

export const projectSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty('Please enter Project name.')),
	description: v.pipe(v.string(), v.nonEmpty('Please enter Description.')),
	objectives: v.pipe(v.string()),
	risks: v.pipe(v.string()),
	scope: v.pipe(v.string()),
	requirements: v.pipe(v.string()),
	vision: v.pipe(v.string()),
	resources: v.pipe(
		v.number('Please enter Resources.'),
		v.minValue(0, 'Resources must be at least 0')
	),
	members: v.pipe(v.array(v.any()), v.minLength(0))
});
