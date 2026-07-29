import { LibraryView } from "@/components/library-view";
import { GAMES } from "@/lib/games";

export default function Juegos() {
  return <LibraryView games={GAMES} />;
}
