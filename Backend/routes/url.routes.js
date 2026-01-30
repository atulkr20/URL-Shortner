import express from "express";
// import { shortenPostRequestBodySchema } from "../validation/request.validation.js"; // <--- COMMENTED OUT
import { db } from "../db/index.js";
import { urlsTable } from "../models/url.model.js";
import { nanoid } from "nanoid";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { and, eq } from "drizzle-orm"; 

const router = express.Router();

// 1. SHORTEN URL (NO VALIDATION TEST)
router.post("/shorten", ensureAuthenticated, async function (req, res) {
  console.log("📥 Received Body:", req.body); // <--- CHECK YOUR TERMINAL FOR THIS

  // --- TEMPORARILY BYPASS ZOD VALIDATION ---
  // const validationResult = await shortenPostRequestBodySchema.safeParseAsync(req.body);
  // if (validationResult.error) {
  //   console.log("❌ Validation Failed:", validationResult.error);
  //   return res.status(400).json({ error: validationResult.error });
  // }
  // const { url, code } = validationResult.data;
  
  // MANUAL EXTRACTION INSTEAD
  const url = req.body.url;
  const code = req.body.code;
  // -----------------------------------------

  if (!url) {
      return res.status(400).json({ error: "URL is required" });
  }

  const shortCode = code ?? nanoid(6);

  try {
    const result = await db
      .insert(urlsTable)
      .values({
        shortCode,
        targetURL: url,
        userId: req.user.id,
      })
      .returning(); 

    if (!result || result.length === 0) {
        console.error("❌ DB Insert returned empty.");
        return res.status(500).json({ error: "Database Insert Failed" });
    }

    const row = result[0];
    console.log("✅ Insert Success:", row);

    return res.status(201).json({
      id: row.id,
      shortCode: row.shortCode,
      targetURL: row.targetURL,
    });

  } catch (error) {
    console.error("🔥 Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. GET HISTORY
router.get("/codes", ensureAuthenticated, async function (req, res) {
  try {
    const codes = await db
      .select() 
      .from(urlsTable)
      .where(eq(urlsTable.userId, req.user.id));
    return res.json({ codes });
  } catch (error) {
    console.error("History Error:", error);
    return res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// 3. DELETE URL
router.delete("/:id", ensureAuthenticated, async function (req, res) {
  const id = req.params.id;
  try {
    await db.delete(urlsTable).where(and(eq(urlsTable.id, id), eq(urlsTable.userId, req.user.id)));
    return res.status(200).json({ deleted: true });
  } catch (error) {
      console.error("Delete Error:", error);
      return res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;