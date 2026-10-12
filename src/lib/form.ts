/** Result of a server action used with <ActionForm>. `undefined` means nothing to show yet. */
export type FormState = { error?: string } | undefined;

/** Read a trimmed string from FormData ("" when missing). */
export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Same as text() but returns undefined when empty (handy for optional columns). */
export function optionalText(formData: FormData, key: string): string | undefined {
  const value = text(formData, key);
  return value === "" ? undefined : value;
}

/** First readable message from a zod error. */
export function firstIssue(error: { issues: { message: string; path: PropertyKey[] }[] }): string {
  const issue = error.issues[0];
  if (!issue) return "Please check the form and try again.";
  const field = issue.path.length ? String(issue.path[0]) : "";
  return field ? `${field}: ${issue.message}` : issue.message;
}
