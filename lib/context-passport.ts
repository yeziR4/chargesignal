import type { AiSource } from "./vana";

export type ThemeSignal = {
  name: string;
  score: number;
};

export type ContextPassportResult = {
  source: AiSource;
  conversationCount: number;
  userMessageCount: number;
  contextItemCount: number;
  wordCount: number;
  signalStrength: number;
  archetype: string;
  focusAreas: ThemeSignal[];
  collaborationGuide: string[];
  behaviorSignals: {
    depth: number;
    actionOrientation: number;
    curiosity: number;
    iteration: number;
  };
};

type Conversation = {
  title: string;
  messages: Array<{ role: string; content: string }>;
};

const THEMES: Array<{ name: string; pattern: RegExp }> = [
  { name: "AI & data", pattern: /\b(ai|agent|model|prompt|llm|data|machine learning|automation)\b/gi },
  { name: "Building software", pattern: /\b(code|coding|software|app|api|database|frontend|backend|deploy|github|javascript|typescript|python|node|react)\b/gi },
  { name: "Business & products", pattern: /\b(business|product|startup|customer|market|revenue|growth|strategy|brand|sales)\b/gi },
  { name: "Learning & research", pattern: /\b(learn|research|study|explain|understand|course|paper|compare|investigate)\b/gi },
  { name: "Creative work", pattern: /\b(write|writing|design|content|story|video|music|image|creative|presentation)\b/gi },
  { name: "Career & leadership", pattern: /\b(career|job|resume|interview|team|leadership|manager|work|professional)\b/gi },
  { name: "Money & investing", pattern: /\b(money|finance|financial|invest|trading|budget|price|cost|crypto|market)\b/gi },
  { name: "Health & performance", pattern: /\b(health|fitness|workout|sleep|nutrition|training|performance|wellness)\b/gi },
  { name: "Personal growth", pattern: /\b(goal|habit|improve|growth|motivation|confidence|decision|plan|future)\b/gi },
  { name: "Community & relationships", pattern: /\b(community|friend|relationship|people|social|audience|network|discord)\b/gi },
];

const YOUTUBE_THEMES: Array<{ name: string; pattern: RegExp }> = [
  { name: "Technology & AI", pattern: /\b(ai|artificial intelligence|agent|coding|code|software|tech|computer|programming|developer|javascript|python|robot|gadget)\b/gi },
  { name: "Learning & ideas", pattern: /\b(learn|lesson|tutorial|explained|science|history|documentary|research|study|course|how to|education|lecture)\b/gi },
  { name: "Business & money", pattern: /\b(business|startup|money|finance|invest|market|entrepreneur|sales|career|economy|crypto|trading)\b/gi },
  { name: "Creative culture", pattern: /\b(design|art|film|movie|animation|photography|writing|creative|fashion|architecture|story)\b/gi },
  { name: "Music", pattern: /\b(music|song|album|mix|remix|concert|lyrics|official audio|music video|playlist)\b/gi },
  { name: "Gaming & entertainment", pattern: /\b(game|gaming|gameplay|stream|funny|comedy|trailer|reaction|anime|esports)\b/gi },
  { name: "Health & performance", pattern: /\b(health|fitness|workout|sleep|nutrition|training|sport|performance|wellness|gym)\b/gi },
  { name: "Food & travel", pattern: /\b(food|recipe|cooking|restaurant|travel|trip|country|city|hotel|flight|adventure)\b/gi },
  { name: "News & society", pattern: /\b(news|politics|society|culture|world|current affairs|interview|debate|policy)\b/gi },
  { name: "Personal growth", pattern: /\b(goal|habit|improve|productivity|motivation|confidence|mindset|life|future|discipline)\b/gi },
];

function collectRecords(value: unknown) {
  const records: Record<string, unknown>[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    records.push(record);
    Object.values(record).forEach(visit);
  };
  visit(value);
  return records;
}

function conversationsFrom(records: Record<string, unknown>[]) {
  return records.flatMap((record): Conversation[] => {
    if (typeof record.title !== "string" || !Array.isArray(record.messages)) return [];
    const messages = record.messages.flatMap((message): Conversation["messages"] => {
      if (!message || typeof message !== "object") return [];
      const item = message as Record<string, unknown>;
      const role = typeof item.role === "string" ? item.role : typeof item.sender === "string" ? item.sender : "";
      if (typeof item.content !== "string" || !role) return [];
      return [{ role: role.toLowerCase(), content: item.content }];
    });
    return [{ title: record.title, messages }];
  });
}

function countMatches(text: string, pattern: RegExp) {
  pattern.lastIndex = 0;
  return text.match(pattern)?.length ?? 0;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function archetypeFor(topTheme: string, action: number, curiosity: number, iteration: number) {
  if (topTheme === "Building software" || (action > 65 && iteration > 45)) return "Systems Builder";
  if (topTheme === "Creative work") return "Creative Operator";
  if (topTheme === "Business & products") return "Strategic Operator";
  if (topTheme === "Learning & research" || curiosity > 70) return "Research Navigator";
  if (topTheme === "Community & relationships") return "Community Catalyst";
  return "Adaptive Explorer";
}

function focusAreasFor(text: string, themes = THEMES) {
  const themeCounts = themes
    .map((theme) => ({ name: theme.name, count: countMatches(text, theme.pattern) }))
    .sort((a, b) => b.count - a.count);
  const highestThemeCount = themeCounts[0]?.count || 1;
  return themeCounts
    .filter((theme) => theme.count > 0)
    .slice(0, 5)
    .map((theme) => ({ name: theme.name, score: clamp((theme.count / highestThemeCount) * 100) }));
}

function youtubeArchetype(topTheme: string, curiosity: number, curation: number) {
  if (["Technology & AI", "Learning & ideas"].includes(topTheme)) return "Curious Synthesizer";
  if (["Creative culture", "Music"].includes(topTheme)) return "Creative Explorer";
  if (topTheme === "Business & money") return "Strategic Learner";
  if (topTheme === "Health & performance") return "Performance Seeker";
  if (curiosity >= 70) return "Wide-Angle Explorer";
  if (curation >= 65) return "Intentional Curator";
  return "Culture Explorer";
}

function analyzeYoutubeData(records: Record<string, unknown>[]): ContextPassportResult {
  const history = records.filter((record) => typeof record.videoUrl === "string" && "watchedAtText" in record);
  const likedVideos = records.filter((record) => typeof record.videoUrl === "string" && "durationText" in record);
  const subscriptions = records.filter((record) =>
    typeof record.channelUrl === "string" && typeof record.channelTitle === "string" && "isVerified" in record,
  );
  const playlists = records.filter((record) => typeof record.playlistId === "string" && typeof record.url === "string");
  const videos = records.filter((record) => typeof record.videoUrl === "string");
  const uniqueVideos = new Map(videos.map((record) => [String(record.videoUrl), record]));
  const textRecords = [...uniqueVideos.values(), ...subscriptions, ...playlists];
  const analysisText = textRecords.map((record) => [
    record.videoTitle,
    record.channelTitle,
    record.title,
    record.description,
  ].filter((value) => typeof value === "string").join(" ")).join("\n").slice(0, 2_000_000);
  const words = analysisText.match(/\b[\p{L}\p{N}'-]+\b/gu) ?? [];
  const focusAreas = focusAreasFor(analysisText, YOUTUBE_THEMES);
  if (!focusAreas.length) focusAreas.push({ name: "General discovery", score: 100 });

  const channelNames = textRecords
    .map((record) => record.channelTitle)
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
  const uniqueChannels = new Set(channelNames.map((value) => value.toLowerCase())).size;
  const preferenceSignals = likedVideos.length + subscriptions.length + playlists.length;
  const viewedSignals = Math.max(history.length + likedVideos.length, 1);
  const depth = clamp(history.length * 1.35 + playlists.length * 7 + subscriptions.length * .35);
  const actionOrientation = clamp((likedVideos.length + playlists.length * 2) / viewedSignals * 100);
  const curiosity = clamp(uniqueChannels / viewedSignals * 100);
  const curation = clamp(preferenceSignals * 2.4);
  const contextItemCount = history.length + likedVideos.length + subscriptions.length + playlists.length;
  const signalStrength = clamp(
    Math.min(history.length, 50) * .9 +
    Math.min(likedVideos.length, 100) * .35 +
    Math.min(subscriptions.length, 100) * .2 +
    Math.min(playlists.length, 25) * 1.2 +
    Math.min(words.length, 10_000) * .002,
  );
  const topTheme = focusAreas[0]?.name ?? "General discovery";

  return {
    source: "youtube",
    conversationCount: history.length || uniqueVideos.size,
    userMessageCount: preferenceSignals,
    contextItemCount,
    wordCount: words.length,
    signalStrength,
    archetype: youtubeArchetype(topTheme, curiosity, curation),
    focusAreas,
    collaborationGuide: [
      `Connect new ideas to my interest in ${topTheme.toLowerCase()}.`,
      curiosity >= 65
        ? "Offer a few different perspectives before narrowing to one recommendation."
        : "Start with a focused recommendation, then show closely related alternatives.",
      actionOrientation >= 50
        ? "Use practical demonstrations, examples, and things I can try immediately."
        : "Explain the core idea clearly before asking me to act on it.",
      "Distinguish enduring interests from videos I may have watched only once.",
    ],
    behaviorSignals: { depth, actionOrientation, curiosity, iteration: curation },
  };
}

export function analyzeContextData(source: AiSource, value: unknown): ContextPassportResult {
  const records = collectRecords(value);
  if (source === "youtube") return analyzeYoutubeData(records);
  const conversations = conversationsFrom(records);
  const userMessages = conversations.flatMap((conversation) =>
    conversation.messages.filter((message) => ["user", "human"].includes(message.role)),
  );
  const contextItems = source === "chatgpt"
    ? records.filter((record) => typeof record.content === "string" && typeof record.created_at === "string")
    : records.filter((record) => typeof record.title === "string" && "archived" in record && "href" in record);
  const userText = userMessages.map((message) => message.content).join("\n");
  const titleText = conversations.map((conversation) => conversation.title).join("\n");
  const contextText = contextItems.map((item) =>
    source === "chatgpt" ? String(item.content ?? "") : String(item.title ?? ""),
  ).join("\n");
  const analysisText = `${titleText}\n${userText}\n${contextText}`.slice(0, 2_000_000);
  const words = analysisText.match(/\b[\p{L}\p{N}'-]+\b/gu) ?? [];
  const averageWords = userMessages.length ? words.length / userMessages.length : 0;
  const questionMessages = userMessages.filter((message) => message.content.includes("?")).length;
  const actionMentions = countMatches(analysisText, /\b(build|create|make|implement|fix|ship|deploy|write|design|plan|launch|start)\b/gi);
  const iterationMentions = countMatches(analysisText, /\b(again|revise|update|change|improve|iterate|retry|another|version|next)\b/gi);
  const focusAreas = focusAreasFor(analysisText);
  const depth = clamp(averageWords * 1.35);
  const curiosity = clamp(userMessages.length ? (questionMessages / userMessages.length) * 140 : 0);
  const actionOrientation = clamp(userMessages.length ? (actionMentions / userMessages.length) * 115 : 0);
  const iteration = clamp(userMessages.length ? (iterationMentions / userMessages.length) * 145 : 0);
  const contextItemCount = contextItems.length;
  const signalStrength = clamp(
    Math.min(conversations.length, 100) * .45 +
    Math.min(userMessages.length, 500) * .08 +
    Math.min(words.length, 20_000) * .001 +
    Math.min(contextItemCount, 50) * .3,
  );
  const archetype = archetypeFor(focusAreas[0]?.name ?? "", actionOrientation, curiosity, iteration);
  const collaborationGuide = [
    averageWords >= 55
      ? "Give me complete context and preserve important constraints."
      : "Start concise, then offer detail when it changes the decision.",
    curiosity >= 55
      ? "Explain the reasoning and surface alternatives before recommending a direction."
      : "Lead with the recommendation and the next concrete action.",
    actionOrientation >= 50
      ? "Turn ideas into executable steps, examples, or working artifacts."
      : "Help me explore and structure the problem before moving into execution.",
    iteration >= 45
      ? "Treat early outputs as drafts and make refinement easy."
      : "Aim for a polished first pass with clear assumptions.",
  ];

  return {
    source,
    conversationCount: conversations.length,
    userMessageCount: userMessages.length,
    contextItemCount,
    wordCount: words.length,
    signalStrength,
    archetype,
    focusAreas,
    collaborationGuide,
    behaviorSignals: { depth, actionOrientation, curiosity, iteration },
  };
}

export const demoPassport: ContextPassportResult = {
  source: "chatgpt",
  conversationCount: 184,
  userMessageCount: 612,
  contextItemCount: 27,
  wordCount: 48_920,
  signalStrength: 91,
  archetype: "Systems Builder",
  focusAreas: [
    { name: "Building software", score: 100 },
    { name: "AI & data", score: 86 },
    { name: "Business & products", score: 68 },
    { name: "Learning & research", score: 52 },
  ],
  collaborationGuide: [
    "Give me complete context and preserve important constraints.",
    "Lead with the recommendation and the next concrete action.",
    "Turn ideas into executable steps, examples, or working artifacts.",
    "Treat early outputs as drafts and make refinement easy.",
  ],
  behaviorSignals: { depth: 78, actionOrientation: 84, curiosity: 66, iteration: 71 },
};
