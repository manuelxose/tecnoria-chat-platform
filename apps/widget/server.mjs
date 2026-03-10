import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT ?? 4102);
const host = process.env.HOST ?? "0.0.0.0";

const mimeTypes = {
  ".js": "text/javascript; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

createServer(async (req, res) => {
  const requestPath = req.url === "/" ? "/frame.html" : req.url?.split("?")[0] ?? "/frame.html";
  const filePath = path.join(publicDir, requestPath);

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { "content-type": mimeTypes[path.extname(filePath)] ?? "application/octet-stream" });
    res.end(content);
  } catch {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ code: "NOT_FOUND" }));
  }
}).listen(port, host, () => {
  console.log(`widget listening on http://${host}:${port}`);
});
