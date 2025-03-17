import { Application, Router } from "jsr:@oak/oak";
import { oakCors } from "jsr:@tajpouria/cors";
import { getFirstAvailablePort } from "../deno-common/net.ts";

const router = new Router();

router.get("/hello", (context) => {
  context.response.body = {
    message: "Hello, World!",
    timestamp: new Date().toISOString(),
  };
});

const startingPort = 8030;
const port = await getFirstAvailablePort(startingPort);

const app = new Application();
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

console.log(
  `[${Deno.pid}] Starting Hello World service on http://localhost:${port}`,
);
await app.listen({ port });
