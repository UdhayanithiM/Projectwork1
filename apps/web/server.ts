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
const port = 3000;

// --- CONFIGURATION ---
// This points to your Python Microservice
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

// Create Proxy for Voice/WebSocket traffic (Hume AI)
const proxy = httpProxy.createProxyServer({
  target: AI_SERVICE_URL,
  ws: true,
});

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// --- TYPES ---
interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface InterviewSession {
  history: ChatMessage[];
  candidateId?: string;
}

interface AuthenticatedSocket extends Socket {
  user?: UserJwtPayload;
}

// In-memory session tracker (DB is the real source of truth, this is for active socket state)
const interviewSessions = new Map<string, InterviewSession>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // --- 1. PROXY INTERCEPTOR (For Hume AI Voice) ---
  // This allows the frontend to connect to ws://localhost:3000/ws/hume
  // and have it transparently forwarded to the Python service.
  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = parse(req.url || '').pathname;
    if (pathname?.startsWith('/ws/hume')) {
      console.log('🔀 Proxying Voice Stream to AI Engine:', pathname);
      proxy.ws(req, socket, head);
    }
  });

  // Handle Proxy Errors
  proxy.on('error', (err, req, res) => {
    console.error('❌ Proxy Error:', err);
    if (res && 'writeHead' in res) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway: AI Service Unreachable');
    }
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", credentials: true },
  });

  // --- 2. AUTH MIDDLEWARE ---
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const token = cookies.token;
      if (!token) return next(new Error("Authentication error"));
      const payload = await verifyJwt(token);
      if (!payload) return next(new Error("Invalid token"));
      socket.user = payload;
      next();
    } catch {
      return next(new Error("Authentication error"));
    }
  });

  // --- 3. SOCKET LOGIC ---
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.on("joinInterview", (interviewId: string) => {
      let session = interviewSessions.get(interviewId);
      if (!session) {
        // Initialize empty session if not found in memory
        session = { history: [], candidateId: socket.user?.id };
        interviewSessions.set(interviewId, session);
      }
      socket.join(interviewId);
      
      // Send current history to client
      const chatHistoryForClient = session.history.map(h => ({ 
        sender: h.role === 'user' ? 'user' : 'ai', 
        text: h.content 
      }));
      socket.emit("chatHistory", chatHistoryForClient);
    });
    
    // --- THE CRITICAL LOGIC: CONNECTING CHAT TO PYTHON ---
    socket.on("sendMessage", async (message, interviewId) => {
        const session = interviewSessions.get(interviewId);
        const currentHistory = session ? session.history : [];
        
        // 1. Add User Message to Memory
        currentHistory.push({ role: "user", content: message.text });
        if (session) session.history = currentHistory;

        try {
            console.log(`📤 Sending to AI Engine (${AI_SERVICE_URL})...`);
            
            // 2. Call Python Service (POST /interview/next)
            const response = await fetch(`${AI_SERVICE_URL}/interview/next`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: interviewId,
                    candidate_answer: message.text
                })
            });

            if (!response.ok) {
                throw new Error(`AI Error: ${response.statusText}`);
            }

            const data = await response.json();
            const aiText = data.question; // The AI's reply is in the 'question' field

            // 3. Add AI Response to Memory
            if (aiText) {
                currentHistory.push({ role: "model", content: aiText });
                
                // 4. Send Response back to Frontend
                socket.emit("aiResponse", { sender: "ai", text: aiText });
            }
            
        } catch (err: any) {
            console.error("❌ AI Service Failed:", err.message);
            socket.emit("aiResponse", { 
                sender: "ai", 
                text: "I'm having trouble connecting to the AI brain right now. Please try again." 
            });
        }
    });

    socket.on("disconnect", () => {
        console.log(`👋 Disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
    console.log(`> AI Bridge ready on /api/ai/* -> ${AI_SERVICE_URL}`);
  });
});