const $ = (v) => document.querySelector(v);
const search = window.location.search;
let inviteroom;
if (search.startsWith("?invite=")) {
  inviteroom = search.replace("?invite=", "");
}
$("#home").style.display = "none";
const token = localStorage.getItem("meet_token");
if (token) {
  window.location.href = "./meet";
  // return;
} else {
  $("#home").style.display = "block";
  if (inviteroom) {
    setTimeout(() => {
      $("#room").value = inviteroom;
    }, 300);
  }
  $("#form").onsubmit = (e) => {
    e.preventDefault();
    fetch("./api/join-or-create", {
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
        window.location.href = "./meet";
      })
      .catch((err) => {
        console.log(err);
        err.json().then((data) => {
          alert(data.message);
        });
      });
  };
}
