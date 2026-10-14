export function formatDueDate(dueDate: string, today = new Date()): string {
  const taskDate = new Date(`${dueDate}T00:00:00`);
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  const differenceInDays = Math.round(
    (taskDate.getTime() - todayDate.getTime()) / 86_400_000,
  );

  if (differenceInDays === 0) return "Today";
  if (differenceInDays === 1) return "Tomorrow";

  return taskDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
