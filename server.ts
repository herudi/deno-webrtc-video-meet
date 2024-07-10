import nhttp from "@nhttp/nhttp";
import serveStatic from "@nhttp/nhttp/serve-static";
import { renderToHtml } from "@nhttp/nhttp/jsx";
import { ws_router } from "./routers/ws.ts";
import { meet_router } from "./routers/meet.tsx";
import { errorHandler, meetMiddleware } from "./middleware.ts";

const app = nhttp();

app.use("/assets", serveStatic("public", { etag: true }));

app.engine(renderToHtml);

app.use(meetMiddleware, [ws_router, meet_router]);

app.on404(errorHandler).onError(errorHandler);

app.listen(8080, (err, info) => {
  if (err) throw err;
  console.log(`> Running on port ${info.port}`);
});
