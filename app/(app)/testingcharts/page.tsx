// "use client";

// import { BarChart } from "@/components/ui/bar-chart";
// import { HorizontalBarChart } from "@/components/ui/horizontal-bar-chart";
// import { LineChart } from "@/components/ui/line-chart";
// import { AreaChart } from "@/components/ui/area-chart";
// import { MultiLineChart } from "@/components/ui/multi-line-chart";
// import { GroupedBarChart } from "@/components/ui/grouped-bar-chart";
// import { StackedBarChart } from "@/components/ui/stacked-bar-chart";
// import { ComboChart } from "@/components/ui/combo-chart";
// import { PieChart } from "@/components/ui/pie-chart";
// import { DonutChart } from "@/components/ui/donut-chart";
// import { ScatterChart } from "@/components/ui/scatter-chart";
// import { BubbleChart } from "@/components/ui/bubble-chart";
// import { HeatmapChart } from "@/components/ui/heatmap-chart";
// import { FunnelChart } from "@/components/ui/funnel-chart";
// import { WaterfallChart } from "@/components/ui/waterfall-chart";
// import { GaugeChart } from "@/components/ui/gauge-chart";
// import { TreemapChart } from "@/components/ui/treemap-chart";

// // Sample data  line chart and area chart
// const monthlyData = [
//   { category: "Jan", value: 2400 },
//   { category: "Feb", value: 1398 },
//   { category: "Mar", value: 5800 },
//   { category: "Apr", value: 3908 },
//   { category: "May", value: 4800 },
//   { category: "Jun", value: 3800 },
//   { category: "Jul", value: 4300 },
// ];

// // Sample data  bar chart and horizontal bar chart
// const categoryData = [
//   { category: "Electronics", value: 12500 },
//   { category: "Clothing", value: 8900 },
//   { category: "Home & Garden", value: 7200 },
//   { category: "Sports", value: 5800 },
//   { category: "Books", value: 4200 },
// ];

// // Sample data  multi-line chart

// const multiLineData = [
//   { category: "Jan", sales: 2400, revenue: 1800, profit: 1200 },
//   { category: "Feb", sales: 1398, revenue: 1200, profit: 800 },
//   { category: "Mar", sales: 5800, revenue: 4500, profit: 2500 },
//   { category: "Apr", sales: 3908, revenue: 3200, profit: 2100 },
//   { category: "May", sales: 4800, revenue: 4000, profit: 2800 },
//   { category: "Jun", sales: 3800, revenue: 3100, profit: 2000 },
// ];

// // Sample data  grouped bar chart
// const groupedData = [
//   { category: "Q1", product_a: 2400, product_b: 1800, product_c: 1200 },
//   { category: "Q2", product_a: 1398, product_b: 2200, product_c: 1600 },
//   { category: "Q3", product_a: 4800, product_b: 3500, product_c: 2500 },
//   { category: "Q4", product_a: 3908, product_b: 4200, product_c: 3100 },
// ];

// const stackedData = [
//   { category: "2020", direct: 2400, organic: 1800, referral: 1200, social: 800 },
//   { category: "2021", direct: 1398, organic: 2200, referral: 1600, social: 1100 },
//   { category: "2022", direct: 3800, organic: 2500, referral: 1800, social: 1200 },
//   { category: "2023", direct: 3908, organic: 4200, referral: 3100, social: 2400 },
// ];

// const comboData = [
//   { category: "Jan", bars: 2400, line: 1800 },
//   { category: "Feb", bars: 1398, line: 1200 },
//   { category: "Mar", bars: 5800, line: 4500 },
//   { category: "Apr", bars: 3908, line: 3200 },
//   { category: "May", bars: 4800, line: 4000 },
//   { category: "Jun", bars: 3800, line: 3100 },
// ];

// const pieData = [
//   { category: "Electronics", value: 35 },
//   { category: "Clothing", value: 25 },
//   { category: "Home", value: 20 },
//   { category: "Sports", value: 12 },
//   { category: "Other", value: 8 },
// ];

// const donutData = [
//   { category: "Direct", value: 35 },
//   { category: "Organic", value: 30 },
//   { category: "Referral", value: 20 },
//   { category: "Social", value: 15 },
// ];

// const scatterData = [
//   { x: 10, y: 14 }, { x: 15, y: 20 }, { x: 20, y: 25 },
//   { x: 25, y: 22 }, { x: 30, y: 35 }, { x: 35, y: 30 },
//   { x: 40, y: 45 }, { x: 45, y: 40 }, { x: 50, y: 55 },
//   { x: 55, y: 48 }, { x: 60, y: 65 }, { x: 65, y: 58 },
// ];

// const bubbleData = [
//   { x: 10, y: 20, size: 15, category: "Product A" },
//   { x: 25, y: 35, size: 25, category: "Product B" },
//   { x: 40, y: 25, size: 40, category: "Product C" },
//   { x: 55, y: 50, size: 20, category: "Product D" },
//   { x: 70, y: 40, size: 35, category: "Product E" },
//   { x: 30, y: 55, size: 18, category: "Product F" },
// ];

// const heatmapData = [
//   { x: "Mon", y: "9AM", value: 20 }, { x: "Mon", y: "12PM", value: 45 },
//   { x: "Mon", y: "3PM", value: 60 }, { x: "Mon", y: "6PM", value: 35 },
//   { x: "Tue", y: "9AM", value: 30 }, { x: "Tue", y: "12PM", value: 55 },
//   { x: "Tue", y: "3PM", value: 70 }, { x: "Tue", y: "6PM", value: 40 },
//   { x: "Wed", y: "9AM", value: 25 }, { x: "Wed", y: "12PM", value: 50 },
//   { x: "Wed", y: "3PM", value: 80 }, { x: "Wed", y: "6PM", value: 45 },
//   { x: "Thu", y: "9AM", value: 35 }, { x: "Thu", y: "12PM", value: 65 },
//   { x: "Thu", y: "3PM", value: 75 }, { x: "Thu", y: "6PM", value: 50 },
//   { x: "Fri", y: "9AM", value: 40 }, { x: "Fri", y: "12PM", value: 70 },
//   { x: "Fri", y: "3PM", value: 55 }, { x: "Fri", y: "6PM", value: 30 },
// ];

// const funnelData = [
//   { category: "Visitors", value: 10000 },
//   { category: "Leads", value: 5000 },
//   { category: "Prospects", value: 2500 },
//   { category: "Opportunities", value: 1200 },
//   { category: "Customers", value: 600 },
// ];

// const waterfallData = [
//   { category: "Starting", value: 1000, type: "total" as const },
//   { category: "Sales", value: 500, type: "positive" as const },
//   { category: "Services", value: 300, type: "positive" as const },
//   { category: "Returns", value: -150, type: "negative" as const },
//   { category: "Marketing", value: -200, type: "negative" as const },
//   { category: "Operations", value: -100, type: "negative" as const },
//   { category: "Other", value: 100, type: "positive" as const },
//   { category: "Ending", value: 1450, type: "total" as const },
// ];

// const treemapData = {
//   name: "Root",
//   children: [
//     {
//       name: "Technology",
//       children: [
//         { name: "Software", value: 250 },
//         { name: "Hardware", value: 180 },
//         { name: "Services", value: 120 },
//       ],
//     },
//     {
//       name: "Finance",
//       children: [
//         { name: "Banking", value: 200 },
//         { name: "Insurance", value: 150 },
//       ],
//     },
//     {
//       name: "Healthcare",
//       children: [
//         { name: "Pharma", value: 180 },
//         { name: "Devices", value: 120 },
//       ],
//     },
//     {
//       name: "Retail",
//       children: [
//         { name: "E-commerce", value: 160 },
//         { name: "Stores", value: 100 },
//       ],
//     },
//   ],
// };

// export default function TestingChartsPage() {
//   return (
//     <div className="p-6 space-y-8">
//       <div>
//         <h1 className="text-2xl font-semibold text-gray-900 mb-2">
//           Charts  Gallery
//         </h1>
//         <p className="text-sm text-gray-500 mb-6">
//         Create and visualize your data with a variety of chart types.
//         </p>
//       </div>

//       {/* Line and Area Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Line Chart</h2>
//           <LineChart data={monthlyData} height={280} color="#7294D6" />
//         </div>
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Area Chart</h2>
//           <AreaChart data={monthlyData} height={280} color="#6A72D5" />
//         </div>
//       </div>

//       {/* Multi-Line Chart */}
//       <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//         <h2 className="text-lg font-medium text-gray-800 mb-4">Multi-Line Chart</h2>
//         <MultiLineChart 
//           data={multiLineData} 
//           height={320}
//           series={[
//             { field: "sales", name: "Sales", color: "#7BB5D8" },
//             { field: "revenue", name: "Revenue", color: "#9B6BD5" },
//             { field: "profit", name: "Profit", color: "#CD6FC9" },
//           ]}
//         />
//       </div>

//       {/* Bar Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Vertical Bar Chart</h2>
//           <BarChart data={monthlyData} height={280} />
//         </div>
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Horizontal Bar Chart</h2>
//           <HorizontalBarChart data={categoryData} height={280} />
//         </div>
//       </div>

//       {/* Grouped Bar Chart */}
//       <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//         <h2 className="text-lg font-medium text-gray-800 mb-4">Grouped Bar Chart</h2>
//         <GroupedBarChart 
//           data={groupedData} 
//           height={320}
//           series={[
//             { field: "product_a", name: "Product A", color: "#7BB5D8" },
//             { field: "product_b", name: "Product B", color: "#7D69D5" },
//             { field: "product_c", name: "Product C", color: "#CD6FA9" },
//           ]}
//         />
//       </div>

//       {/* Stacked Bar Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Stacked Bar (Vertical)</h2>
//           <StackedBarChart 
//             data={stackedData} 
//             height={320}
//             series={[
//               { field: "direct", name: "Direct", color: "#7BB5D8" },
//               { field: "organic", name: "Organic", color: "#6A72D5" },
//               { field: "referral", name: "Referral", color: "#9B6BD5" },
//               { field: "social", name: "Social", color: "#CD6FC9" },
//             ]}
//           />
//         </div>
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Stacked Bar (Horizontal)</h2>
//           <StackedBarChart 
//             data={stackedData} 
//             height={320}
//             horizontal={true}
//             series={[
//               { field: "direct", name: "Direct", color: "#7BB5D8" },
//               { field: "organic", name: "Organic", color: "#6A72D5" },
//               { field: "referral", name: "Referral", color: "#9B6BD5" },
//               { field: "social", name: "Social", color: "#CD6FC9" },
//             ]}
//           />
//         </div>
//       </div>

//       {/* Combo Chart */}
//       <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//         <h2 className="text-lg font-medium text-gray-800 mb-4">Combo Chart (Bar + Line)</h2>
//         <ComboChart 
//           data={comboData} 
//           height={320}
//           barColor="#7BB5D8"
//           lineColor="#CD6FC9"
//         />
//       </div>

//       {/* Pie and Donut Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Pie Chart</h2>
//           <PieChart data={pieData} height={320} />
//         </div>
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Donut Chart</h2>
//           <DonutChart 
//             data={donutData} 
//             height={320}
//           />
//         </div>
//       </div>

//       {/* Scatter and Bubble Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Scatter Chart</h2>
//           <ScatterChart 
//             data={scatterData} 
//             height={320}
//             color="#6A72D5"
//             xLabel="Revenue"
//             yLabel="Growth"
//           />
//         </div>
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Bubble Chart</h2>
//           <BubbleChart 
//             data={bubbleData} 
//             height={320}
//             xLabel="Revenue"
//             yLabel="Market Share"
//           />
//         </div>
//       </div>

//       {/* Heatmap Chart */}
//       <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//         <h2 className="text-lg font-medium text-gray-800 mb-4">Heatmap Chart</h2>
//         <HeatmapChart 
//           data={heatmapData} 
//           height={300}
//           lowColor="#e8f0fe"
//           highColor="#6A72D5"
//         />
//       </div>

//       {/* Funnel Chart */}
//       <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//         <h2 className="text-lg font-medium text-gray-800 mb-4">Funnel Chart</h2>
//         <FunnelChart data={funnelData} height={350} />
//       </div>

//       {/* Waterfall Chart */}
//       <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//         <h2 className="text-lg font-medium text-gray-800 mb-4">Waterfall Chart</h2>
//         <WaterfallChart data={waterfallData} height={350} />
//       </div>

//       {/* Gauge Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Gauge Chart</h2>
//           <GaugeChart value={72} label="Performance" height={250} />
//         </div>
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Gauge (Low)</h2>
//           <GaugeChart value={25} label="Engagement" height={250} />
//         </div>
//         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//           <h2 className="text-lg font-medium text-gray-800 mb-4">Gauge (High)</h2>
//           <GaugeChart value={92} label="Satisfaction" height={250} />
//         </div>
//       </div>

//       {/* Treemap Chart */}
//       <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//         <h2 className="text-lg font-medium text-gray-800 mb-4">Treemap Chart</h2>
//         <TreemapChart data={treemapData} height={400} />
//       </div>
//     </div>
//   );
// }

import React from 'react'

const hello = () => {
  return (
    <div>hello</div>
  )
}

export default hello