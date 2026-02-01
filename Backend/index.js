import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import { db } from './db/index.js'; 
import { urlsTable } from './models/url.model.js'; 
import { eq, sql } from 'drizzle-orm'; 
import { authenticationMiddleware } from './middlewares/auth.middleware.js';
import userRouter from './routes/user.routes.js';
import urlRouter from './routes/url.routes.js';
import trackingRouter from './routes/tracking.routes.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Allow Vercel (Production) AND Localhost (Dev)
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173", 
    credentials: true
}));

app.use(express.json()); 

//  PUBLIC ROUTES
app.get('/', (req, res) => res.json({ message: "Loki Server is up" }));
app.use('/user', userRouter); 

//  TRACKING ROUTES
app.use('/track', trackingRouter);

// REDIRECT ROUTE 
app.get('/:shortCode', async (req, res) => {
    const shortCode = req.params.shortCode;
    console.log(`[SYSTEM]: Redirect attempt for code: ${shortCode}`);
    
    if (shortCode === 'favicon.ico') return res.status(404).end();

    try {
        const [result] = await db
            .select({ targetURL: urlsTable.targetURL })
            .from(urlsTable)
            .where(eq(urlsTable.shortCode, shortCode));

        if (!result) return res.status(404).json({ error: "Link not found" });

        await db.update(urlsTable)
            .set({ visits: sql`${urlsTable.visits} + 1` })
            .where(eq(urlsTable.shortCode, shortCode));

        return res.redirect(result.targetURL);
    } catch (error) {
        console.error("Redirect Error:", error);
        return res.status(500).json({ error: "Server Error" });
    }
});

app.use(authenticationMiddleware); 
app.use('/url', urlRouter); 

app.listen(PORT, () => {
    console.log(`[LOKI]: Terminal Backend running on PORT ${PORT}`);
});