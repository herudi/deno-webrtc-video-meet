# Deno webRTC Video Meet

[Deno](https://deno.land/) WebRTC video meet and chat with deno native websocket.

[![Deploy](https://deno.com/deno-deploy-button.svg)](https://dash.deno.com/new?url=https://raw.githubusercontent.com/herudi/deno-webrtc-video-meet/master/server.ts)

> Requires Deno 1.15.x or higher.

## Features

- Video Meet
- Chat
- Share Screen
- Room
- No Phuser, No SocketIO

## Run

```bash
deno run --allow-net --allow-read --unstable server.ts
```

open in http://localhost:8080/

```ts
// change to false if non ssl /client/meet.js.
const redirectToHttps = false;
```

## Demo

https://lite-meet.deno.dev/

## Note
It's fun project. PRs welcome :).
