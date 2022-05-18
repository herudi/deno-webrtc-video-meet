function meet({ useVanilla, html }) {
  useVanilla(() => {
    const fork = {};
    const meetElement = document.getElementById("meet");
    const chatInput = document.getElementById("chatInput");
    const chatbox = document.getElementById("chatbox");
    const chatMessage = document.getElementById("chatMessage");
    const chatForm = document.getElementById("chatForm");
    meetElement.style.display = "none";
    const token = localStorage.getItem("meet_token");
    const isHttps = window.location.href.startsWith("https");
    const redirectToHttps = window.__DEV__ !== void 0 ? false : true;

    fork.logout = () => {
      localStorage.removeItem("meet_token");
      setTimeout(() => {
        window.location.href = "./";
      }, 300);
    };
    fork.openChat = () => {
      chatbox.style.display = "block";
      setTimeout(() => {
        chatInput.focus();
      }, 300);
    };
    fork.closeChat = () => {
      chatbox.style.display = "none";
    };

    let ws;
    let localStream = null;
    let peers = {};
    if (redirectToHttps && !isHttps) {
      window.location.href = "https://" +
        window.location.href.replace("http://", "");
    }
    const configuration = {
      "iceServers": [
        {
          "urls": "stun:stun.l.google.com:19302",
        },
        {
          "urls": "stun:stun1.l.google.com:19302",
        },
        {
          "urls": "stun:stun2.l.google.com:19302",
        },
        {
          "urls": "stun:stun3.l.google.com:19302",
        },
        {
          "urls": "stun:stun4.l.google.com:19302",
        },
      ],
    };
    let constraints = {
      audio: true,
      video: {
        width: {
          max: 300,
        },
        height: {
          max: 300,
        },
      },
    };
    constraints.video.facingMode = {
      ideal: "user",
    };
    let info = {};
    function init(token, stream) {
      const protoWs = isHttps ? "wss" : "ws";
      ws = new WebSocket(
        protoWs + "://" + window.location.host + "/ws/" + token,
      );
      ws.onclose = () => {
        for (let id in peers) {
          removePeer(id);
        }
      };
      ws.onmessage = (e) => {
        const { type, data } = JSON.parse(e.data);
        if (type === "initReceive") {
          addPeer(data.id, false);
          ws.send(JSON.stringify({
            type: "initSend",
            data,
          }));
        } else if (type === "opening") {
          localVideo.srcObject = stream;
          localStream = stream;
          info = data;
          document.getElementById("settings").style.display = "inline-block";
          document.getElementById("me").innerHTML = `Me: ${info.id}`;
        } else if (type === "initSend") addPeer(data.id, true);
        else if (type === "removePeer") removePeer(data.id);
        else if (type === "signal") peers[data.id].signal(data.signal);
        else if (type === "full") alert("Room FULL");
        else if (type === "errorToken") fork.logout();
        else if (type === "chat") {
          chatMessage.innerHTML += `
        <div class="chat-message">
          <b>${data.id.split("@")[0]}: </b>${data.message}
        </div>
      `;
          fork.openChat();
        }
      };
    }
    function removePeer(id) {
      let videoEl = document.getElementById(id);
      let colEl = document.getElementById("col-" + id);
      if (colEl && videoEl) {
        const tracks = videoEl.srcObject.getTracks();
        tracks.forEach(function (track) {
          track.stop();
        });
        videoEl.srcObject = null;
        videos.removeChild(colEl);
      }
      if (peers[id]) peers[id].destroy();
      delete peers[id];
    }
    function addPeer(id, am_initiator) {
      peers[id] = new SimplePeer({
        initiator: am_initiator,
        stream: localStream,
        config: configuration,
      });
      peers[id].on("signal", (data) => {
        ws.send(JSON.stringify({
          type: "signal",
          data: {
            signal: data,
            id,
          },
        }));
      });
      peers[id].on("stream", (stream) => {
        // col
        let col = document.createElement("col");
        col.id = "col-" + id;
        col.className = "container";

        // video
        let newVid = document.createElement("video");
        newVid.srcObject = stream;
        newVid.id = id;
        newVid.playsinline = false;
        newVid.autoplay = true;
        newVid.className = "vid";
        newVid.onclick = () => openPictureMode(newVid, id);
        newVid.ontouchstart = (e) => openPictureMode(newVid, id);

        // user
        let user = document.createElement("div");
        user.className = "overlay-text";
        user.innerHTML = id;
        col.append(newVid, user);
        videos.appendChild(col);
      });
    }
    function openPictureMode(el, id) {
      el.requestPictureInPicture();
      el.onleavepictureinpicture = (e) => {
        setTimeout(() => {
          document.getElementById(id).play();
        }, 300);
      };
    }

    fork.switchMedia = () => {
      if (constraints.video.facingMode.ideal === "user") {
        constraints.video.facingMode.ideal = "environment";
      } else {
        constraints.video.facingMode.ideal = "user";
      }
      const tracks = localStream.getTracks();
      tracks.forEach(function (track) {
        track.stop();
      });
      localVideo.srcObject = null;
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        for (let id in peers) {
          for (let index in peers[id].streams[0].getTracks()) {
            for (let index2 in stream.getTracks()) {
              if (
                peers[id].streams[0].getTracks()[index].kind ===
                  stream.getTracks()[index2].kind
              ) {
                peers[id].replaceTrack(
                  peers[id].streams[0].getTracks()[index],
                  stream.getTracks()[index2],
                  peers[id].streams[0],
                );
                break;
              }
            }
          }
        }
        localStream = stream;
        localVideo.srcObject = stream;
        updateButtons();
      });
    };

    fork.shareScreen = () => {
      navigator.mediaDevices.getDisplayMedia().then((stream) => {
        for (let id in peers) {
          for (let index in peers[id].streams[0].getTracks()) {
            for (let index2 in stream.getTracks()) {
              if (
                peers[id].streams[0].getTracks()[index].kind ===
                  stream.getTracks()[index2].kind
              ) {
                peers[id].replaceTrack(
                  peers[id].streams[0].getTracks()[index],
                  stream.getTracks()[index2],
                  peers[id].streams[0],
                );
                break;
              }
            }
          }
        }
        localStream = stream;
        localVideo.srcObject = localStream;
        updateButtons();
        stream.getVideoTracks()[0].onended = function () {
          fork.switchMedia();
          addPeer(info.id, false);
        };
      });
    };

    fork.removeLocalStream = () => {
      if (localStream) {
        const tracks = localStream.getTracks();
        tracks.forEach(function (track) {
          track.stop();
        });
        localVideo.srcObject = null;
      }

      for (let id in peers) {
        removePeer(id);
      }
    };

    fork.toggleMute = () => {
      for (let index in localStream.getAudioTracks()) {
        localStream.getAudioTracks()[index].enabled = !localStream
          .getAudioTracks()[index].enabled;
        muteButton.innerText = localStream.getAudioTracks()[index].enabled
          ? "Unmuted"
          : "Muted";
      }
    };
    fork.toggleVid = () => {
      for (let index in localStream.getVideoTracks()) {
        localStream.getVideoTracks()[index].enabled = !localStream
          .getVideoTracks()[index].enabled;
        vidButton.innerText = localStream.getVideoTracks()[index].enabled
          ? "Video Enabled"
          : "Video Disabled";
      }
    };
    function updateButtons() {
      for (let index in localStream.getVideoTracks()) {
        vidButton.innerText = localStream.getVideoTracks()[index].enabled
          ? "Video Enabled"
          : "Video Disabled";
      }
      for (let index in localStream.getAudioTracks()) {
        muteButton.innerText = localStream.getAudioTracks()[index].enabled
          ? "Unmuted"
          : "Muted";
      }
    }

    fork.inviteFriend = () => {
      const url = window.location.origin + "/?invite=" + info.room;
      const input = document.createElement("input");
      input.setAttribute("value", url);
      document.body.appendChild(input);
      input.select();
      const result = document.execCommand("copy");
      document.body.removeChild(input);
      if (result) {
        alert("Link was copied to clipboard");
      }
    };
    chatForm.onsubmit = (e) => {
      e.preventDefault();
      if (!chatInput.value) {
        return;
      }
      ws.send(JSON.stringify({
        type: "chat",
        data: { id: info.id, message: chatInput.value },
      }));
      chatMessage.innerHTML += `
    <div class="chat-message">
      <b>Me: </b>${chatInput.value}
    </div>
  `;
      chatInput.value = "";
      chatMessage.scrollTop = chatMessage.scrollHeight;
    };

    if (token) {
      meetElement.style.display = "block";
      navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
          init(token, stream);
        })
        .catch(function (err) {
          alert(`getusermedia error ${err.name}`);
        });
      for (const key in fork) {
        window[key] = fork[key];
      }
    } else {
      window.location.href = "./";
    }

    // cleanup
    return () => {
      for (const key in fork) {
        delete window[key];
      }
    };
  });

  return html`
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
      <div class="settings" id="settings" style="display: none;">
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
      <div class="chat-container" id="chatbox" style="display: none;">
        <button type="button" onclick="closeChat()"><b>X</b></button>
        <div class="chat-inner" id="chatMessage">
        </div>
        <form style="position: absolute; bottom: 10px;" id="chatForm">
          <input type="text" placeholder="message" class="my-input-chat" id="chatInput" />
          <input type="submit" style="width: 60px;" value="SEND">
        </form>
      </div>
    </div>
  `;
}
