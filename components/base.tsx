import { FC, Helmet, n } from "../deps.ts";
const Base: FC = ({ children }) => {
  return (
    <>
      <Helmet>
        <html lang="en-US" />
        <link rel="icon" href="data:," />
        <link rel="stylesheet" href="/assets/style.css" />
        <meta
          name="description"
          content="Simple webRTC with Deno native websocket"
        />
      </Helmet>
      <div id="app">{children}</div>
    </>
  );
};

export default Base;
