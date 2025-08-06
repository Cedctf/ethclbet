import { EnhancedMarketDashboard } from "~~/components/markets/EnhancedMarketDashboard";

// Server component using enhanced JSON-based data system with combined markets
export default async function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedMarketDashboard />
    </div>
  );
}
