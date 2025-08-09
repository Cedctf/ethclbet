# 🎯 Expandable Card with Navigation - Usage Guide

## 🚀 **New Navigation Features**

The expandable card now supports clicking on titles to navigate to analysis pages or custom actions.

## 📝 **Usage Examples**

### **Method 1: Using ExpandableCardHeader with Navigation**

```tsx
import {
  ExpandableCard,
  ExpandableCardHeader,
  ExpandableCardContent,
  Expandable
} from "./ui/expandable-card";

function MarketCard() {
  return (
    <Expandable>
      <ExpandableCard>
        {/* Header with automatic navigation to analysis page */}
        <ExpandableCardHeader 
          navigateToAnalysis={true}
          analysisPath="/analysis/market-123"
        >
          <h3 className="text-lg font-semibold">ETH/USD Market Analysis</h3>
          <p className="text-sm text-gray-600">Click to view detailed analysis</p>
        </ExpandableCardHeader>
        
        <ExpandableCardContent>
          <p>Market details and expandable content here...</p>
        </ExpandableCardContent>
      </ExpandableCard>
    </Expandable>
  );
}
```

### **Method 2: Using ExpandableCardHeader with Custom Handler**

```tsx
import { useRouter } from "next/navigation";

function MarketCard() {
  const router = useRouter();
  
  const handleTitleClick = () => {
    // Custom logic before navigation
    console.log("Navigating to analysis...");
    router.push("/analysis/custom-path");
  };

  return (
    <Expandable>
      <ExpandableCard>
        <ExpandableCardHeader onTitleClick={handleTitleClick}>
          <h3 className="text-lg font-semibold cursor-pointer hover:text-blue-600">
            Custom Market Analysis
          </h3>
        </ExpandableCardHeader>
        
        <ExpandableCardContent>
          <p>Expandable content...</p>
        </ExpandableCardContent>
      </ExpandableCard>
    </Expandable>
  );
}
```

### **Method 3: Using the New ExpandableCardTitle Component**

```tsx
import {
  ExpandableCard,
  ExpandableCardHeader,
  ExpandableCardTitle,
  ExpandableCardContent,
  Expandable
} from "./ui/expandable-card";

function MarketCard() {
  return (
    <Expandable>
      <ExpandableCard>
        <ExpandableCardHeader>
          {/* Dedicated clickable title component */}
          <ExpandableCardTitle href="/analysis/market-456">
            BTC/USD Market Analysis
          </ExpandableCardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Click title to view analysis
          </p>
        </ExpandableCardHeader>
        
        <ExpandableCardContent>
          <p>Market data and charts...</p>
        </ExpandableCardContent>
      </ExpandableCard>
    </Expandable>
  );
}
```

### **Method 4: Mixed Content (Some Clickable, Some Not)**

```tsx
function MarketCard() {
  return (
    <Expandable>
      <ExpandableCard>
        <ExpandableCardHeader>
          {/* Clickable title */}
          <ExpandableCardTitle href="/analysis/market-789">
            <h3 className="text-lg font-semibold">DOGE/USD Analysis</h3>
          </ExpandableCardTitle>
          
          {/* Non-clickable subtitle */}
          <p className="text-sm text-gray-600 mt-1">
            Last updated: 2 hours ago
          </p>
          
          {/* Clickable secondary action */}
          <ExpandableCardTitle 
            href="/charts/doge-usd"
            className="text-sm text-blue-500 mt-2"
          >
            View Live Chart →
          </ExpandableCardTitle>
        </ExpandableCardHeader>
        
        <ExpandableCardContent>
          <div className="space-y-2">
            <p>Price: $0.08</p>
            <p>24h Change: +5.2%</p>
            <p>Volume: $1.2B</p>
          </div>
        </ExpandableCardContent>
      </ExpandableCard>
    </Expandable>
  );
}
```

## 🎨 **Styling Features**

### **Automatic Hover Effects**
- **ExpandableCardTitle**: Automatically adds hover effects (blue color, underline)
- **ExpandableCardHeader**: Adds hover opacity when navigation is enabled

### **Custom Styling**
```tsx
<ExpandableCardTitle 
  href="/analysis"
  className="text-xl font-bold text-purple-600 hover:text-purple-800"
>
  Custom Styled Title
</ExpandableCardTitle>
```

## 🔧 **Props Reference**

### **ExpandableCardHeader Props**
```tsx
interface ExpandableCardHeaderProps {
  onTitleClick?: () => void;           // Custom click handler
  navigateToAnalysis?: boolean;        // Auto-navigate to analysis
  analysisPath?: string;               // Analysis page path (default: "/analysis")
  className?: string;                  // Custom CSS classes
  children: React.ReactNode;           // Header content
}
```

### **ExpandableCardTitle Props**
```tsx
interface ExpandableCardTitleProps {
  href?: string;                       // Navigation path
  onTitleClick?: () => void;           // Custom click handler
  className?: string;                  // Custom CSS classes
  children: React.ReactNode;           // Title content
}
```

## 🎯 **Best Practices**

### **1. Use Semantic HTML**
```tsx
<ExpandableCardTitle href="/analysis">
  <h3>Market Title</h3>  {/* Proper heading hierarchy */}
</ExpandableCardTitle>
```

### **2. Provide Visual Feedback**
```tsx
<ExpandableCardHeader navigateToAnalysis={true}>
  <h3 className="flex items-center gap-2">
    Market Analysis
    <span className="text-xs text-gray-500">→ Click for details</span>
  </h3>
</ExpandableCardHeader>
```

### **3. Handle Loading States**
```tsx
const handleTitleClick = async () => {
  setLoading(true);
  await fetchAnalysisData();
  router.push("/analysis");
  setLoading(false);
};
```

## 🚀 **Ready to Use!**

The expandable card now supports:
- ✅ **Click-to-navigate** functionality
- ✅ **Custom click handlers** for complex logic
- ✅ **Automatic hover effects** for better UX
- ✅ **Flexible routing** with Next.js router
- ✅ **Semantic HTML** support
- ✅ **TypeScript** type safety

Perfect for market cards, analysis previews, and any expandable content that needs navigation! 🎉
