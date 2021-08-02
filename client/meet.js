const meetElement = document.getElementById("meet");
meetElement.style.display = "none";
const token = localStorage.getItem("meet_token");
const isHttps = window.location.href.startsWith("https");

function logout() {
  localStorage.removeItem("meet_token");
  setTimeout(() => {
    window.location.href = "./";
  }, 300);
}

let ws;
let localStream = null;
let peers = {};

if (!isHttps) {
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
  ws = new WebSocket(protoWs + "://" + window.location.host + "/ws/" + token);
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
      document.getElementById("me").style.display = "inline-block";
      document.getElementById("loading").style.display = "none";
    } else if (type === "initSend") addPeer(data.id, true);
    else if (type === "removePeer") removePeer(data.id);
    else if (type === "signal") peers[data.id].signal(data.signal);
    else if (type === "full") alert("Room FULL");
    else if (type === "errorToken") logout();
    else if (type === "strictUser") {
      alert("User " + data.id + " already exist. please choose other.");
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
    col.className = "col container";

    // video
    let newVid = document.createElement("video");
    newVid.srcObject = stream;
    newVid.id = id;
    newVid.playsinline = false;
    newVid.autoplay = true;
    newVid.className = "vid";
    newVid.onclick = () => openPictureMode(newVid);
    newVid.ontouchstart = (e) => openPictureMode(newVid);

    // user
    let user = document.createElement("div");
    user.className = "overlay-text";
    user.innerHTML = id;
    col.append(newVid, user);
    videos.appendChild(col);
  });
}
function openPictureMode(el) {
  el.requestPictureInPicture();
}

function switchMedia() {
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
}

function shareScreen() {
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
      switchMedia();
      addPeer(info.id, false);
    };
  });
}

function removeLocalStream() {
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
}

function toggleMute() {
  for (let index in localStream.getAudioTracks()) {
    localStream.getAudioTracks()[index].enabled = !localStream
      .getAudioTracks()[index].enabled;
    muteButton.innerText = localStream.getAudioTracks()[index].enabled
      ? "Unmuted"
      : "Muted";
  }
}
function toggleVid() {
  for (let index in localStream.getVideoTracks()) {
    localStream.getVideoTracks()[index].enabled = !localStream
      .getVideoTracks()[index].enabled;
    vidButton.innerText = localStream.getVideoTracks()[index].enabled
      ? "Video Enabled"
      : "Video Disabled";
  }
}
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

function inviteFriend() {
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
}

if (token) {
  meetElement.style.display = "block";
  navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
      init(token, stream);
    })
    .catch(function (err) {
      alert(`getusermedia error ${err.name}`);
    });
} else {
  window.location.href = "./";
}