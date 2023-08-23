import app from "./app.tsx";

app.listen(8080, (err, info) => {
  if (err) throw err;
  console.log(`> Running on port ${info.port}`);
});
