type ServerHealth = {
    uptime: string;
    message: 'OK' | 'ERROR';
    timestamp: Date;
};

export default ServerHealth;
