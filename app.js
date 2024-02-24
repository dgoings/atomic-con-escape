const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
// In-memory data storage
let dataStore = { status: "stopped" };
// Keep track of connected clients
const clients = [];

app.get("/", (_, res) => res.type("html").send(html));

// SSE endpoint setup
app.get("/events", (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  clients.push(res);

  const sendEvent = () => {
    const data = JSON.stringify(dataStore);
    res.write(`data: ${data}\n\n`);
  };

  // Send initial data
  sendEvent();

  // Set up heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(":\n\n"); // Comment to prevent connection timeout
  }, 5000);

  // Remove clients when they disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.splice(clients.indexOf(res), 1); // Remove from the list
  });
});

// API endpoint to receive new data and update the in-memory store
app.post("/update-data", (req, res) => {
  const { newData } = req.body; // Assuming newData comes in request body
  console.log(newData);
  dataStore = { ...dataStore, ...newData };
  // Notify all SSE clients about the update
  // For production, consider using a pub/sub system
  sendEventToAllClients(dataStore);

  res.status(200).json({ message: "Data updated" });
});

const sendEventToAllClients = (data) => {
  const dataString = JSON.stringify(data);
  // Send data to all connected clients
  clients.forEach((client) => {
    client.write(`data: ${dataString}\n\n`);
  });
};

const server = app.listen(PORT, () =>
  console.log(`Example app listening on port ${PORT}!`),
);

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Hello from Render!</title>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
    <script>
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      }, 500);
    </script>
    <style>
      @import url("https://p.typekit.net/p.css?s=1&k=vnd5zic&ht=tk&f=39475.39476.39477.39478.39479.39480.39481.39482&a=18673890&app=typekit&e=css");
      @font-face {
        font-family: "neo-sans";
        src: url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("opentype");
        font-style: normal;
        font-weight: 700;
      }
      html {
        font-family: neo-sans;
        font-weight: 700;
        font-size: calc(62rem / 16);
      }
      body {
        background: white;
      }
      section {
        border-radius: 1em;
        padding: 1em;
        position: absolute;
        top: 50%;
        left: 50%;
        margin-right: -50%;
        transform: translate(-50%, -50%);
      }
    </style>
  </head>
  <body>
    <section>
      Hello from Render!
    </section>
    <section>
      <h1>Server-Sent Events</h1>
      <p>${JSON.stringify(dataStore)}</p>
    </section>
  </body>
</html>
`;
