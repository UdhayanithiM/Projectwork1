// server.ts (FINAL — FIXED FOR CONTINUOUS VOICE WS)
import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server, Socket } from "socket.io";
import { verifyJwt, UserJwtPayload } from "./lib/auth";
import * as cookie from "cookie";
import httpProxy from "http-proxy";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Python AI backend
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

// 100% transparent proxy for WS + HTTP
const proxy = httpProxy.createProxyServer({
  target: AI_SERVICE_URL,
  ws: true,
  changeOrigin: true,
  secure: false,
});

proxy.on("error", (err, req, res) => {
  console.error("❌ Proxy Error:", err?.message || err);
  if (res && typeof (res as any).writeHead === "function") {
    (res as any).writeHead(502, { "Content-Type": "text/plain" });
    (res as any).end("Bad Gateway: AI service unreachable");
  }
});

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// TYPES
interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface InterviewSession {
  history: ChatMessage[];
  candidateId?: string;
}

interface AuthenticatedSocket extends Socket {
  user?: UserJwtPayload;
}

// In-memory store (safe)
const interviewSessions = new Map<string, InterviewSession>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);

    // Proxy Python REST API
    if (req.url && req.url.startsWith("/api/ai/")) {
      proxy.web(req, res, {
        target: AI_SERVICE_URL,
        changeOrigin: true,
        secure: false,
      });
      return;
    }

    // Next.js handles everything else
    handle(req, res, parsedUrl);
  });

  // WebSocket Proxy for Hume
  httpServer.on("upgrade", (req, socket, head) => {
    const pathname = parse(req.url || "").pathname || "";

    if (pathname.startsWith("/ws/hume")) {
      console.log("🔀 WS → AI Engine:", pathname);

      proxy.ws(req, socket as any, head, {
        target: AI_SERVICE_URL,
        changeOrigin: true,
        secure: false,
      });

      return;
    }

    // ❌ NEVER destroy sockets — breaks other WS
    // socket.destroy() REMOVED
  });

  // Socket.io (for text chat only)
  const io = new Server(httpServer, {
    cors: { origin: "*", credentials: true },
  });

  // Auth middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const token = cookies.token;
      if (!token) return next(new Error("Authentication required"));

      const payload = await verifyJwt(token);
      if (!payload) return next(new Error("Invalid token"));

      socket.user = payload;
      next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  // Chat logic
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    socket.on("joinInterview", (interviewId: string) => {
      let session = interviewSessions.get(interviewId);
      if (!session) {
        session = { history: [], candidateId: socket.user?.id };
        interviewSessions.set(interviewId, session);
      }

      socket.join(interviewId);

      socket.emit(
        "chatHistory",
        session.history.map((msg) => ({
          sender: msg.role === "user" ? "user" : "ai",
          text: msg.content,
        }))
      );
    });

    socket.on("sendMessage", async (message: any, interviewId: string) => {
      const session = interviewSessions.get(interviewId);
      const history = session?.history || [];

      history.push({ role: "user", content: message.text });
      if (session) session.history = history;

      try {
        const response = await fetch(`${AI_SERVICE_URL}/interview/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: interviewId,
            candidate_answer: message.text,
          }),
        });

        if (!response.ok)
          throw new Error(`AI Error ${response.status}`);

        const data = await response.json();
        const aiText = data.question || "";

        if (aiText) {
          history.push({ role: "model", content: aiText });
          if (session) session.history = history;

          socket.emit("aiResponse", { sender: "ai", text: aiText });
        }
      } catch (err) {
        console.error("❌ AI Failed:", err);
        socket.emit("aiResponse", {
          sender: "ai",
          text: "AI engine unavailable. Try again.",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`👋 Disconnected: ${socket.id}`);
    });
  });

  // Start server
  httpServer.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
    console.log(`> Proxy → Python AI @ ${AI_SERVICE_URL}`);
  });
});
