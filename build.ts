import router_list from "./router_list.ts";

const VERSION = "@0.6.1";

const create = (isServer: boolean = true) =>
  `import { createRouter } from "https://esm.sh/van-router${VERSION}";
${
    isServer
      ? `${
        router_list.map((el, x) => `import $${x} from "./public${el.page}";`)
          .join("")
      }`
      : ""
  }
const router = createRouter({
  render: (elem) => {
    document.getElementById("app").innerHTML = elem;
  },
});
router.use((ctx, next) => {
  ctx.baseUrl = ctx.isServer ? new URL(ctx.request.url).origin : location.origin;
  return next();
});
${
    router_list.map((el, x) => {
      if (isServer) return `router.add("${el.path}", $${x});`;
      return `router.add("${el.path}", async (ctx, next) => {
    const mod = (await import(".${el.page}")).default;
    return mod(ctx, next);
  });`;
    }).join("")
  }
${isServer ? "export default router;" : "router.resolve();"}
`;

const dir = Deno.cwd();
const router_server = create();
const router_client = create(false);

await Deno.writeTextFile(dir + "/router.ts", router_server);
await Deno.writeTextFile(dir + "/public/router.js", router_client);
