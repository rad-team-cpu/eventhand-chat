import express, {Express} from "express";

import mainRouter from "@src/routes"

const app: Express = express();

app.use(express.json());


app.use("/", mainRouter);

export default app;