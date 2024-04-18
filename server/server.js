const mongoose = require("mongoose");
const Document = require("./Document");


mongoose
  .connect("mongodb://127.0.0.1:27017/text-editor")
  .then(() => console.log("Database Connection Successfull..."))
  .catch((err) => {
    console.log("--------------------Found an error while database connection----------------------");
    console.log(err);
  });

const io = require("socket.io")(5174, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const defaultData = "";

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      // console.log(delta);
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;
  const document = await Document.findById(id);

  if (document) return document;
  return await Document.create({ _id: id, data: defaultData });
}
