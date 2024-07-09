import { z } from 'zod';

type User = {
    _id: string;
    name: string;
};

const userInputSchema = z.object({
    _id: z.coerce.string(),
    name: z.coerce.string(),
});

type UserInput = z.infer<typeof userInputSchema>;

export { User, UserInput, userInputSchema };
