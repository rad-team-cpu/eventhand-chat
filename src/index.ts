import 'dotenv/config'
import app from "@src/app"

const PORT = process.env.PORT || 3000;

const onStart = () => console.log(`SERVER START: eventhand-chat listening at ${PORT}`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onError = (error: any) => {
    if (error.syscall !== 'listen') {
    console.log(error)
      throw error;
    }
  
    switch (error.code) {
      case 'EACCESS':
        console.error('Insufficient permissions to start server:', error);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
        break;
      default:
        console.log("An Error has occured:", error)
        throw error;
    }
  };


const httpServer = app.listen(PORT, onStart)

const onListening = () => {
    const addr = httpServer.address();
    const bind =
      typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
    console.log(`Listening on ${bind}`);
  };

httpServer.on('listening', onListening).on('error', onError)





