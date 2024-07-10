const $ = (id) => document.getElementById(id);
WebSocket.prototype.json = function (data) {
  this.send(JSON.stringify(data));
};
const fork = window;
const chatInput = $("chatInput");
const chatbox = $("chatbox");
const chatMessage = $("chatMessage");
const chatForm = $("chatForm");
const isHttps = () => fork.location.href.startsWith("https");

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
const peers = {};
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
const constraints = {
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
function init(stream) {
  const protoWs = isHttps() ? "wss" : "ws";
  ws = new WebSocket(
    protoWs + "://" + window.location.host + "/ws",
  );
  ws.onclose = () => {
    for (const id in peers) {
      removePeer(id);
    }
  };
  ws.onmessage = (e) => {
    const { type, data } = JSON.parse(e.data);
    if (type === "initReceive") {
      addPeer(data.id, false);
      ws.json({ type: "initSend", data });
    } else if (type === "opening") {
      localVideo.srcObject = stream;
      localStream = stream;
      info = data;
      $("settings").style.display = "inline-block";
      $("me").innerHTML = `Me: ${info.id}`;
    } else if (type === "initSend") addPeer(data.id, true);
    else if (type === "removePeer") removePeer(data.id);
    else if (type === "signal") peers[data.id].signal(data.signal);
    else if (type === "error") {
      alert(data.message);
      window.location.href = "./logout";
    } else if (type === "chat") {
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
  const videoEl = $(id);
  const colEl = $("col-" + id);
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
    ws.json({
      type: "signal",
      data: {
        signal: data,
        id,
      },
    });
  });
  peers[id].on("stream", (stream) => {
    // col
    const col = document.createElement("col");
    col.id = "col-" + id;
    col.className = "container";

    // video
    const newVid = document.createElement("video");
    newVid.srcObject = stream;
    newVid.id = id;
    newVid.playsinline = false;
    newVid.autoplay = true;
    newVid.className = "vid";
    newVid.onclick = () => openPictureMode(newVid, id);
    newVid.ontouchstart = () => openPictureMode(newVid, id);

    // user
    const user = document.createElement("div");
    user.className = "overlay-text";
    user.innerHTML = id;
    col.append(newVid, user);
    videos.appendChild(col);
  });
}
function openPictureMode(el, id) {
  el.requestPictureInPicture();
  el.onleavepictureinpicture = () => {
    setTimeout(() => {
      $(id).play();
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
    for (const id in peers) {
      for (const index in peers[id].streams[0].getTracks()) {
        for (const index2 in stream.getTracks()) {
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
    for (const id in peers) {
      for (const index in peers[id].streams[0].getTracks()) {
        for (const index2 in stream.getTracks()) {
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

  for (const id in peers) {
    removePeer(id);
  }
};

fork.toggleMute = () => {
  for (const index in localStream.getAudioTracks()) {
    localStream.getAudioTracks()[index].enabled = !localStream
      .getAudioTracks()[index].enabled;
    muteButton.innerText = localStream.getAudioTracks()[index].enabled
      ? "Unmuted"
      : "Muted";
  }
};
fork.toggleVid = () => {
  for (const index in localStream.getVideoTracks()) {
    localStream.getVideoTracks()[index].enabled = !localStream
      .getVideoTracks()[index].enabled;
    vidButton.innerText = localStream.getVideoTracks()[index].enabled
      ? "Video Enabled"
      : "Video Disabled";
  }
};
function updateButtons() {
  for (const index in localStream.getVideoTracks()) {
    vidButton.innerText = localStream.getVideoTracks()[index].enabled
      ? "Video Enabled"
      : "Video Disabled";
  }
  for (const index in localStream.getAudioTracks()) {
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
  ws.json({
    type: "chat",
    data: { id: info.id, message: chatInput.value },
  });
  chatMessage.innerHTML += `
    <div class="chat-message">
      <b>Me: </b>${chatInput.value}
    </div>
  `;
  chatInput.value = "";
  chatMessage.scrollTop = chatMessage.scrollHeight;
};

navigator.mediaDevices.getUserMedia(constraints)
  .then(init)
  .catch(function (err) {
    console.log(err);
    alert(`getusermedia error ${err.name}`);
  });
