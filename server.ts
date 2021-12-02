import { Handler, NHttp } from "https://deno.land/x/nhttp@1.1.1/mod.ts";

const peers = {} as any;
const decoder = new TextDecoder();
const encoder = new TextEncoder();

// max_user/room
const MAX_USER = 16;

const MIME: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "application/javascript",
};

const DEFAULT_PORT = 8080;

const PORT = (Deno.args || []).length === 0
  ? DEFAULT_PORT
  : Number(Deno.args[0].replace("--port=", ""));

const tryDecode = (str: string) => {
  try {
    const uint = Uint8Array.from(atob(str).split(",") as Iterable<number>);
    const ret = JSON.parse(decoder.decode(uint));
    return ret;
  } catch (_e) {
    return {};
  }
};

const wsSend = (ws: WebSocket, data: Record<string, any>) => {
  ws.send(JSON.stringify(data));
};

const wsMiddleware: Handler = (rev, next) => {
  if (rev.request.headers.get("upgrade") != "websocket") {
    return next();
  }
  rev.user = tryDecode(rev.params.token);
  next();
};

new NHttp()
  .get("/", ({ response }) => {
    response.type("text/html");
    return Deno.readFile("./client/home.html");
  })
  .get("/ws/:token", wsMiddleware, ({ request, user }) => {
    const { socket, response } = Deno.upgradeWebSocket(request);
    const { id, room } = user;
    peers[room] = peers[room] || {};
    socket.onopen = () => {
      if (!id && !room) {
        wsSend(socket, {
          type: "errorToken",
          data: {},
        });
      } else if (Object.keys(peers[room] || {}).length >= MAX_USER) {
        wsSend(socket, {
          type: "full",
          data: {},
        });
      } else {
        wsSend(socket, {
          type: "opening",
          data: { id, room },
        });
        peers[room][id] = socket;
        for (let _id in peers[room]) {
          if (_id !== id) {
            wsSend(peers[room][_id], {
              type: "initReceive",
              data: { id },
            });
          }
        }
      }
    };
    socket.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);
      if (type === "signal") {
        if (!peers[room][data.id]) return;
        wsSend(peers[room][data.id], {
          type: "signal",
          data: { id, signal: data.signal },
        });
      } else if (type === "initSend") {
        wsSend(peers[room][data.id], {
          type: "initSend",
          data: { id },
        });
      } else if (type === "chat") {
        for (let _id in peers[room]) {
          if (_id !== id) {
            wsSend(peers[room][_id], {
              type: "chat",
              data: { id, message: data.message },
            });
          }
        }
      }
    };
    socket.onclose = () => {
      for (let _id in peers[room]) {
        if (_id !== id) {
          wsSend(peers[room][_id], {
            type: "removePeer",
            data: { id },
          });
        } else {
          delete peers[room][_id];
        }
      }
      if (Object.keys(peers[room] || {}).length === 0) {
        delete peers[room];
      }
    };
    return response;
  })
  .get("/meet", ({ response }) => {
    response.type("text/html");
    return Deno.readFile("./client/meet.html");
  })
  .post("/join-or-create", ({ body }) => {
    const { id, room } = body;
    if ((peers[room] || {})[id]) {
      throw new Error("User " + id + " already exist");
    }
    if (Object.keys(peers[room] || {}).length >= MAX_USER) {
      throw new Error("Room " + room + " full");
    }
    const token = btoa(encoder.encode(JSON.stringify(body)).toString());
    return { token };
  })
  .get("/*", ({ response, url }) => {
    response.type(MIME[url.substring(url.lastIndexOf("."))]);
    return Deno.readFile("./client" + url);
  })
  .listen(PORT);
