export interface Speech {
  id: number;
  date: Date;
  session: string;
  speaker: string;
  content: string;
  sourceUrl: string;
}

export interface SpeechChunk {
  id: number;
  speechId: number;
  idx: number;
  text: string;
  sourceUrl: string;
}

export interface Highlight {
  clusterLabel: string;
  count: number;
  sampleChunkId: number;
}

export interface SnsPost {
  id: number;
  platform: string;
  postDate: Date;
  content?: string;
  mediaUrl?: string;
  postUrl: string;
}
