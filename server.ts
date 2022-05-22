import {
  Handler,
  HttpError,
  NHttp,
} from "https://deno.land/x/nhttp@1.1.11/mod.ts";
import router from "./router.ts";

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
const ARGS = Deno.args || [];
const PORT = ARGS.includes("--port")
  ? Number(Deno.args[0].replace("--port=", ""))
  : DEFAULT_PORT;
const DEV = ARGS.includes("--dev");

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
    throw new HttpError(400, "Protocol not supported");
  }
  rev.user = tryDecode(rev.params.token);
  return next();
};

const app = new NHttp();
app.get("/ws/:token", wsMiddleware, ({ request, user }) => {
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
});
app.post("/api/join-or-create", ({ body }) => {
  const { id, room } = body;
  if ((peers[room] || {})[id]) {
    throw new HttpError(400, "User " + id + " already exist");
  }
  if (Object.keys(peers[room] || {}).length >= MAX_USER) {
    throw new HttpError(400, "Room " + room + " full");
  }
  const token = btoa(encoder.encode(JSON.stringify(body)).toString());
  return { token };
});
if (DEV) {
  app.get("/router.js", async ({ response }) => {
    response.type(MIME[".js"]);
    const index = await Deno.readTextFile("./public/router.js");
    return "window.__DEV__ = true;" + index;
  });
}
app.get("*", async ({ request, response, path }, next) => {
  try {
    response.type(MIME[path.substring(path.lastIndexOf("."))]);
    return await Deno.readTextFile("./public" + path);
  } catch (_e) {
    if (path.startsWith("/api")) {
      return next();
    }
    const index = await Deno.readTextFile("./public/template.html");
    const van = router.resolve({ request });
    const page = await van.out();
    const data = await van.data();
    const head = van.head();
    response.type("text/html");
    const html = index
      .replace("{{HEAD}}", head)
      .replace("{{PAGE}}", page)
      .replace(
        "{{INIT_DATA}}",
        `window.__VAN_DATA__ = ${JSON.stringify(data)}`,
      );
    return html;
  }
});
app.listen(PORT, () => {
  console.log("> running on port " + PORT);
});
