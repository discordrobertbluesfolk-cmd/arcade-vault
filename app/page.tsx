import { LibraryView } from "@/components/library-view";
import { GAMES } from "@/lib/games";

export default function Home() {
  return <LibraryView games={GAMES} />;
}
