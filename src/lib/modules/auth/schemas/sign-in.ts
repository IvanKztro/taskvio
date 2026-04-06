import * as v from 'valibot';

export const signInSchema = v.object({
	email: v.pipe(
		v.string(),
		v.minLength(1, 'Please enter your email.'),
		v.email('Invalid email address.')
	),
	password: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters.'))
});
