import { createRouter } from "https://esm.sh/van-router@0.6.1";
import $0 from "./public/page/login.js";
import $1 from "./public/page/meet.js";
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
router.add("/", $0);
router.add("/meet", $1);
export default router;
