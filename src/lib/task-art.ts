import community from "@/assets/task-community.jpg";
import play from "@/assets/task-play.jpg";
import spin from "@/assets/task-spin.jpg";
import earn from "@/assets/task-earn.jpg";
import events from "@/assets/task-events.jpg";
import explore from "@/assets/task-explore.jpg";

const RULES: { match: RegExp; art: string }[] = [
  { match: /community|join our|channel|group|invite|friend|referral/i, art: community },
  { match: /spin|wheel|slot|boinker|luck|chest/i, art: spin },
  { match: /play|game|arena|quest|poker|paw|tower/i, art: play },
  { match: /earn|bux|coin|gram|surf|money|mine|mining/i, art: earn },
  { match: /event|daily|calendar|watch|ad/i, art: events },
];

/** Picks a stable illustration for a task from its title. */
export const artForTask = (title: string): string => {
  for (const rule of RULES) if (rule.match.test(title)) return rule.art;
  return explore;
};
