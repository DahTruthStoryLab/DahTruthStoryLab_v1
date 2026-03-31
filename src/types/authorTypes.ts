// ─────────────────────────────────────────────
//  DahTruth StoryLab – Author Types
// ─────────────────────────────────────────────
 
export interface SocialLinks {
  website?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  goodreads?: string;
  amazon?: string;
  newsletter?: string;
}
 
export interface AuthorProfile {
  // Identity
  fullName: string;
  penName?: string;
  tagline?: string;
  bio: string;
  writingMission?: string;
  personalQuote?: string;
  photoUrl?: string; // base64 or URL
 
  // Craft
  genres: string[];
  themes: string[];
 
  // Links
  socialLinks: SocialLinks;
  contactEmail?: string;
 
  // Meta
  updatedAt: string;
}
 
export interface BlogPostEntry {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  category: string;
  publishDate: string;
  imageUrl?: string;
}
 
export type BookStatus = 'draft' | 'in-progress' | 'complete' | 'published';
 
export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  genre: string;
  series?: string;
  seriesNumber?: number;
  coverUrl?: string; // base64 or URL
  blurb: string;
  excerpt?: string;
  status: BookStatus;
  publishDate?: string;
  pageCount?: number;
  wordCount?: number;
  buyLinks: {
    amazon?: string;
    barnesAndNoble?: string;
    kobo?: string;
    applebooks?: string;
    gumroad?: string;
    directStore?: string;
  };
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}
 
export const DEFAULT_AUTHOR_PROFILE: AuthorProfile = {
  fullName: '',
  penName: '',
  tagline: '',
  bio: '',
  writingMission: '',
  personalQuote: '',
  photoUrl: '',
  genres: [],
  themes: [],
  socialLinks: {},
  contactEmail: '',
  updatedAt: new Date().toISOString(),
};
 
export const DEFAULT_BOOK: Omit<Book, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  subtitle: '',
  genre: '',
  blurb: '',
  excerpt: '',
  status: 'draft',
  buyLinks: {},
  tags: [],
  isFeatured: false,
};
 


File: src/  authorTypes.ts
