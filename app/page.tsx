import { HomeView } from "@/components/home-view";
import { GAMES } from "@/lib/games";

export default function Home() {
  return <HomeView games={GAMES} />;
}
