import { Handler, HttpError } from "@nhttp/nhttp";
import { n } from "@nhttp/nhttp/jsx";
import { Bad } from "./components/bad.tsx";

declare global {
  interface WebSocket {
    json: (data: unknown) => void;
  }
}

WebSocket.prototype.json = function (data) {
  this.send(JSON.stringify(data));
};

type TObject<T> = Record<string, Record<string, T>>;
type TUser = {
  id: string;
  room: string;
};
type TPeer = TObject<WebSocket>;

// in-memory peers.
const peer = {} as TPeer;

// in-memory users.
const user = {} as TObject<TUser>;

// max user in room.
const MAX_USER = 16;

const isFull = (room: string) => {
  return Object.keys(peer[room] ?? {}).length >= MAX_USER;
};

const broadcast = ({ id, room }: TUser, data: unknown, isDel?: boolean) => {
  for (const k in peer[room]) {
    if (k !== id) {
      peer[room][k].json(data);
    } else if (isDel) {
      delete peer[room][k];
    }
  }
};

const middleware: Handler = (rev, next) => {
  if (rev.request.headers.get("upgrade") != "websocket") {
    throw new HttpError(400, "Protocol not supported");
  }
  if (rev.isJoin()) {
    rev.user = rev.cookies["lmeet"];
  }
  return next();
};

const handler: Handler = ({ request, user }) => {
  const { socket, response } = Deno.upgradeWebSocket(request);
  const { id, room } = user ?? {} as TUser;
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
    peer[room] ??= {};
    if (isFull(room)) {
      return socket.json({
        type: "error",
        data: { message: `Room ${room} full. MAX_USER ${MAX_USER}` },
      });
    }
    socket.json({
      type: "opening",
      data: { id, room },
    });
    peer[room][id] = socket;
    broadcast(user, {
      type: "initReceive",
      data: { id },
    });
  };
  socket.onmessage = (e) => {
    if (isLost()) return;
    peer[room] ??= {};
    const { type, data } = JSON.parse(e.data);
    if (type === "signal") {
      if (!peer[room][data.id]) return;
      peer[room][data.id].json({
        type: "signal",
        data: { id, signal: data.signal },
      });
    } else if (type === "initSend") {
      peer[room][data.id].json({
        type: "initSend",
        data: { id },
      });
    } else if (type === "chat") {
      broadcast(user, {
        type: "chat",
        data: { id, message: data.message },
      });
    }
  };
  socket.onclose = () => {
    if (isLost()) return;
    peer[room] ??= {};
    broadcast(user, {
      type: "removePeer",
      data: { id },
    }, true);
    if (Object.keys(peer[room]).length === 0) {
      delete peer[room];
    }
  };
  return response;
};

export const meet: Handler = (rev, next) => {
  rev.isJoin = () => {
    const cookie = rev.cookies["lmeet"];
    if (typeof cookie === "object" && cookie.id && cookie.room) {
      const { room, id } = cookie;
      return user[room]?.[id] != null;
    }
    if (cookie != null) {
      rev.response.clearCookie("lmeet");
    }
    return false;
  };
  rev.logout = () => {
    if (rev.isJoin()) {
      const { id, room } = rev.cookies["lmeet"];
      delete user[room]?.[id];
    }
    rev.response.clearCookie("lmeet");
    return rev.response.redirect("/");
  };
  return next();
};

export const wsHandlers: Handler[] = [middleware, handler];
export const wsJoin: Handler = ({ body, response }) => {
  const { email: id, room } = body;
  peer[room] ??= {};
  if (peer[room][id]) {
    return n(Bad, {
      message: "User " + id + " already exist",
    }) as unknown as Response;
  }
  if (isFull(room)) {
    return n(Bad, { message: "Room " + room + " full" }) as unknown as Response;
  }
  user[room] ??= {};
  user[room][id] = { id, room };
  return response.cookie("lmeet", user[room][id], { encode: true }).redirect(
    "/meet",
  );
};
