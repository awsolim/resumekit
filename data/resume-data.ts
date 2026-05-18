import type { ResumeBlock } from "@/types/resume";

export const resumeBlocks: ResumeBlock[] = [
  {
    id: "education-ualberta",
    section: "education",
    title: "University of Alberta",
    subtitle: "B.Sc. in Computer Engineering Co-op",
    location: "Edmonton, AB",
    startDate: "2023",
    endDate: "Expected May 2028",
    bullets: [
      {
        id: "edu-1",
        text: "Relevant coursework includes digital logic, circuits, software development, and computer systems.",
      },
      {
        id: "edu-2",
        text: "Co-op student seeking technical roles across software, electrical, embedded, and applied engineering environments.",
      },
    ],
  },
  {
    id: "experience-startup",
    section: "experience",
    title: "Drone R&D Startup",
    subtitle: "Software / Technical Intern",
    location: "Edmonton, AB",
    startDate: "2025",
    endDate: "2025",
    stack: ["Next.js", "TypeScript", "AI workflows", "Full-stack development"],
    bullets: [
      {
        id: "exp-startup-1",
        text: "Designed and implemented full-stack web applications for multiple early-stage clients in a fast-paced startup environment.",
      },
      {
        id: "exp-startup-2",
        text: "Integrated AI-assisted workflows to accelerate development, automate internal processes, and reduce manual implementation time.",
      },
      {
        id: "exp-startup-3",
        text: "Collaborated directly with stakeholders to translate product requirements into usable technical features.",
      },
    ],
  },
  {
    id: "project-suluk",
    section: "projects",
    title: "Suluk",
    subtitle: "Multi-tenant Learning Management System",
    stack: ["Next.js", "Supabase", "PostgreSQL", "TypeScript", "Tailwind"],
    bullets: [
      {
        id: "suluk-1",
        text: "Built a mobile-first full-stack SaaS platform enabling mosques to manage programs, teachers, students, and enrollments across isolated tenants.",
      },
      {
        id: "suluk-2",
        text: "Designed role-based dashboards for students, teachers, and mosque administrators using tenant-aware routing and database access patterns.",
      },
      {
        id: "suluk-3",
        text: "Modeled relational data for programs, enrollments, profiles, mosque memberships, and teacher assignments using Supabase and PostgreSQL.",
      },
    ],
  },
  {
    id: "project-ashara",
    section: "projects",
    title: "Ashara",
    subtitle: "Qur’an Reflection App",
    stack: ["Next.js", "Supabase", "API integration", "Product design"],
    bullets: [
      {
        id: "ashara-1",
        text: "Developed a mobile-first reflection app centered on structured Qur’an journeys, lessons, and guided action plans.",
      },
      {
        id: "ashara-2",
        text: "Integrated external Qur’an content APIs to fetch verse ranges and support dynamic lesson rendering.",
      },
      {
        id: "ashara-3",
        text: "Designed a focused learning flow emphasizing Arabic encounter, study, reflection, and practical application.",
      },
    ],
  },
  {
    id: "project-altium",
    section: "projects",
    title: "PCB Design Lab",
    subtitle: "Altium Schematic and Board Layout",
    stack: ["Altium", "Schematic capture", "PCB layout", "ERC"],
    bullets: [
      {
        id: "altium-1",
        text: "Created schematic designs using component placement, wiring, power symbols, ground references, and electrical rule checking.",
      },
      {
        id: "altium-2",
        text: "Practiced PCB layout concepts including trace routing, board layers, silkscreen markings, and clearance constraints.",
      },
    ],
  },
  {
    id: "skills-software",
    section: "skills",
    title: "Technical Skills",
    bullets: [
      {
        id: "skills-1",
        text: "Languages: TypeScript, JavaScript, Python, SQL, C/C++",
      },
      {
        id: "skills-2",
        text: "Web: Next.js, React, Tailwind CSS, Supabase, PostgreSQL",
      },
      {
        id: "skills-3",
        text: "Engineering: Altium, schematic review, PCB layout basics, circuits, digital logic",
      },
    ],
  },
];