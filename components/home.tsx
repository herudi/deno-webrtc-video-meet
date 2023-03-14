import { FC, Helmet, n } from "../deps.ts";
import Base from "./base.tsx";

const Home: FC = () => {
  return (
    <Base>
      <Helmet>
        <title>Login - Deno Lite Meet</title>
      </Helmet>
      <Helmet body>
        <script src={"/assets/home.js"}></script>
      </Helmet>
      <div id="home">
        <div
          style={{
            textAlign: "center",
            width: "100%",
            marginTop: 40,
          }}
        >
          <img
            src="https://deno.land/images/artwork/glitchy-deno.jpg"
            alt="deno"
            width="150"
          />
          <h1 style={{ marginBottom: 5 }}>Deno Lite Meet</h1>
          <div style={{ marginBottom: 15 }}>
            Simple webRTC with Deno native websocket
          </div>
          <form id="form">
            <input
              title="Can't use special character"
              class="my-input"
              type="text"
              id="room"
              placeholder="Room (no special char)"
              pattern="^[a-zA-Z0-9]+$"
              required
            />
            <input
              class="my-input"
              type="email"
              id="username"
              placeholder="Email"
              required
            />
            <input class="my-input" type="submit" value="Join / Create" />
          </form>
          <div style={{ marginTop: 15 }}>
            <a
              target="_blank"
              style={{ color: "white" }}
              href="https://github.com/herudi/deno-webrtc-video-meet"
            >
              Repo
            </a>
            <span>~</span>
            <a
              target="_blank"
              style={{ color: "white" }}
              href="https://github.com/nhttp/nhttp"
            >
              NHttp
            </a>
            <span>~</span>
            <a
              target="_blank"
              style={{ color: "white" }}
              href="https://github.com/herudi"
            >
              Developer
            </a>
            <span>~</span>
            <a
              target="_blank"
              style={{ color: "white" }}
              href="https://deno.land/"
            >
              Deno
            </a>
            <span>~</span>
            <a
              target="_blank"
              style={{ color: "white" }}
              href="https://twitter.com/SamipPoudel3"
            >
              Logo
            </a>
          </div>
        </div>
      </div>
    </Base>
  );
};

export default Home;
