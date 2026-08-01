export const CONTENT_TYPES = [
  { value: "research", label: "Research Paper" },
  { value: "thesis", label: "Thesis" },
  { value: "project", label: "Project" },
  { value: "assignment", label: "Assignment" },
  { value: "notes", label: "Notes" },
  { value: "ppt", label: "Presentation (PPT)" },
  { value: "book", label: "Book" },
  { value: "lab_report", label: "Lab Report" },
  { value: "dataset", label: "Dataset" },
  { value: "source_code", label: "Source Code" },
  { value: "presentation", label: "Presentation" },
  { value: "question_paper", label: "Question Paper" },
  { value: "solution", label: "Solution" },
  { value: "poster", label: "Poster" },
  { value: "course_material", label: "Course Material" },
  { value: "other", label: "Other" },
];

export const LICENSES = [
  { value: "all_rights_reserved", label: "All rights reserved" },
  { value: "cc_by", label: "CC BY" },
  { value: "cc_by_sa", label: "CC BY-SA" },
  { value: "cc_by_nc", label: "CC BY-NC" },
  { value: "cc0", label: "CC0 (Public domain)" },
  { value: "custom", label: "Custom license" },
];

export const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public — anyone can find this" },
  { value: "followers", label: "Followers only" },
  { value: "university", label: "My university only" },
  { value: "private", label: "Private — only me" },
];

export const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "downloads", label: "Most downloaded" },
  { value: "stars", label: "Most starred" },
  { value: "views", label: "Most viewed" },
];

export function typeLabel(value) {
  return CONTENT_TYPES.find((t) => t.value === value)?.label || value;
}
