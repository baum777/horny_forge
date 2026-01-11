import express from "express";
import cors from "cors";
import { gamificationRouter } from "./routes/gamification";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/gamification", gamificationRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

