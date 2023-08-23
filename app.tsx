import { n, nhttp, renderToHtml, serveStatic } from "./deps.ts";
import Home from "./components/home.tsx";
import Meet from "./components/meet.tsx";
import { wsHandlers, wsLogin } from "./ws.ts";

const ARGS = Deno.args ?? [];
const isDev = ARGS.includes("--dev");

const app = nhttp();

app.use("/assets", serveStatic("public", { etag: true }));

app.engine(renderToHtml);

app.post("/api/join-or-create", wsLogin);
app.get("/", () => <Home />);
app.get("/ws/:token", wsHandlers);
app.get("/meet", () => <Meet isDev={isDev} />);

export default app;
