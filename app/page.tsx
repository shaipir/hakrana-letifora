import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(#7c5cfc 1px, transparent 1px), linear-gradient(90deg, #7c5cfc 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Hero */}
      <div className="relative z-10 text-center max-w-2xl">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Beta
        </div>

        <h1 className="text-5xl font-bold mb-4 leading-tight">
          הקרנה{' '}
          <span className="text-accent">לתפאורה</span>
        </h1>

        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
          כלי Projection Mapping מקצועי לתפאורה, הופעות ואמנות.
          <br />
          Warp, Mask, Layers, Effects — הכל בדפדפן.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/editor"
            className="px-8 py-4 bg-accent hover:bg-accent-hover rounded-xl text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-accent/25"
          >
            פתח Editor
          </Link>
          <a
            href="https://github.com/shaipir/hakrana-letifora"
            target="_blank"
            className="px-8 py-4 border border-border hover:border-muted rounded-xl text-gray-300 font-semibold text-lg transition-all duration-200"
          >
            GitHub
          </a>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {['Corner Pin', 'Warp', 'Dual Channels', 'Mask & Cut', 'Real-time FX', 'Video Import', 'Projector Output'].map(f => (
            <span key={f} className="px-3 py-1 rounded-full bg-surface border border-border text-gray-400 text-sm">
              {f}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
