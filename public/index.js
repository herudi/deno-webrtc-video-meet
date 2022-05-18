new VanRouter({
  render: (elem) => {
    document.getElementById("app").innerHTML = elem;
  },
})
  .use((ctx, next) => {
    ctx.baseUrl = location.origin;
    next();
  })
  .add("/", ({ lazy }) => lazy("/page/login.js"))
  .add("/meet", ({ lazy }) => lazy("/page/meet.js"))
  .add("*", () => `<h1>404 NOT FOUND</h1>`)
  .resolve();
