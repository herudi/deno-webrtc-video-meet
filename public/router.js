import { createRouter } from "https://esm.sh/van-router@0.6.3";

const router = createRouter({
  render: (elem) => {
    document.getElementById("app").innerHTML = elem;
  },
});
router.use((ctx, next) => {
  ctx.baseUrl = ctx.isServer
    ? new URL(ctx.request.url).origin
    : location.origin;
  return next();
});
router.add("/", async (ctx, next) => {
  const mod = (await import("./page/login.js")).default;
  return mod(ctx, next);
});
router.add("/meet", async (ctx, next) => {
  const mod = (await import("./page/meet.js")).default;
  return mod(ctx, next);
});
addEventListener("load", () => {
  router.resolve();
});
