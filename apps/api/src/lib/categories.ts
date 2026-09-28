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
