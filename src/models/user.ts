import { z } from 'zod';

type User = {
    _id: string;
    name: string;
};

const userInputSchema = z.object({
    _id: z.string(),
    name: z.string(),
});

type UserInput = z.infer<typeof userInputSchema>;

export { User, UserInput, userInputSchema };
