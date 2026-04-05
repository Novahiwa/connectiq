const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  if (!waitingUser) {
    waitingUser = socket.id;
    socket.emit("wait"); // tell this user to wait
  } else {
    // Second user arrived — introduce them to the first
    socket.emit("start-call", { target: waitingUser });
    io.to(waitingUser).emit("incoming-call", { from: socket.id });
    waitingUser = null;
  }

  socket.on("offer", ({ target, offer }) => {
    io.to(target).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ target, answer }) => {
    io.to(target).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    io.to(target).emit("ice-candidate", { from: socket.id, candidate });
  });

  socket.on("disconnect", () => {
    if (waitingUser === socket.id) waitingUser = null;
    console.log("Disconnected:", socket.id);
  });
});
server.listen(PORT, () => console.log(`Running on port ${PORT}`));