// @ts-ignore: ts(6133)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dino } from "../types.ts";

export default function Index() {
  const [dinosaurs, setDinosaurs] = useState<Dino[]>([]);
  const [version, setVersion] = useState<
    { SHA: string; TIME_DEPLOYED: string } | null
  >(null);

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/dinosaurs/`);
      const allDinosaurs = await response.json() as Dino[];
      setDinosaurs(allDinosaurs);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/version`);
      const versionInfo = await response.json();
      setVersion(versionInfo);
    })();
  }, []);

  // get the version from /api/version

  return (
    <main>
      <h1>Welcome to the Test app?! {version?.SHA}</h1>
      <p>Click on a dinosaur below to learn more.</p>
      {dinosaurs.map((dinosaur: Dino) => {
        return (
          <Link
            to={`/${dinosaur.name.toLowerCase()}`}
            key={dinosaur.name}
            className="dinosaur"
          >
            {dinosaur.name}
          </Link>
        );
      })}
    </main>
  );
}
