import type { Handler, RequestEvent, TRet } from "@nhttp/nhttp";
import { MAX_USER, PEER, type TUser, USER } from "./routers/ws.ts";
import ErrorComp from "./components/Error.tsx";
import { n } from "jsr:@nhttp/nhttp@^2.0.2/jsx";

interface MeetError extends Error {
  status?: number;
}

export interface MeetHandler {
  isFull: (room: string) => boolean;
  isJoin: () => boolean;
  logout: () => void;
  user: TUser;
  broadcast: <T>(data: T, isDelete?: boolean) => void;
}

export interface MeetEvent extends RequestEvent, MeetHandler {}

export const meetMiddleware: Handler<MeetHandler> = (rev, next) => {
  if (!rev.originalUrl.startsWith("/assets")) {
    rev.response.header({
      "Surrogate-Control": "no-store",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Expires": "0",
    });
  }
  rev.isFull = (room: string) => {
    return Object.keys(PEER[room] ?? {}).length >= MAX_USER;
  };
  rev.isJoin = () => {
    const cookie = rev.cookies["lmeet"];
    if (typeof cookie === "object" && cookie.id && cookie.room) {
      const { room, id } = cookie;
      return USER[room]?.[id] != null;
    }
    if (cookie != null) {
      rev.response.clearCookie("lmeet");
    }
    return false;
  };
  rev.broadcast = (data, isDel) => {
    const { id, room } = rev.user;
    for (const k in PEER[room]) {
      if (k !== id) {
        PEER[room][k].json(data);
      } else if (isDel) {
        delete PEER[room][k];
      }
    }
  };
  rev.logout = () => {
    if (rev.isJoin()) {
      const { id, room } = rev.cookies["lmeet"];
      delete USER[room]?.[id];
    }
    rev.response.clearCookie("lmeet");
    return rev.response.redirect("/");
  };
  return next();
};

export const errorHandler = <T>(err: T): TRet => {
  const isError = err instanceof Error;
  return n(ErrorComp, {
    code: isError ? ((<MeetError> err).status ?? 500) : 404,
    message: isError ? err.message : "Page Not Found",
  });
};
