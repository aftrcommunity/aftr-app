// Placeholder for screens that are designed but not built yet.
export default function Soon({ title, intro, next }: { title: string; intro: string; next: string }) {
  return (
    <main className="page">
      <h1 className="display">{title}</h1>
      <p className="muted intro">{intro}</p>
      <div className="soon">
        <div className="label">Coming in the beta</div>
        <p>{next}</p>
      </div>
    </main>
  );
}
