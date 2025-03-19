import { Application, Router } from "jsr:@oak/oak";
import { oakCors } from "jsr:@tajpouria/cors";
import {
  createFileWithContent,
  deleteFileIfExists,
} from "../deno-common/file.ts";
import { getFirstAvailablePort } from "../deno-common/net.ts";
import {
  BACKEND_PORT_FILE,
  DEPLOY_TIMESTAMP,
  GIT_VERSION,
} from "./constants.ts";
import data from "./data.json" with { type: "json" };

await deleteFileIfExists(BACKEND_PORT_FILE);

const startingBackendPort = 8025;

const port = await getFirstAvailablePort(startingBackendPort);
console.log(`[${Deno.pid}] found available backend port: ${port}`);

try {
  await createFileWithContent(BACKEND_PORT_FILE, port.toString());
  // deno-lint-ignore no-explicit-any
} catch (e: any) {
  console.error(`[${Deno.pid}] ${e.message}`);
  Deno.exit(1);
}

try {
  const router = new Router();

  // deno-lint-ignore no-explicit-any
  router.get("/api/dinosaurs", (context: any) => {
    context.response.body = data;
  });

  router.get("/api/version", (context) => {
    context.response.body = {
      "SHA": GIT_VERSION,
      "TIME_DEPLOYED": DEPLOY_TIMESTAMP,
    };
  });

  // deno-lint-ignore no-explicit-any
  router.get("/api/dinosaurs/:dinosaur", (context: any) => {
    if (!context?.params?.dinosaur) {
      context.response.body = "No dinosaur name provided.";
    }

    const dinosaur = data.find((item) =>
      item.name.toLowerCase() === context.params.dinosaur.toLowerCase()
    );

    context.response.body = dinosaur ? dinosaur : "No dinosaur found.";
  });

  const app = new Application();
  app.use(oakCors());
  app.use(router.routes());
  app.use(router.allowedMethods());

  // add an error page to route '/'
  router.get("", (context: any) => {
    context.response.body = "Backend services are running.";
  });

  console.log(
    `[${Deno.pid}] Starting Deno-Vite Server running on http://localhost:${port}`,
  );
  await app.listen({ port: port });

  // deno-lint-ignore no-explicit-any
} catch (e: any) {
  console.error(`[${Deno.pid}] ${e.message}`);
  Deno.exit(1);
}
