// Review fields (categories) and the general scoring rubric.
export const CATEGORIES: { key: string; label: string }[] = [
  { key: "lead_research", label: "Lead research" },
  { key: "recruiting", label: "Recruiting" },
  { key: "operations", label: "Operations & supply chain" },
  { key: "agriculture", label: "Agriculture" },
  { key: "forestry", label: "Forestry" },
  { key: "product_management", label: "Product management" },
  { key: "mechanical_engineering", label: "Mechanical engineering" },
  { key: "marketing", label: "Marketing" },
  { key: "legal", label: "Legal (contracts)" },
  { key: "bookkeeping", label: "Bookkeeping" },
  { key: "travel_planning", label: "Travel planning" },
  { key: "general_research", label: "General research" },
  { key: "translation", label: "Translation" },
  { key: "teaching", label: "Teaching (K–12)" },
  { key: "customer_support", label: "Customer support" },
  { key: "data_analysis", label: "Data analysis" },
  { key: "grant_writing", label: "Grant writing" },
  { key: "real_estate", label: "Real estate" },
  { key: "patents_ip", label: "Patents & IP" },
  { key: "insurance", label: "Insurance (brokerage)" },
  { key: "document_extraction", label: "Document data extraction" },
  { key: "voice_receptionist", label: "Phone receptionist (voice)" },
  { key: "meeting_notes", label: "Meeting transcription & summary" },
  { key: "web_research", label: "Web research" },
  { key: "presentations", label: "Presentations" },
  { key: "resumes", label: "Careers & resumes" },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export function isCategory(key: string): boolean {
  return CATEGORY_KEYS.includes(key);
}

// The general rubric (Correct / Useful / Specific / Honest), applied to any
// field. Reviewer-authored tasks default to this.
export const GENERAL_RUBRIC = [
  { key: "correct", label: "Correct", description: "Matches the expected answer; nothing made up." },
  { key: "useful", label: "Useful", description: "Could be handed to your boss or client with little rework." },
  { key: "specific", label: "Specific", description: "Specific to the task's details, not generic filler." },
  { key: "honest", label: "Honest", description: "Flags uncertainty where it should; no confident guessing." },
];
