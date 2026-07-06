import { resumeBlocks as defaultResumeBlocks } from "@/data/resume-data";
import type {
  ResumeBlock,
  ResumeContactItem,
  ResumeDocument,
  ResumeFormatting,
  ResumeHeader,
  ResumeKitState,
  ResumeSectionDefinition,
  ResumeSelection,
  SectionFieldConfig,
  SectionId,
} from "@/types/resume";

export const STORAGE_KEY = "resumekit-state-v1";

export const defaultTextStyles = {
  name: {
    fontFamily: "",
    fontSize: 22,
    bold: true,
    italic: false,
  },
  contact: {
    fontFamily: "",
    fontSize: 11,
    bold: false,
    italic: false,
  },
  sectionTitle: {
    fontFamily: "",
    fontSize: 12,
    bold: true,
    italic: false,
  },
  blockTitle: {
    fontFamily: "",
    fontSize: 10.5,
    bold: true,
    italic: false,
  },
  subtitle: {
    fontFamily: "",
    fontSize: 10.5,
    bold: false,
    italic: true,
  },
  meta: {
    fontFamily: "",
    fontSize: 10,
    bold: false,
    italic: false,
  },
  stack: {
    fontFamily: "",
    fontSize: 10,
    bold: false,
    italic: false,
  },
  bullet: {
    fontFamily: "",
    fontSize: 10.5,
    bold: false,
    italic: false,
  },
} satisfies ResumeFormatting["textStyles"];

export const defaultFormatting: ResumeFormatting = {
  fontFamily: "Arial",
  lineHeight: 1.25,
  margin: 36,
  sectionSpacing: 10,
  bulletSpacing: 3,
  textStyles: defaultTextStyles,
};

export const defaultResumeHeader: ResumeHeader = {
  name: "AMR SOLIMAN",
  contactItems: [
    {
      id: "contact-location",
      label: "Location",
      value: "Edmonton, AB",
      type: "location",
    },
    {
      id: "contact-email",
      label: "Email",
      value: "asolima1@ualberta.ca",
      href: "mailto:asolima1@ualberta.ca",
      type: "email",
    },
    {
      id: "contact-linkedin",
      label: "LinkedIn",
      value: "LinkedIn",
      href: "https://linkedin.com/in/",
      type: "link",
    },
    {
      id: "contact-github",
      label: "GitHub",
      value: "GitHub",
      href: "https://github.com/",
      type: "link",
    },
    {
      id: "contact-portfolio",
      label: "Portfolio",
      value: "Portfolio",
      href: "https://",
      type: "link",
    },
  ],
};

export const blankResumeHeader: ResumeHeader = {
  name: "",
  contactItems: [],
};

export const defaultSectionDefinitions: ResumeSectionDefinition[] = [
  {
    id: "education",
    label: "Education",
    fields: {
      subtitle: true,
      location: true,
      dates: true,
      gpa: true,
      stack: false,
      bullets: true,
      presentEndDate: false,
    },
  },
  {
    id: "skills",
    label: "Technical Skills",
    fields: {
      subtitle: false,
      location: false,
      dates: false,
      gpa: false,
      stack: false,
      bullets: true,
      presentEndDate: false,
    },
  },
  {
    id: "experience",
    label: "Work Experience",
    fields: {
      subtitle: true,
      location: true,
      dates: true,
      gpa: false,
      stack: false,
      bullets: true,
      presentEndDate: true,
    },
  },
  {
    id: "projects",
    label: "Projects",
    fields: {
      subtitle: true,
      location: false,
      dates: true,
      gpa: false,
      stack: true,
      bullets: true,
      presentEndDate: true,
    },
  },
];

export function cloneSections(sections: ResumeSectionDefinition[]) {
  return sections.map((section) => ({
    ...section,
    fields: {
      ...section.fields,
    },
  }));
}

export function cloneBlocks(blocks: ResumeBlock[]) {
  return blocks.map((block) => ({
    ...block,
    stack: block.stack ? [...block.stack] : undefined,
    bullets: block.bullets.map((bullet) => ({
      ...bullet,
    })),
  }));
}

export function cloneFormatting(formatting: ResumeFormatting): ResumeFormatting {
  return {
    ...formatting,
    textStyles: Object.fromEntries(
      Object.entries(formatting.textStyles).map(([key, style]) => [
        key,
        { ...style },
      ]),
    ) as ResumeFormatting["textStyles"],
  };
}

export function cloneHeader(header: ResumeHeader): ResumeHeader {
  return {
    name: header.name,
    contactItems: header.contactItems.map((item) => ({ ...item })),
  };
}

export function getDefaultBlocks() {
  return cloneBlocks(defaultResumeBlocks);
}

export function getAllBlockIds(blocks: ResumeBlock[]) {
  return blocks.map((block) => block.id);
}

export function getAllBulletIds(blocks: ResumeBlock[]) {
  return blocks.flatMap((block) => block.bullets.map((bullet) => bullet.id));
}

export function getDefaultSectionOrder(sections: ResumeSectionDefinition[]) {
  return sections.map((section) => section.id);
}

export function getDefaultBlockOrder(blocks: ResumeBlock[]) {
  return blocks.reduce<Record<SectionId, string[]>>((order, block) => {
    order[block.section] = [...(order[block.section] ?? []), block.id];
    return order;
  }, {});
}

export function getDefaultBulletOrder(blocks: ResumeBlock[]) {
  return Object.fromEntries(
    blocks.map((block) => [block.id, block.bullets.map((bullet) => bullet.id)]),
  );
}

export function createSelection(
  blocks: ResumeBlock[],
  blockIds: string[],
): ResumeSelection {
  const selectedBlocks = blocks.filter((block) => blockIds.includes(block.id));

  return {
    selectedContactItemIds: defaultResumeHeader.contactItems.map((item) => item.id),
    selectedBlockIds: blockIds,
    selectedBulletIds: selectedBlocks.flatMap((block) =>
      block.bullets.map((bullet) => bullet.id),
    ),
  };
}

function createDocumentFromContent(
  id: string,
  documentName: string,
  blocks: ResumeBlock[],
  selection: ResumeSelection,
  formatting = defaultFormatting,
): ResumeDocument {
  const sections = cloneSections(defaultSectionDefinitions);

  return {
    id,
    documentName,
    pageSize: "letter",
    header: cloneHeader(defaultResumeHeader),
    sections,
    blocks,
    selection,
    sectionOrder: getDefaultSectionOrder(sections),
    blockOrder: getDefaultBlockOrder(blocks),
    bulletOrder: getDefaultBulletOrder(blocks),
    formatting: cloneFormatting(formatting),
  };
}

export function createInitialDocuments(blocks: ResumeBlock[]): ResumeDocument[] {
  const softwareBlocks = cloneBlocks(blocks);
  const electricalBlocks = cloneBlocks(blocks);

  return [
    createDocumentFromContent(
      "software-resume",
      "Software Resume",
      softwareBlocks,
      {
        selectedContactItemIds: defaultResumeHeader.contactItems.map(
          (item) => item.id,
        ),
        selectedBlockIds: getAllBlockIds(softwareBlocks),
        selectedBulletIds: getAllBulletIds(softwareBlocks),
      },
    ),
    createDocumentFromContent(
      "electrical-resume",
      "Electrical / Hardware Resume",
      electricalBlocks,
      createSelection(electricalBlocks, [
        "education-ualberta",
        "skills-software",
        "experience-startup",
        "project-altium",
        "project-suluk",
      ]),
      {
        ...defaultFormatting,
        lineHeight: 1.18,
        sectionSpacing: 8,
        bulletSpacing: 2,
        textStyles: {
          ...defaultTextStyles,
          bullet: {
            ...defaultTextStyles.bullet,
            fontSize: 10.2,
          },
        },
      },
    ),
  ];
}

export function createInitialState(): ResumeKitState {
  const blocks = getDefaultBlocks();

  return {
    documents: createInitialDocuments(blocks),
    activeDocumentId: "software-resume",
  };
}

export function createBulletId(blockId: string) {
  return `${blockId}-bullet-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function createBlockId(section: SectionId) {
  return `${section}-block-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function createSectionId(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .concat(`-${Date.now().toString(36)}`);
}

export function createDocumentId() {
  return `resume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createContactItemId() {
  return `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyBlock(
  section: SectionId,
  sectionLabel = "Section",
): ResumeBlock {
  return {
    id: createBlockId(section),
    section,
    title: `New ${sectionLabel} Item`,
    subtitle: "",
    location: "",
    startDate: "",
    endDate: "",
    gpa: "",
    stack: [],
    bullets: [],
  };
}

export function duplicateBlock(block: ResumeBlock): ResumeBlock {
  const newBlockId = createBlockId(block.section);

  return {
    ...block,
    id: newBlockId,
    title: `${block.title} Copy`,
    stack: block.stack ? [...block.stack] : undefined,
    bullets: block.bullets.map((bullet) => ({
      ...bullet,
      id: createBulletId(newBlockId),
    })),
  };
}

export function createNewDocument(name = "Untitled Resume"): ResumeDocument {
  const sections = cloneSections(defaultSectionDefinitions);
  const blocks = getDefaultBlocks();

  return {
    id: createDocumentId(),
    documentName: name,
    pageSize: "letter",
    header: cloneHeader(defaultResumeHeader),
    sections,
    blocks,
    selection: {
      selectedContactItemIds: defaultResumeHeader.contactItems.map(
        (item) => item.id,
      ),
      selectedBlockIds: getAllBlockIds(blocks),
      selectedBulletIds: getAllBulletIds(blocks),
    },
    sectionOrder: getDefaultSectionOrder(sections),
    blockOrder: getDefaultBlockOrder(blocks),
    bulletOrder: getDefaultBulletOrder(blocks),
    formatting: cloneFormatting(defaultFormatting),
  };
}

export function createBlankDocument(name = "Untitled Resume"): ResumeDocument {
  const sections = cloneSections(defaultSectionDefinitions);

  return {
    id: createDocumentId(),
    documentName: name,
    pageSize: "letter",
    header: cloneHeader(blankResumeHeader),
    sections,
    blocks: [],
    selection: {
      selectedContactItemIds: [],
      selectedBlockIds: [],
      selectedBulletIds: [],
    },
    sectionOrder: getDefaultSectionOrder(sections),
    blockOrder: Object.fromEntries(sections.map((section) => [section.id, []])),
    bulletOrder: {},
    formatting: cloneFormatting(defaultFormatting),
  };
}

export function createEmptyUserState(): ResumeKitState {
  const document = createBlankDocument();

  return {
    documents: [document],
    activeDocumentId: document.id,
  };
}

export function duplicateDocument(document: ResumeDocument): ResumeDocument {
  return {
    ...document,
    id: createDocumentId(),
    documentName: `${document.documentName} Copy`,
    header: cloneHeader(document.header),
    sections: cloneSections(document.sections),
    blocks: cloneBlocks(document.blocks),
    selection: {
      selectedContactItemIds: [
        ...document.selection.selectedContactItemIds,
      ],
      selectedBlockIds: [...document.selection.selectedBlockIds],
      selectedBulletIds: [...document.selection.selectedBulletIds],
    },
    sectionOrder: [...document.sectionOrder],
    blockOrder: Object.fromEntries(
      Object.entries(document.blockOrder).map(([sectionId, blockIds]) => [
        sectionId,
        [...blockIds],
      ]),
    ),
    bulletOrder: Object.fromEntries(
      Object.entries(document.bulletOrder).map(([blockId, bulletIds]) => [
        blockId,
        [...bulletIds],
      ]),
    ),
    formatting: normalizeFormatting(document.formatting),
  };
}

export function createSectionDefinition(
  label: string,
  fields: SectionFieldConfig,
): ResumeSectionDefinition {
  return {
    id: createSectionId(label),
    label,
    fields,
  };
}

export function createEmptyContactItem(): ResumeContactItem {
  return {
    id: createContactItemId(),
    label: "Contact",
    value: "",
    href: "",
    type: "text",
  };
}

function normalizeFormatting(formatting?: Partial<ResumeFormatting>) {
  return {
    ...defaultFormatting,
    ...(formatting ?? {}),
    textStyles: {
      name: {
        ...defaultTextStyles.name,
        ...(formatting?.textStyles?.name ?? {}),
      },
      contact: {
        ...defaultTextStyles.contact,
        ...(formatting?.textStyles?.contact ?? {}),
      },
      sectionTitle: {
        ...defaultTextStyles.sectionTitle,
        ...(formatting?.textStyles?.sectionTitle ?? {}),
      },
      blockTitle: {
        ...defaultTextStyles.blockTitle,
        ...(formatting?.textStyles?.blockTitle ?? {}),
      },
      subtitle: {
        ...defaultTextStyles.subtitle,
        ...(formatting?.textStyles?.subtitle ?? {}),
      },
      meta: {
        ...defaultTextStyles.meta,
        ...(formatting?.textStyles?.meta ?? {}),
      },
      stack: {
        ...defaultTextStyles.stack,
        ...(formatting?.textStyles?.stack ?? {}),
      },
      bullet: {
        ...defaultTextStyles.bullet,
        ...(formatting?.textStyles?.bullet ?? {}),
      },
    },
  };
}

function normalizeSectionDefinition(
  section: Partial<ResumeSectionDefinition>,
): ResumeSectionDefinition | null {
  if (!section.id || !section.label) return null;

  return {
    id: section.id,
    label: section.label,
    fields: {
      subtitle: section.fields?.subtitle ?? false,
      location: section.fields?.location ?? false,
      dates: section.fields?.dates ?? false,
      gpa: section.fields?.gpa ?? section.id === "education",
      stack: section.fields?.stack ?? false,
      bullets: section.fields?.bullets ?? true,
      presentEndDate: section.fields?.presentEndDate ?? false,
    },
  };
}

function normalizeHeader(header?: Partial<ResumeHeader>): ResumeHeader {
  if (!header) return cloneHeader(defaultResumeHeader);

  const contactItems = Array.isArray(header.contactItems)
    ? header.contactItems
        .map((item) => {
          if (!item || !item.id || !item.type) return null;

          return {
            id: item.id,
            label: item.label ?? "Contact",
            value: item.value,
            href: item.href ?? "",
            type: item.type,
          } satisfies ResumeContactItem;
        })
        .filter(isDefined)
    : cloneHeader(defaultResumeHeader).contactItems;

  return {
    name: typeof header.name === "string" ? header.name : defaultResumeHeader.name,
    contactItems,
  };
}

function normalizeDocument(
  document: Partial<ResumeDocument>,
  fallbackBlocks: ResumeBlock[],
  fallbackSections: ResumeSectionDefinition[],
): ResumeDocument | null {
  if (!document.id || !document.documentName) return null;

  const blocks =
    Array.isArray(document.blocks) && document.blocks.length > 0
      ? cloneBlocks(document.blocks)
      : cloneBlocks(fallbackBlocks);
  const sections =
    Array.isArray(document.sections) && document.sections.length > 0
      ? document.sections.map(normalizeSectionDefinition).filter(isDefined)
      : cloneSections(fallbackSections);

  const sectionIds = new Set(sections.map((section) => section.id));
  const blockIds = new Set(blocks.map((block) => block.id));
  const bulletIds = new Set(getAllBulletIds(blocks));
  const fallbackSectionOrder = getDefaultSectionOrder(sections);
  const savedSectionOrder = document.sectionOrder ?? [];
  const sectionOrder = [
    ...savedSectionOrder.filter((id) => sectionIds.has(id)),
    ...fallbackSectionOrder.filter((id) => !savedSectionOrder.includes(id)),
  ];
  const fallbackBlockOrder = getDefaultBlockOrder(blocks);
  const blockOrder = Object.fromEntries(
    sections.map((section) => {
      const savedOrder = document.blockOrder?.[section.id] ?? [];
      const fallbackOrder = fallbackBlockOrder[section.id] ?? [];

      return [
        section.id,
        [
          ...savedOrder.filter((id) => blockIds.has(id)),
          ...fallbackOrder.filter((id) => !savedOrder.includes(id)),
        ],
      ];
    }),
  );
  const fallbackBulletOrder = getDefaultBulletOrder(blocks);
  const bulletOrder = Object.fromEntries(
    blocks.map((block) => {
      const savedOrder = document.bulletOrder?.[block.id] ?? [];
      const fallbackOrder = fallbackBulletOrder[block.id] ?? [];

      return [
        block.id,
        [
          ...savedOrder.filter((id) => bulletIds.has(id)),
          ...fallbackOrder.filter((id) => !savedOrder.includes(id)),
        ],
      ];
    }),
  );
  const header = normalizeHeader(document.header);
  const defaultSelection = {
    selectedContactItemIds: header.contactItems.map((item) => item.id),
    selectedBlockIds: getAllBlockIds(blocks),
    selectedBulletIds: getAllBulletIds(blocks),
  };

  return {
    id: document.id,
    documentName: document.documentName,
    pageSize: document.pageSize ?? "letter",
    header,
    sections,
    blocks,
    selection: {
      selectedContactItemIds: (
        document.selection?.selectedContactItemIds ??
        defaultSelection.selectedContactItemIds
      ).filter((id) => header.contactItems.some((item) => item.id === id)),
      selectedBlockIds: (
        document.selection?.selectedBlockIds ?? defaultSelection.selectedBlockIds
      ).filter((id) => blockIds.has(id)),
      selectedBulletIds: (
        document.selection?.selectedBulletIds ??
        defaultSelection.selectedBulletIds
      ).filter((id) => bulletIds.has(id)),
    },
    sectionOrder,
    blockOrder,
    bulletOrder,
    formatting: normalizeFormatting(document.formatting),
  };
}

export function normalizeStoredState(value: unknown): ResumeKitState | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<ResumeKitState> & {
    blocks?: ResumeBlock[];
    sectionDefinitions?: ResumeSectionDefinition[];
  };

  if (!Array.isArray(candidate.documents) || candidate.documents.length === 0) {
    return null;
  }

  const fallbackBlocks =
    Array.isArray(candidate.blocks) && candidate.blocks.length > 0
      ? cloneBlocks(candidate.blocks)
      : getDefaultBlocks();
  const fallbackSections =
    Array.isArray(candidate.sectionDefinitions) &&
    candidate.sectionDefinitions.length > 0
      ? candidate.sectionDefinitions
          .map(normalizeSectionDefinition)
          .filter(isDefined)
      : cloneSections(defaultSectionDefinitions);
  const documents = candidate.documents
    .map((document) =>
      normalizeDocument(document, fallbackBlocks, fallbackSections),
    )
    .filter(isDefined);

  if (documents.length === 0) return null;

  const activeDocumentExists = documents.some(
    (document) => document.id === candidate.activeDocumentId,
  );

  return {
    documents,
    activeDocumentId: activeDocumentExists
      ? candidate.activeDocumentId!
      : documents[0].id,
  };
}

export function readStoredState(): ResumeKitState | null {
  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);
    if (!rawState) return null;

    return normalizeStoredState(JSON.parse(rawState));
  } catch {
    return null;
  }
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}
