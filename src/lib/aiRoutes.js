import express from "express";
import aiRoutes from "./aiRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/ai", aiRoutes);

app.listen(process.env.PORT || 3001);
