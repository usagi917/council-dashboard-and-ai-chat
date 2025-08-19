import type {
  Speech,
  SpeechChunk,
  Highlight,
  SnsPost,
} from "../../domain/types";

export const speeches: Speech[] = [
  {
    id: 1,
    date: new Date("2023-12-01"),
    session: "令和5年12月定例会",
    speaker: "池元勝",
    content:
      "教育予算の充実について質問いたします。子どもたちの未来のために、より良い教育環境を整備する必要があります。",
    sourceUrl: "https://ssp.kaigiroku.net/tenant/hakusan/pg/detail.html?id=1",
  },
  {
    id: 2,
    date: new Date("2023-09-15"),
    session: "令和5年9月定例会",
    speaker: "池元勝",
    content:
      "地域福祉の充実と高齢者支援について議論いたします。地域コミュニティの活性化が重要だと考えています。",
    sourceUrl: "https://ssp.kaigiroku.net/tenant/hakusan/pg/detail.html?id=2",
  },
  {
    id: 3,
    date: new Date("2023-06-10"),
    session: "令和5年6月定例会",
    speaker: "池元勝",
    content:
      "防災対策の強化について提案いたします。市民の安全を守るための体制整備が急務です。",
    sourceUrl: "https://ssp.kaigiroku.net/tenant/hakusan/pg/detail.html?id=3",
  },
];

export const speechChunks: SpeechChunk[] = [
  {
    id: 1,
    speechId: 1,
    idx: 0,
    text: "教育予算の充実について質問いたします。",
    sourceUrl: "https://ssp.kaigiroku.net/tenant/hakusan/pg/detail.html?id=1",
  },
  {
    id: 2,
    speechId: 1,
    idx: 1,
    text: "子どもたちの未来のために、より良い教育環境を整備する必要があります。",
    sourceUrl: "https://ssp.kaigiroku.net/tenant/hakusan/pg/detail.html?id=1",
  },
  {
    id: 3,
    speechId: 2,
    idx: 0,
    text: "地域福祉の充実と高齢者支援について議論いたします。",
    sourceUrl: "https://ssp.kaigiroku.net/tenant/hakusan/pg/detail.html?id=2",
  },
  {
    id: 4,
    speechId: 2,
    idx: 1,
    text: "地域コミュニティの活性化が重要だと考えています。",
    sourceUrl: "https://ssp.kaigiroku.net/tenant/hakusan/pg/detail.html?id=2",
  },
  {
    id: 5,
    speechId: 3,
    idx: 0,
    text: "防災対策の強化について提案いたします。",
    sourceUrl: "https://ssp.kaigiroku.net/tenant/hakusan/pg/detail.html?id=3",
  },
  {
    id: 6,
    speechId: 3,
    idx: 1,
    text: "市民の安全を守るための体制整備が急務です。",
    sourceUrl: "https://ssp.kaigiroku.net/tenant/hakusan/pg/detail.html?id=3",
  },
];

export const highlights: Highlight[] = [
  {
    clusterLabel: "教育政策",
    count: 15,
    sampleChunkId: 1,
  },
  {
    clusterLabel: "地域福祉",
    count: 12,
    sampleChunkId: 3,
  },
];

export const snsPosts: SnsPost[] = [
  {
    id: 1,
    platform: "instagram",
    postDate: new Date("2023-12-01T10:00:00Z"),
    content: "市民の皆様と教育について意見交換をしました。",
    mediaUrl: "https://example.com/media/1.jpg",
    postUrl: "https://instagram.com/p/education123",
  },
  {
    id: 2,
    platform: "instagram",
    postDate: new Date("2023-11-15T15:30:00Z"),
    content: "地域のお祭りに参加させていただきました。",
    mediaUrl: "https://example.com/media/2.jpg",
    postUrl: "https://instagram.com/p/festival456",
  },
];
