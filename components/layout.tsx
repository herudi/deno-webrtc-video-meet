import { type FC, Helmet } from "@nhttp/nhttp/jsx";

const Layout: FC = ({ children }) => {
  return (
    <>
      <Helmet>
        <html lang="en-US" />
        <link rel="icon" href="/assets/img/glitchy-deno.jpg" />
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

export default Layout;
