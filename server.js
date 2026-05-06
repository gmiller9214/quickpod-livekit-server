import "dotenv/config";
import express from "express";
import cors from "cors";
import { AccessToken } from "livekit-server-sdk";

const app = express();

app.use(cors());
app.use(express.json());

const {
  PORT = 3000,
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
} = process.env;

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  throw new Error("Missing LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET");
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/livekit-token", async (req, res) => {
  try {
    const { roomName, identity, displayName } = req.body;

    if (!roomName || !identity) {
      return res.status(400).json({ error: "roomName and identity are required" });
    }

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: displayName || identity,
      ttl: "6h",
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    res.json({
      livekitURL: LIVEKIT_URL,
      token: await token.toJwt(),
    });
  } catch (error) {
    console.error("Token error:", error);
    res.status(500).json({
      error: "Could not create token",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`QuickPod LiveKit server running on port ${PORT}`);
});
