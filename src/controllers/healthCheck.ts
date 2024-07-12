import ServerHealth from '@src/models/healthCheck';
import { formatDuration } from 'date-fns';
import { Response, Request } from 'express';

const healthCheck = async (req: Request, res: Response) => {
    const serverUptime = formatDuration(
        { seconds: process.uptime() },
        { format: ['days', 'hours', 'minutes', 'seconds'] }
    );
    const health: ServerHealth = {
        uptime: serverUptime,
        message: 'OK',
        timestamp: new Date(),
    };

    try {
        res.send(health);
    } catch (error) {
        console.error(error);
        health.message = 'ERROR';
        res.status(503).send();
    }
};

export default healthCheck;
