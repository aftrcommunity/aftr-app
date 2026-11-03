// Shown the moment a tab is tapped, while the next screen loads
export default function Loading() {
  return (
    <main className="page page-loading" aria-busy="true" aria-label="Loading">
      <span className="spinner" />
    </main>
  );
}
