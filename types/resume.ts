export type SectionType =
  | "education"
  | "skills"
  | "experience"
  | "projects";

export type PageSize = "letter" | "a4";

export type ResumeBullet = {
  id: string;
  text: string;
};

export type ResumeBlock = {
  id: string;
  section: SectionType;
  title: string;
  subtitle?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  stack?: string[];
  bullets: ResumeBullet[];
};

export type ResumeFormatting = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  margin: number;
  sectionSpacing: number;
  bulletSpacing: number;
};

export type ResumeSelection = {
  selectedBlockIds: string[];
  selectedBulletIds: string[];
};

export type ResumeDocumentSettings = {
  documentName: string;
  pageSize: PageSize;
};

export type ResumeDocument = ResumeDocumentSettings & {
  id: string;
  selection: ResumeSelection;
  bulletOrder: Record<string, string[]>;
};