import { StickyHeader } from '../components/clarity-funnel/sticky-header';

export default function ClarityFunnelPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <StickyHeader />
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <div className="w-full lg:w-[45%]">
          {/* Left Column - Context Items and PRD Editor */}
          <div className="h-full min-h-[400px] bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Context & PRD</h2>
            <p className="text-gray-600">Context items and PRD editor will go here</p>
          </div>
        </div>
        <div className="w-full lg:w-[55%]">
          {/* Right Column - Task Board */}
          <div className="h-full min-h-[400px] bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Task Board</h2>
            <p className="text-gray-600">Task board will go here</p>
          </div>
        </div>
      </main>
    </div>
  );
}