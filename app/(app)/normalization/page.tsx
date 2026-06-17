"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Building2, Briefcase } from "lucide-react";
import { SalesRepNormalization } from "@/components/normalization/salesrep-normalization";
import { CustomerNormalization } from "@/components/normalization/customer-normalization";
import { RepAgencyNormalization } from "@/components/normalization/repagency-normalization";

type TabType = "salesrep" | "repagency" | "customer";

export default function NormalizationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("customer");

  const tabs = [
    {
      id: "customer" as const,
      label: "Customers",
      icon: Building2,
    },
    {
      id: "repagency" as const,
      label: "Rep Agencies",
      icon: Briefcase,
    },
    {
      id: "salesrep" as const,
      label: "Sales Representatives",
      icon: Users,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle bg-card">
        <div className="flex items-center justify-between mb-3">
          {/* Left: Title + Description */}
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold text-text-primary">
              Data Normalization
            </h1>
            <p className="text-xs text-text-tertiary">
              Standardize and clean your sales and customer data
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg  text-sm font-medium transition-all ${
                  isActive
                    ? "text-text-primary bg-background border shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-hover"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-background border border-border-mid rounded-lg -z-10"
                    transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {activeTab === "salesrep" ? (
            <SalesRepNormalization />
          ) : activeTab === "repagency" ? (
            <RepAgencyNormalization />
          ) : (
            <CustomerNormalization />
          )}
        </motion.div>
      </div>
    </div>
  );
}
