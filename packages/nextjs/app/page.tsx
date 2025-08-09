import { EnhancedMarketDashboard } from "~~/components/markets/EnhancedMarketDashboardNew";

// Server component using enhanced JSON-based data system with combined markets
export default async function Home() {
  return (
    <div className="min-h-screen bg-base-200">
      <EnhancedMarketDashboard />
    </div>
  );
}
