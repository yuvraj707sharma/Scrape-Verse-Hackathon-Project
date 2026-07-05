export type SentimentType = 'positive' | 'neutral' | 'negative';

export type SourceType = 'Reddit' | 'Quora' | 'YouTube' | 'CollegeDunia' | 'News & Blogs';

export type TopicType = 'placements' | 'fees' | 'faculty' | 'hostel life' | 'infrastructure' | 'academic quality' | 'admission/reputation' | 'other';

export interface Keyword {
  id: string;
  text: string;
  category: 'brand' | 'competitor' | 'program' | 'general';
  createdAt: string;
}

export interface Competitor {
  id: string;
  name: string;
  shortName: string;
  website: string;
  addedAt: string;
}

export interface Mention {
  id: string;
  text: string;
  title?: string;
  source: SourceType;
  url: string;
  author: string;
  date: string;
  timestamp: number;
  sentiment: SentimentType;
  primaryTopic: TopicType;
  confidence: number;
  comparisons: string[]; // Competitor universities mentioned
  summary: string;
  positives: string[];
  negatives: string[];
  isFlagged: boolean; // Early warning indicator for serious issues
  escalationReason?: string;
  program?: string; // JECRC Academic Program tag (e.g., Computer Science, Mechanical Engineering, etc.)
}

export interface AnalysisSummary {
  updatedAt: string;
  totalMentions: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sentimentByTopic: Record<TopicType, { positive: number; neutral: number; negative: number }>;
  topicDistribution: Record<TopicType, number>;
  competitorMentions: Record<string, number>; // Competitor Name -> mention count
  topComplaints: { topic: TopicType; text: string; count: number }[];
  topPraises: { topic: TopicType; text: string; count: number }[];
  competitorComparisonMatrix: Record<string, {
    placements: number; // -1 to +1 net sentiment
    fees: number;
    infrastructure: number;
    faculty: number;
  }>;
  strategicRecommendations: {
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionableItems: string[];
  }[];
  sentimentByProgram?: Record<string, { positive: number; neutral: number; negative: number }>;
  topicDistributionByProgram?: Record<string, Record<TopicType, number>>;
  competitorComparisonMatrixByProgram?: Record<string, Record<string, {
    placements: number;
    fees: number;
    infrastructure: number;
    faculty: number;
  }>>;
}

export interface SocialListeningData {
  keywords: Keyword[];
  competitors: Competitor[];
  mentions: Mention[];
  analysisSummary: AnalysisSummary | null;
}
