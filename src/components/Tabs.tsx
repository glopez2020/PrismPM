import { type ReactNode, useState } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTab, className = "" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={className}>
      <div className="flex border-b border-navy-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150
              border-b-2 -mb-px
              ${activeTab === tab.id
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-navy-500 hover:text-navy-700 hover:border-navy-300"
              }
            `}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className={`
                rounded-full px-2 py-0.5 text-xs font-medium
                ${activeTab === tab.id
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-navy-100 text-navy-600"
                }
              `}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {activeContent}
      </div>
    </div>
  );
}