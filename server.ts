import app from "./app.tsx";

app.listen(8080, (_e, info) => {
  console.log("> running on port " + info.port);
});
