export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sun/25 text-ink">
        <Icon size={26} />
      </span>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
