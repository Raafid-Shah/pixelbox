// src/content/index.ts
import profileData from './profile.json';
import projectsData from './projects.json';

export interface ProjectEntry {
  id: string;
  title: string;
  category: string;
  year: string;
  version: string;
  tech: string[];
  summary: string;
  metrics: string[];
  demoUrl: string;
  caseStudy: string;
}

export interface ProfileData {
  name: string;
  handle: string;
  title: string;
  location: string;
  level: number;
  class: string;
  status: string;
  shortPitch: string;
  bio: string[];
  attributes: Array<{ label: string; value: number; code: string }>;
  attractReelHighlights: string[];
}

export interface CartridgeStyle {
  labelColor: string;
  stripeColor: string;
  badgeBg: string;
  patternType: 'grid' | 'dots' | 'diagonal' | 'solid';
}

const CART_PALETTES: readonly CartridgeStyle[] = [
  { labelColor: '#f4efe4', stripeColor: '#d8342b', badgeBg: '#1d2b53', patternType: 'grid' },
  { labelColor: '#f4efe4', stripeColor: '#ffb000', badgeBg: '#008751', patternType: 'diagonal' },
  { labelColor: '#f4efe4', stripeColor: '#3fa9f5', badgeBg: '#7e2553', patternType: 'dots' },
  { labelColor: '#f4efe4', stripeColor: '#ff77a8', badgeBg: '#ab5236', patternType: 'solid' },
];

export class ContentManager {
  private profile: ProfileData = profileData as ProfileData;
  private projects: ProjectEntry[] = (projectsData as { projects: ProjectEntry[] }).projects;

  public getProfile(): Readonly<ProfileData> {
    return this.profile;
  }

  public getProjects(): ReadonlyArray<ProjectEntry> {
    return this.projects;
  }

  public getProjectById(id: string): ProjectEntry | undefined {
    return this.projects.find((p) => p.id === id);
  }

  /**
   * Section 10: Generates deterministic cartridge label art styling from a project slug hash
   * so every portfolio project gets a unique physical cassette label for free.
   */
  public getCartridgeStyle(slug: string): CartridgeStyle {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = (hash << 5) - hash + slug.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % CART_PALETTES.length;
    return CART_PALETTES[idx];
  }
}

export const content = new ContentManager();