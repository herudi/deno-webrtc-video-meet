import { HttpError, Router } from "@nhttp/nhttp";
import type { MeetEvent } from "../middleware.ts";

declare global {
  interface WebSocket {
    json: (data: unknown) => void;
  }
}

WebSocket.prototype.json = function (data) {
  this.send(JSON.stringify(data));
};

type TObject<T> = Record<string, Record<string, T>>;

type TPeer = TObject<WebSocket>;

export type TUser = {
  id: string;
  room: string;
};

// in-memory peers.
export const PEER = {} as TPeer;

// in-memory users.
export const USER = {} as TObject<TUser>;

// max user in room.
export const MAX_USER = 16;

const ws_router = new Router<MeetEvent>();

ws_router.get("/ws", (rev) => {
  if (rev.request.headers.get("upgrade") != "websocket") {
    throw new HttpError(400, "Protocol not supported");
  }
  if (rev.isJoin()) {
    rev.user = rev.cookies["lmeet"];
  }
  const { socket, response } = Deno.upgradeWebSocket(rev.request);
  const { id, room } = rev.user ?? {};
  const isLost = () => {
    if (id === void 0) {
      socket.json({
        type: "error",
        data: { message: "Error Token" },
      });
      return true;
    }
    return false;
  };
  socket.onopen = () => {
    if (isLost()) return;
    PEER[room] ??= {};
    if (rev.isFull(room)) {
      return socket.json({
        type: "error",
        data: { message: `Room ${room} full. MAX_USER ${MAX_USER}` },
      });
    }
    socket.json({
      type: "opening",
      data: { id, room },
    });
    PEER[room][id] = socket;
    rev.broadcast({
      type: "initReceive",
      data: { id },
    });
  };
  socket.onmessage = (e) => {
    if (isLost()) return;
    PEER[room] ??= {};
    const { type, data } = JSON.parse(e.data);
    if (type === "signal") {
      if (!PEER[room][data.id]) return;
      PEER[room][data.id].json({
        type: "signal",
        data: { id, signal: data.signal },
      });
    } else if (type === "initSend") {
      PEER[room][data.id].json({
        type: "initSend",
        data: { id },
      });
    } else if (type === "chat") {
      rev.broadcast({
        type: "chat",
        data: { id, message: data.message },
      });
    }
  };
  socket.onclose = () => {
    if (isLost()) return;
    PEER[room] ??= {};
    rev.broadcast({
      type: "removePeer",
      data: { id },
    }, true);
    if (Object.keys(PEER[room]).length === 0) {
      delete PEER[room];
    }
  };
  return response;
});

export { ws_router };
