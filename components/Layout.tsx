import { type FC, Helmet } from "@nhttp/nhttp/jsx";

const Layout: FC = ({ children }) => {
  return (
    <>
      <Helmet>
        <html lang="en-US" />
        <link rel="icon" type="image/x-icon" href="/assets/img/favicon.ico" />
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
