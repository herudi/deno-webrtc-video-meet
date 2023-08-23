import { FC, Helmet, n } from "../deps.ts";
import Base from "./base.tsx";

const Meet: FC<{ isDev: boolean }> = ({ isDev }) => {
  return (
    <Base>
      <Helmet>
        <title>Meet - Deno Lite Meet</title>
        <script src="https://unpkg.com/simple-peer@9.11.1/simplepeer.min.js">
        </script>
      </Helmet>
      <Helmet footer>
        {isDev && <script>{`window.__DEV__ = true`}</script>}
        <script src={"/assets/meet.js"}></script>
      </Helmet>
      <div id="meet">
        <div class="row" id="videos">
          <div class="container">
            <video id="localVideo" class="vid" autoplay muted></video>
            <div class="overlay-text" id="me">
              Loading...
            </div>
          </div>
        </div>
        <br />
        <div class="settings" id="settings" style={{ display: "none" }}>
          <button id="switchButton" class="button" onclick="switchMedia()">
            Switch Camera
          </button>
          <button id="muteButton" class="button" onclick="toggleMute()">
            Unmuted
          </button>
          <button id="vidButton" class="button" onclick="toggleVid()">
            Video Enabled
          </button>
          <button class="button" onclick="shareScreen()">
            Share Screen
          </button>
          <button class="button" onclick="inviteFriend()">
            Invite Friend
          </button>
          <button class="button" onclick="openChat()">
            Chat
          </button>
          <button class="button" onclick="logout()">
            Logout
          </button>
        </div>
        <div class="chat-container" id="chatbox" style={{ display: "none" }}>
          <button type="button" onclick="closeChat()">
            <b>X</b>
          </button>
          <div class="chat-inner" id="chatMessage">
          </div>
          <form style={{ position: "absolute", bottom: 10 }} id="chatForm">
            <input
              type="text"
              placeholder="message"
              class="my-input-chat"
              id="chatInput"
            />
            <input type="submit" style={{ width: 60 }} value="SEND" />
          </form>
        </div>
      </div>
    </Base>
  );
};

export default Meet;
