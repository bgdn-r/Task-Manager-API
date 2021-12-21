const express = require("express");
require("./db/mongoose");
const userRouter = require("../src/routers/user");
const taskRouter = require("../src/routers/task");

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(taskRouter);
app.use(userRouter);

app.listen(port, () => {
	console.log(`Server is up on port http://localhost:${port}`);
});
