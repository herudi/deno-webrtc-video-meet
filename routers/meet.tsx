import { HttpError, Router } from "@nhttp/nhttp";
import { PEER, USER } from "./ws.ts";
import Join from "../components/Join.tsx";
import Meet from "../components/Meet.tsx";
import type { MeetEvent } from "../middleware.ts";

const meet_router = new Router<MeetEvent>();

meet_router.get("/", (rev) => {
  return rev.isJoin() ? rev.response.redirect("/meet") : <Join />;
});

meet_router.post("/join", (rev) => {
  const { email: id, room } = rev.body;
  PEER[room] ??= {};
  if (PEER[room][id]) {
    throw new HttpError(400, `User ${id} already exist`);
  }
  if (rev.isFull(room)) {
    throw new HttpError(400, `Room ${room} full`);
  }
  USER[room] ??= {};
  USER[room][id] = { id, room };
  return rev.response
    .cookie("lmeet", USER[room][id], { encode: true })
    .redirect("/meet");
});

meet_router.get("/meet", (rev) => {
  return rev.isJoin() ? <Meet /> : rev.logout();
});

meet_router.get("/logout", (rev) => rev.logout());

export { meet_router };
