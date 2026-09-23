export interface TeamMember {
  id: string;
  name: string;
  role: string;
  color: string;
  initials: string;
  bio: string;
  strengths: string[];
  map: string[];
  overlap: string[];
}

export const TEAM: TeamMember[] = [
  {
    id: "pritam",
    name: "Pritam Routh",
    role: "AI / ML ENGINEER · DEVOPS & AGENTIC SYSTEMS",
    color: "#74bb7e",
    initials: "PR",
    bio: "Builds intelligent systems that combine AI/ML, generative AI and agentic architecture — models that reason, agents that call tools, workflows that act. Backend, APIs and system architecture are part of the same build.",
    strengths: [
      "AI / ML",
      "Generative AI",
      "LLM Applications",
      "AI Agents",
      "Agentic Workflows",
      "RAG",
      "Tool Calling",
      "Intelligent Automation",
      "AI Integrations",
      "DevOps",
      "Cloud Infrastructure",
      "CI / CD",
      "Deployment & Monitoring",
      "Backend & API Development",
      "Full-Stack Development",
      "System Architecture",
    ],
    map: ["DATA", "MODEL", "LLM", "AGENT", "TOOLS", "API", "WORKFLOW", "BACKEND"],
    overlap: ["Backend", "APIs", "Full-stack", "Architecture", "Automation"],
  },
  {
    id: "anjan",
    name: "Anjan Karan",
    role: "LEAD UI DESIGNER · FULL-STACK & PRODUCT SYSTEMS",
    color: "#4fa98c",
    initials: "AK",
    bio: "Leads UI design and shapes polished product experiences, then carries them through implementation — frontend, backend, databases, APIs, integrations and automation.",
    strengths: [
      "Frontend Development",
      "UI / UX Design",
      "Design Systems",
      "Product Design Leadership",
      "Backend Development",
      "Full-Stack Applications",
      "React / Modern Web",
      "API Development",
      "Database Architecture",
      "System Architecture",
      "Business Applications",
      "Workflow Automation",
      "Integrations",
      "Dashboards",
      "Production Systems",
    ],
    map: ["INTERFACE", "FRONTEND", "API", "BACKEND", "DATABASE", "INTEGRATION", "AUTOMATION", "PRODUCT"],
    overlap: ["Backend", "APIs", "Full-stack", "Architecture", "Automation"],
  },
  {
    id: "manish",
    name: "Manish Das",
    role: "FULL-STACK DEVELOPER · MOBILE & WEB",
    color: "#e3b462",
    initials: "MD",
    bio: "Builds complete mobile and web products end to end — native and cross-platform apps, responsive websites, and the APIs and backends behind them.",
    strengths: [
      "Mobile App Development",
      "Website Development",
      "Full-Stack Development",
      "React Native",
      "iOS & Android",
      "Responsive Web Design",
      "API Development",
      "Cross-Platform Apps",
      "UI Implementation",
      "Database Design",
      "E-Commerce Platforms",
      "Progressive Web Apps",
    ],
    map: [
      "MOBILE",
      "IOS",
      "ANDROID",
      "WEB",
      "FRONTEND",
      "BACKEND",
      "API",
      "DEPLOY",
    ],
    overlap: ["Backend", "APIs", "Full-stack", "Architecture"],
  },
];

export const SHARED_OVERLAP = ["BACKEND", "APIs", "FULL-STACK", "ARCHITECTURE", "AUTOMATION"];