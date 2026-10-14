export default function WorkspaceLoading() {
  return (
    <main
      id="dashboard"
      aria-busy="true"
      aria-label="Loading your workspace"
      className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10"
    >
      <div className="mx-auto max-w-[1320px] animate-pulse motion-reduce:animate-none">
        <span className="sr-only">Loading your projects and tasks...</span>
        <div className="mb-8 h-24 rounded-xl bg-slate-100" />
        <div className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-36 rounded-xl bg-slate-100" />
          ))}
        </div>
        <div className="mb-4 h-6 w-40 rounded bg-slate-100" />
        <div className="h-56 rounded-xl bg-slate-100" />
      </div>
    </main>
  );
}
