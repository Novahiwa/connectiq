const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-room", (code) => {
    if (!rooms[code]) {
      rooms[code] = socket.id;
      socket.join(code);
      socket.emit("wait");
    } else {
      const other = rooms[code];
      socket.join(code);
      socket.emit("start-call", { target: other });
      io.to(other).emit("incoming-call", { from: socket.id });
      delete rooms[code];
    }
  });

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
    for (const code in rooms) {
      if (rooms[code] === socket.id) delete rooms[code];
    }
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Running on port ${PORT}`));