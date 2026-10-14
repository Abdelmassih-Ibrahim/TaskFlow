export function formatDueDate(dueDate: string, today = new Date()): string {
  const taskDate = new Date(`${dueDate}T00:00:00`);
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  const differenceInDays = Math.round(
    (taskDate.getTime() - todayDate.getTime()) / 86_400_000,
  );

  if (differenceInDays === 0) return "Idag";
  if (differenceInDays === 1) return "Imorgon";

  return taskDate.toLocaleDateString("sv-SE", {
    month: "short",
    day: "numeric",
  });
}
