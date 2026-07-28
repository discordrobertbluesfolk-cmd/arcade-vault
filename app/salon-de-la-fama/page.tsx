import { HallOfFameView } from "@/components/hall-of-fame-view";
import { GAMES } from "@/lib/games";

export default function HallOfFamePage() {
  return <HallOfFameView games={GAMES} />;
}
