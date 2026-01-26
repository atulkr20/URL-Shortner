import 'dotenv/config.js';
import express from 'express'
import { authenticationMiddleware } from './middlewares/auth.middleware.js';
import userRouter from './routes/user.routes.js'
import urlRouter from './routes/url.routes.js'

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(express.json());
app.use(authenticationMiddleware);


app.get('/', (req, res) => {
    res.status(200).json({ message: `Server is up and running`})
});

app.use('/user', userRouter);
app.use(urlRouter);


app.listen(PORT, () => {
    console.log(`Server is up and running on PORT ${PORT}`)
});