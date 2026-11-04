import { createFileRoute } from "@tanstack/react-router";
import { AlokoApp } from "@/components/aloko/AlokoApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <AlokoApp />;
}


