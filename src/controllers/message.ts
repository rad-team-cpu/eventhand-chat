import { messageInputSchema } from '@src/models/message';
import { createMessage } from '@src/services/message';
import { Response, Request } from 'express';

const messageRouter = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const validation = messageInputSchema.safeParse(data);

        if (!validation.success) {
            const validationError = validation.error.issues;
            res.status(400).json(validationError);
        }

        await createMessage(data);
    } catch (error) {
        console.error(error);
    }
};

export default messageRouter;
