export type PageSize = "letter" | "a4";

export type SectionId = string;

export type SectionFieldConfig = {
  subtitle: boolean;
  location: boolean;
  dates: boolean;
  gpa: boolean;
  stack: boolean;
  bullets: boolean;
  presentEndDate: boolean;
};

export type ResumeSectionDefinition = {
  id: SectionId;
  label: string;
  fields: SectionFieldConfig;
};

export type ResumeBullet = {
  id: string;
  text: string;
};

export type ResumeBlock = {
  id: string;
  section: SectionId;
  title: string;
  subtitle?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  stack?: string[];
  bullets: ResumeBullet[];
};

export type ResumeContactType = "text" | "email" | "phone" | "link" | "location";

export type ResumeContactItem = {
  id: string;
  label: string;
  value: string;
  href?: string;
  type: ResumeContactType;
};

export type ResumeHeader = {
  name: string;
  contactItems: ResumeContactItem[];
};

export type TextStyleKey =
  | "name"
  | "contact"
  | "sectionTitle"
  | "blockTitle"
  | "subtitle"
  | "meta"
  | "stack"
  | "bullet";

export type ResumeTextStyle = {
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
};

export type ResumeFormatting = {
  fontFamily: string;
  lineHeight: number;
  margin: number;
  sectionSpacing: number;
  bulletSpacing: number;
  textStyles: Record<TextStyleKey, ResumeTextStyle>;
};

export type ResumeSelection = {
  selectedContactItemIds: string[];
  selectedBlockIds: string[];
  selectedBulletIds: string[];
};

export type ResumeDocumentSettings = {
  documentName: string;
  pageSize: PageSize;
};

export type ResumeDocument = ResumeDocumentSettings & {
  id: string;
  header: ResumeHeader;
  sections: ResumeSectionDefinition[];
  blocks: ResumeBlock[];
  selection: ResumeSelection;
  sectionOrder: SectionId[];
  blockOrder: Record<SectionId, string[]>;
  bulletOrder: Record<string, string[]>;
  formatting: ResumeFormatting;
};

export type ResumeKitState = {
  documents: ResumeDocument[];
  activeDocumentId: string;
};
