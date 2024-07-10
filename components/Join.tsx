import { type FC, Helmet, useQuery, useScript } from "@nhttp/nhttp/jsx";
import Layout from "./Layout.tsx";

const LINKS = [
  {
    title: "Repo",
    href: "https://github.com/herudi/deno-webrtc-video-meet",
  },
  {
    title: "NHttp",
    href: "https://github.com/nhttp/nhttp",
  },
  {
    title: "Author",
    href: "https://github.com/herudi",
  },
  {
    title: "Deno",
    href: "https://deno.land",
  },
  {
    title: "Logo",
    href: "https://twitter.com/SamipPoudel3",
  },
];

const LinkBottom: FC<{
  href: string;
}> = ({ href, children }) => {
  return (
    <>
      <a
        target="_blank"
        style={{ color: "white", margin: 5 }}
        href={href}
      >
        {children}
      </a>
      <span>~</span>
    </>
  );
};

const Join: FC = () => {
  const { invite } = useQuery();
  useScript({ invite }, (data) => {
    if (data.invite) {
      const $ = (v: string) => document.getElementById(v) as HTMLInputElement;
      $("email").focus();
      $("room").readOnly = true;
      $("room").style.backgroundColor = "#131315";
      $("room").style.color = "white";
    }
  });
  return (
    <Layout>
      <Helmet>
        <title>Join / Create Room - Deno Lite Meet</title>
      </Helmet>
      <div
        style={{
          textAlign: "center",
          width: "100%",
          marginTop: 70,
        }}
      >
        <img
          src="/assets/img/glitchy-deno.jpg"
          alt="deno"
          width="150"
          style={{ borderRadius: "10%" }}
        />
        <h1 style={{ marginBottom: 5 }}>Deno Lite Meet</h1>
        <div style={{ marginBottom: 15 }}>
          Simple webRTC with Deno native websocket
        </div>
        <form action="/join" method="POST">
          <input
            title="Can't use special character"
            class="my-input"
            type="text"
            name="room"
            id="room"
            value={invite ?? ""}
            autoComplete="off"
            placeholder="Room (no special char)"
            pattern="^[a-zA-Z0-9]+$"
            required
          />
          <input
            class="my-input"
            type="email"
            autoComplete="off"
            name="email"
            id="email"
            placeholder="Email"
            required
          />
          <input class="my-input" type="submit" value="Join / Create" />
        </form>
        <div style={{ marginTop: 15 }}>
          <span>~</span>
          {LINKS.map(({ title, href }) => {
            return <LinkBottom href={href}>{title}</LinkBottom>;
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Join;
