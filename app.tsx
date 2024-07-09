import nhttp, { Handler } from "@nhttp/nhttp";
import serveStatic from "@nhttp/nhttp/serve-static";
import { renderToHtml } from "@nhttp/nhttp/jsx";
import { Join } from "./components/join.tsx";
import Meet from "./components/meet.tsx";
import { meet, wsHandlers, wsJoin } from "./ws.ts";

const nocache: Handler = ({ response }, next) => {
  response.setHeader("Surrogate-Control", "no-store");
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.setHeader("Expires", "0");
  return next();
};

const app = nhttp();

app.use("/assets", serveStatic("public", { etag: true }));

app.use(meet);

app.engine(renderToHtml);

app.get("/", nocache, ({ isJoin, response }) => {
  return isJoin() ? response.redirect("/meet") : <Join />;
});
app.post("/join", nocache, wsJoin);
app.get("/ws", wsHandlers);
app.get("/meet", nocache, ({ isJoin, logout }) => {
  return isJoin() ? <Meet /> : logout();
});
app.get("/logout", nocache, (rev) => rev.logout());

export default app;
