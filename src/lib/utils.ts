
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}
