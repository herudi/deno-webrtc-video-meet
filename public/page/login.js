function login({ useAfter, html, go, baseUrl }) {
  useAfter(() => {
    const $ = (v) => document.querySelector(v);
    const search = window.location.search;
    let inviteroom;
    if (search.startsWith("?invite=")) {
      inviteroom = search.replace("?invite=", "");
    }
    $("#home").style.display = "none";
    const token = localStorage.getItem("meet_token");
    if (token) return go("/meet");
    $("#home").style.display = "block";
    if (inviteroom) {
      setTimeout(() => {
        $("#room").value = inviteroom;
      }, 300);
    }
    $("#form").onsubmit = (e) => {
      e.preventDefault();
      fetch(baseUrl + "/api/join-or-create", {
        method: "POST",
        body: JSON.stringify({
          id: $("#username").value,
          room: $("#room").value,
        }),
      })
        .then((data) => {
          if (!data.ok) throw data;
          return data.json();
        })
        .then((data) => {
          localStorage.setItem("meet_token", data.token);
          go("/meet");
        })
        .catch((err) => {
          console.log(err);
          err.json().then((data) => {
            alert(data.message);
          });
        });
    };
  });

  return html`
    <div id="home">
      <div style="text-align: center; width: 100%; margin-top: 40px;">
        <img src="https://deno.land/images/artwork/glitchy-deno.jpg" alt="deno" width="150" />
        <h1 style="margin-bottom: 5px">Deno Lite Meet</h1>
        <div style="margin-bottom: 15px">Simple webRTC with Deno native websocket</div>
        <form id="form">
          <input title="Can't use special character" class="my-input" type="text" id="room"
            placeholder="Room (no special char)" pattern="^[a-zA-Z0-9]+$" required />
          <input class="my-input" type="email" id="username" placeholder="Email" required />
          <input class="my-input" type="submit" value="Join / Create">
        </form>
        <div style="margin-top: 15px">
          <a target="_blank" style="color: white" href="https://github.com/herudi/deno-webrtc-video-meet">Repo</a>
          <span> ~ </span>
          <a target="_blank" style="color: white" href="https://github.com/nhttp/nhttp">NHttp</a>
          <span> ~ </span>
          <a target="_blank" style="color: white" href="https://github.com/herudi">Developer</a>
          <span> ~ </span>
          <a target="_blank" style="color: white" href="https://deno.land/">Deno</a>
          <span> ~ </span>
          <a target="_blank" style="color: white" href="https://twitter.com/SamipPoudel3">Logo</a>
        </div>
      </div>
    </div>
  `;
}
