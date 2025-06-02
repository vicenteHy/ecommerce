// src/lib/dashboard-data.ts

// Define interfaces for data structures
export interface TimePoint { x: Date | string; y: number; }
export interface TimeSeries { id: string; data: TimePoint[]; }
export interface CountryOrders { country: string; orders: number; }
export interface AovSegment { id: string; label: string; value: number; }
export interface PageViews { page: string; views: number; }
export interface TimeOnPage { page: string; time: number; }
export interface SkuPurchases { sku: string; name: string; purchases: number; }
export interface SearchTerm { term: string; count: number; }
export interface FunnelStep { id: string; value: number; label: string; }

export type RawHourlyData = { id: string; data: { x: string; y: number }[] };

// --- Base Static Data Definitions ---
const yesterdayMultiplier = 0.85; // Comparison period multiplier (example)

const salesData: RawHourlyData[] = [
  { id: 'Sales', data: Array.from({ length: 24 }, (_, i) => ({ x: `${i}:00`, y: Math.floor(Math.random() * 2000 + 500) })) },
];
const ordersByCountryData: CountryOrders[] = [
  { country: 'USA', orders: Math.floor(Math.random() * 500 + 100) }, { country: 'China', orders: Math.floor(Math.random() * 400 + 150) },
  { country: 'Germany', orders: Math.floor(Math.random() * 300 + 50) }, { country: 'UK', orders: Math.floor(Math.random() * 250 + 70) },
  { country: 'Japan', orders: Math.floor(Math.random() * 200 + 60) }, { country: 'India', orders: Math.floor(Math.random() * 350 + 80) },
];
const aovDistributionData: AovSegment[] = [
  { id: '0-100', label: '¥0-100', value: Math.floor(Math.random() * 800 + 150) }, { id: '100-500', label: '¥100-500', value: Math.floor(Math.random() * 1000 + 200) },
  { id: '500-1000', label: '¥500-1000', value: Math.floor(Math.random() * 400 + 100) }, { id: '1000+', label: '¥1000+', value: Math.floor(Math.random() * 150 + 50) },
];
const dauData: RawHourlyData[] = [
  { id: 'DAU', data: Array.from({ length: 24 }, (_, i) => ({ x: `${i}:00`, y: Math.floor(Math.random() * 500 + 50) })) },
];
const conversionFunnelData: FunnelStep[] = [
  { id: '浏览', value: 100, label: '100%' }, { id: '加购', value: 45, label: '45%' },
  { id: '支付', value: 28, label: '28%' }, { id: '结账', value: 20, label: '20%' },
  { id: '购买', value: 12.5, label: '12.5%' },
];
const pageViewsByPageData: PageViews[] = [
  { page: '首页', views: 42650 }, { page: '商品列表', views: 28970 }, { page: '商品详情', views: 24500 },
  { page: '购物车', views: 15800 }, { page: '结算页', views: 9350 }, { page: '用户中心', views: 4408 },
];
const timeOnPageByPageData: TimeOnPage[] = [
  { page: '商品详情', time: 245 }, { page: '首页', time: 190 }, { page: '购物车', time: 175 },
  { page: '商品列表', time: 165 }, { page: '结算页', time: 150 }, { page: '用户中心', time: 120 },
];
const itemsPurchasedBySkuData: SkuPurchases[] = [
  { sku: '手机-001', name: 'iPhone Pro', purchases: 485 }, { sku: '电脑-003', name: 'MacBook Air', purchases: 326 },
  { sku: '家电-007', name: '智能电视', purchases: 258 }, { sku: '配件-021', name: '无线耳机', purchases: 203 },
  { sku: '电脑-015', name: '游戏本', purchases: 175 }, { sku: '配件-018', name: '充电宝', purchases: 143 },
];
const topSearchTermsData: SearchTerm[] = [
  { term: '手机', count: 1256 }, { term: '笔记本', count: 958 }, { term: '耳机', count: 784 },
  { term: '智能手表', count: 623 }, { term: '平板电脑', count: 592 }, { term: '充电器', count: 435 },
];

// --- Simulate Comparison Data ---
const salesDataYesterday: RawHourlyData[] = [{ id: 'SalesYesterday', data: salesData[0].data.map(d => ({ ...d, y: Math.floor(d.y * yesterdayMultiplier * (Math.random() * 0.3 + 0.85)) })) }];
const ordersByCountryDataYesterday: CountryOrders[] = ordersByCountryData.map(d => ({ ...d, orders: Math.floor(d.orders * yesterdayMultiplier * (Math.random() * 0.3 + 0.85)) }));
const dauDataYesterday: RawHourlyData[] = [{ id: 'DAUYesterday', data: dauData[0].data.map(d => ({ ...d, y: Math.floor(d.y * yesterdayMultiplier * (Math.random() * 0.3 + 0.85)) })) }];
const conversionFunnelYesterdayData: FunnelStep[] = [
  { id: '浏览', value: 100, label: '100%' }, { id: '加购', value: 42, label: '42%' },
  { id: '支付', value: 26, label: '26%' }, { id: '结账', value: 18, label: '18%' },
  { id: '购买', value: 11.8, label: '11.8%' },
];
const pageViewsByPageDataYesterday: PageViews[] = pageViewsByPageData.map(d => ({ ...d, views: Math.floor(d.views * yesterdayMultiplier * (Math.random() * 0.3 + 0.85)) }));
const timeOnPageByPageDataYesterday: TimeOnPage[] = timeOnPageByPageData.map(d => ({ ...d, time: Math.floor(d.time * (Math.random() * 0.2 + 0.9)) }));
const itemsPurchasedBySkuDataYesterday: SkuPurchases[] = itemsPurchasedBySkuData.map(d => ({ ...d, purchases: Math.floor(d.purchases * yesterdayMultiplier * (Math.random() * 0.3 + 0.85)) }));
const topSearchTermsDataYesterday: SearchTerm[] = topSearchTermsData.map(d => ({ ...d, count: Math.floor(d.count * (Math.random() * 0.3 + 0.8)) }));

// --- Nivo Chart Common Props ---
const commonLineProps = {
  margin: { top: 10, right: 10, bottom: 40, left: 40 },
  yScale: { type: 'linear' as const, min: 'auto' as const, max: 'auto' as const, stacked: false, reverse: false },
  axisTop: null,
  axisRight: null,
  axisBottom: { tickSize: 5, tickPadding: 5, tickRotation: 0, legendOffset: 36, legendPosition: 'middle' as const },
  axisLeft: { tickSize: 5, tickPadding: 5, tickRotation: 0, legendOffset: -40, legendPosition: 'middle' as const },
  pointColor: { theme: 'background' as const },
  useMesh: true,
  enableGridX: false,
  enableGridY: true,
};

const commonBarProps = {
  margin: { top: 5, right: 5, bottom: 35, left: 5 },
  padding: 0.2,
  innerPadding: 3,
  groupMode: 'grouped' as const,
  borderRadius: 5,
  valueScale: { type: 'linear' as const },
  indexScale: { type: 'band' as const, round: true, padding: 0.1 },
  borderColor: { from: 'color' },
  axisTop: null,
  axisRight: null,
  axisBottom: { tickSize: 5, tickPadding: 5, tickRotation: 0, legendPosition: 'middle' as const, legendOffset: 32 },
  axisLeft: null,
  labelSkipWidth: 12,
  labelSkipHeight: 12,
  labelTextColor: { from: 'color', modifiers: [['darker', 1.6] as ['darker', number]] },
  animate: true,
  enableGridY: false,
};

// --- Nivo Gradients and Fills ---
const gradientDefs = [
  { id: 'gradientCurrent', type: 'linearGradient' as const, colors: [{ offset: 0, color: '#6366f1' }, { offset: 100, color: '#a5b4fc' }] }, // Indigo-500 -> 300
  { id: 'gradientComparison', type: 'linearGradient' as const, colors: [{ offset: 0, color: '#a5b4fc' }, { offset: 100, color: '#e0e7ff' }] }, // Indigo-300 -> 100
  { id: 'gradientAOVLow', type: 'linearGradient' as const, colors: [{ offset: 0, color: '#a5b4fc' }, { offset: 100, color: '#c7d2fe' }] },
  { id: 'gradientAOVMedium', type: 'linearGradient' as const, colors: [{ offset: 0, color: '#818cf8' }, { offset: 100, color: '#a5b4fc' }] },
  { id: 'gradientAOVHigh', type: 'linearGradient' as const, colors: [{ offset: 0, color: '#6366f1' }, { offset: 100, color: '#818cf8' }] },
  { id: 'gradientAOVVeryHigh', type: 'linearGradient' as const, colors: [{ offset: 0, color: '#4f46e5' }, { offset: 100, color: '#6366f1' }] },
];

const barFill = [
  { match: { id: 'current' }, id: 'gradientCurrent' }, // Adjusted ID
  { match: { id: 'comparison' }, id: 'gradientComparison' }, // Adjusted ID
  { match: { id: 'today' }, id: 'gradientCurrent' }, // Keep old IDs for stable charts
  { match: { id: 'yesterday' }, id: 'gradientComparison' },
  { match: { id: '0-100' }, id: 'gradientAOVLow' },
  { match: { id: '100-500' }, id: 'gradientAOVMedium' },
  { match: { id: '500-1000' }, id: 'gradientAOVHigh' },
  { match: { id: '1000+' }, id: 'gradientAOVVeryHigh' },
];

// --- Data Aggregation Logic (Top Level) ---
const aggregateDataByTimeInterval = (rawData: RawHourlyData, intervalHours: number): { timeBlock: string; value: number }[] => {
    // ... (implementation remains the same)
    if (24 % intervalHours !== 0) { console.error("Interval must be a divisor of 24."); return []; }
    const numBlocks = 24 / intervalHours; const aggregated: { [key: string]: number } = {}; const timeBlocks: string[] = [];
    for (let i = 0; i < numBlocks; i++) { const startHour = i * intervalHours; const endHour = (i + 1) * intervalHours; const blockLabel = `${startHour}-${endHour}h`; aggregated[blockLabel] = 0; timeBlocks.push(blockLabel);}
    rawData.data.forEach((point: { x: string; y: number }) => { const hour = parseInt(point.x.split(':')[0], 10); const blockIndex = Math.floor(hour / intervalHours); const blockLabel = timeBlocks[blockIndex]; if (blockLabel) { aggregated[blockLabel] += point.y; }});
    return timeBlocks.map(blockLabel => ({ timeBlock: blockLabel, value: aggregated[blockLabel] }));
};

// --- Baseline Data Helper (Top Level) ---
const generateStaticBaselineData = (
    baseSalesData: RawHourlyData[], baseSalesDataYesterday: RawHourlyData[],
    baseOrdersByCountryData: CountryOrders[], baseOrdersByCountryDataYesterday: CountryOrders[],
    baseAovDistributionData: AovSegment[], baseDauData: RawHourlyData[], baseDauDataYesterday: RawHourlyData[],
    basePageViewsByPageData: PageViews[], basePageViewsByPageDataYesterday: PageViews[],
    baseTimeOnPageByPageData: TimeOnPage[], baseTimeOnPageByPageDataYesterday: TimeOnPage[],
    baseItemsPurchasedBySkuData: SkuPurchases[], baseItemsPurchasedBySkuDataYesterday: SkuPurchases[],
    baseTopSearchTermsData: SearchTerm[], baseTopSearchTermsDataYesterday: SearchTerm[],
    baseConversionFunnelData: FunnelStep[], baseConversionFunnelYesterdayData: FunnelStep[]
) => {
    // Calculate totals and combined data using passed base data with explicit types
    const totalSales = baseSalesData[0].data.reduce((sum: number, point: { y: number }) => sum + point.y, 0);
    const totalOrders = baseOrdersByCountryData.reduce((sum: number, item: { orders: number }) => sum + item.orders, 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalSalesYesterday = baseSalesDataYesterday[0].data.reduce((sum: number, point: { y: number }) => sum + point.y, 0);
    const salesChange = totalSalesYesterday > 0 ? ((totalSales / totalSalesYesterday) - 1) * 100 : (totalSales > 0 ? Infinity : 0);
    const totalOrdersYesterday = baseOrdersByCountryDataYesterday.reduce((sum: number, item: { orders: number }) => sum + item.orders, 0);
    const ordersChange = totalOrdersYesterday > 0 ? ((totalOrders / totalOrdersYesterday) - 1) * 100 : (totalOrders > 0 ? Infinity : 0);
    const averageOrderValueYesterday = totalOrdersYesterday > 0 ? totalSalesYesterday / totalOrdersYesterday : 0;
    const aovChange = averageOrderValueYesterday > 0 ? ((averageOrderValue / averageOrderValueYesterday) - 1) * 100 : (averageOrderValue > 0 ? Infinity : 0);
    const totalDAU = baseDauData[0].data.reduce((sum: number, point: { y: number }) => sum + point.y, 0);
    const totalDauYesterday = baseDauDataYesterday[0].data.reduce((sum: number, point: { y: number }) => sum + point.y, 0);
    const dauChange = totalDauYesterday > 0 ? ((totalDAU / totalDauYesterday) - 1) * 100 : (totalDAU > 0 ? Infinity : 0);
    const totalPageViews = basePageViewsByPageData.reduce((sum: number, item: { views: number }) => sum + item.views, 0);
    const totalPageViewsYesterday = basePageViewsByPageDataYesterday.reduce((sum: number, item: { views: number }) => sum + item.views, 0);
    const pageViewsChange = totalPageViewsYesterday > 0 ? ((totalPageViews / totalPageViewsYesterday) - 1) * 100 : (totalPageViews > 0 ? Infinity : 0);
    const avgTimeOnPage = baseTimeOnPageByPageData.length > 0 ? Math.round(baseTimeOnPageByPageData.reduce((sum: number, item: { time: number }) => sum + item.time, 0) / baseTimeOnPageByPageData.length) : 185;
    const avgTimeOnPageYesterday = baseTimeOnPageByPageDataYesterday.length > 0 ? Math.round(baseTimeOnPageByPageDataYesterday.reduce((sum: number, item: { time: number }) => sum + item.time, 0) / baseTimeOnPageByPageDataYesterday.length) : 192;
    const timeOnPageChange = avgTimeOnPageYesterday > 0 ? ((avgTimeOnPage / avgTimeOnPageYesterday) - 1) * 100 : (avgTimeOnPage > 0 ? Infinity : 0);
    const totalItemsPurchased = baseItemsPurchasedBySkuData.reduce((sum: number, item: { purchases: number }) => sum + item.purchases, 0);
    const totalItemsPurchasedYesterday = baseItemsPurchasedBySkuDataYesterday.reduce((sum: number, item: { purchases: number }) => sum + item.purchases, 0);
    const itemsPurchasedChange = totalItemsPurchasedYesterday > 0 ? ((totalItemsPurchased / totalItemsPurchasedYesterday) - 1) * 100 : (totalItemsPurchased > 0 ? Infinity : 0);
    const conversionRate = baseConversionFunnelData[baseConversionFunnelData.length - 1]?.value ?? 12.5;
    const conversionRateYesterday = baseConversionFunnelYesterdayData[baseConversionFunnelYesterdayData.length - 1]?.value ?? 11.8;
    const conversionChange = conversionRateYesterday > 0 ? ((conversionRate / conversionRateYesterday) - 1) * 100 : (conversionRate > 0 ? Infinity : 0);
    const totalSearches = baseTopSearchTermsData.reduce((sum: number, item: { count: number }) => sum + item.count, 0);
    const totalSearchesYesterday = baseTopSearchTermsDataYesterday.reduce((sum: number, item: { count: number }) => sum + item.count, 0);
    const searchesChange = totalSearchesYesterday > 0 ? ((totalSearches / totalSearchesYesterday) - 1) * 100 : (totalSearches > 0 ? Infinity : 0);

    // Aggregate and combine data for charts
    const aggregatedSalesData = aggregateDataByTimeInterval(baseSalesData[0], 2);
    const aggregatedSalesDataYesterday = aggregateDataByTimeInterval(baseSalesDataYesterday[0], 2);
    const aggregatedDauData = aggregateDataByTimeInterval(baseDauData[0], 4);
    const aggregatedDauDataYesterday = aggregateDataByTimeInterval(baseDauDataYesterday[0], 4);
    const combinedSalesData = aggregatedSalesData.map((today: { timeBlock: string; value: number }, index: number) => ({ timeBlock: today.timeBlock, today: today.value, yesterday: aggregatedSalesDataYesterday?.[index]?.value ?? 0 }));
    const lineChartSalesData = [
        { id: 'today', data: combinedSalesData.map((item: { timeBlock: string; today: number; }) => ({ x: `${item.timeBlock.split('-')[1]}`, y: item.today })) },
        { id: 'yesterday', data: combinedSalesData.map((item: { timeBlock: string; yesterday: number; }) => ({ x: `${item.timeBlock.split('-')[1]}`, y: item.yesterday })) }
    ];
    const countryLabelMap: Record<string, string> = { USA: 'US', China: 'CN', Germany: 'DE', UK: 'UK', Japan: 'JP', India: 'IN' };
    const combinedOrdersData = baseOrdersByCountryData.map((today: { country: string; orders: number }) => ({ country: countryLabelMap[today.country] ?? today.country, today: today.orders, yesterday: baseOrdersByCountryDataYesterday.find((y: { country: string; orders: number }) => y.country === today.country)?.orders ?? 0 }));
    const combinedDauData = aggregatedDauData.map((today: { timeBlock: string; value: number }, index: number) => ({ timeBlock: today.timeBlock, today: today.value, yesterday: aggregatedDauDataYesterday?.[index]?.value ?? 0 }));
    const totalAovOrders = baseAovDistributionData.reduce((sum: number, item: { value: number }) => sum + item.value, 0);
    const aovDataYesterday = baseAovDistributionData.map((item: { id: string; label: string; value: number }) => ({ ...item, value: Math.floor(item.value * yesterdayMultiplier * (Math.random() * 0.3 + 0.85)) }));
    const totalAovOrdersY = aovDataYesterday.reduce((sum: number, item: { value: number }) => sum + item.value, 0);
    const combinedAovData = baseAovDistributionData.map((today: { id: string; label: string; value: number }, i: number) => ({ label: today.label.replace('¥', ''), today: totalAovOrders > 0 ? parseFloat(((today.value / totalAovOrders) * 100).toFixed(1)) : 0, yesterday: totalAovOrdersY > 0 ? parseFloat(((aovDataYesterday?.[i]?.value / totalAovOrdersY) * 100).toFixed(1)) : 0 }));
    const combinedPageViewsData = basePageViewsByPageData.map((today: { page: string; views: number }, index: number) => ({ page: today.page, today: today.views, yesterday: basePageViewsByPageDataYesterday?.[index]?.views ?? 0 }));
    const combinedTimeOnPageData = baseTimeOnPageByPageData.map((today: { page: string; time: number }, index: number) => ({ page: today.page, today: today.time, yesterday: baseTimeOnPageByPageDataYesterday?.[index]?.time ?? 0 }));
    const combinedItemsPurchasedData = baseItemsPurchasedBySkuData.map((today: { sku: string; name: string; purchases: number }, index: number) => ({ skuName: `${today.name.slice(0, 6)}${today.name.length > 6 ? '..' : ''}`, today: today.purchases, yesterday: baseItemsPurchasedBySkuDataYesterday?.[index]?.purchases ?? 0, tooltip: `${today.name} (${today.sku})` }));
    const combinedSearchTermsData = baseTopSearchTermsData.map((today: { term: string; count: number }, index: number) => ({ term: today.term, today: today.count, yesterday: baseTopSearchTermsDataYesterday?.[index]?.count ?? 0 }));

    // Return calculated values explicitly
    return {
        totalSales, totalSalesYesterday, salesChange,
        totalOrders, totalOrdersYesterday, ordersChange,
        averageOrderValue, averageOrderValueYesterday, aovChange,
        totalDAU, totalDauYesterday, dauChange,
        totalPageViews, totalPageViewsYesterday, pageViewsChange,
        avgTimeOnPage, avgTimeOnPageYesterday, timeOnPageChange,
        totalItemsPurchased, totalItemsPurchasedYesterday, itemsPurchasedChange,
        conversionRate, conversionRateYesterday, conversionChange,
        totalSearches, totalSearchesYesterday, searchesChange,
        lineChartSalesData, combinedOrdersData, combinedAovData, combinedDauData,
        conversionFunnelData: baseConversionFunnelData, conversionFunnelYesterdayData: baseConversionFunnelYesterdayData,
        combinedTimeOnPageData, combinedItemsPurchasedData, combinedPageViewsData, combinedSearchTermsData
    };
};

// --- Dynamic Data Generation Helper (Top Level) ---
export const generateDataForRange = (range: string): DashboardData => {
    console.log(`Generating data for range: ${range}`);
    let daysInRange = 1;
    let comparisonLabel = "昨天";
    let currentLabel = "今天";
    let xAxisFormat = (d: Date | string) => {
        if (d instanceof Date) {
            return `${d.getMonth() + 1}/${d.getDate()}`;
        }
        const dateObj = new Date(d);
        return `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
    };
    let timeGranularity: 'hourly' | 'daily' | 'monthly' = 'hourly';

    const today = new Date();
    let startDateCurrent = new Date(today);
    let endDateCurrent = new Date(today);
    let startDateComparison = new Date(today);
    let endDateComparison = new Date(today);

    // --- Determine Date Ranges ---
    switch (range) {
        case 'last_7_days':
            daysInRange = 7;
            startDateCurrent.setDate(today.getDate() - 6); endDateCurrent = today;
            startDateComparison.setDate(startDateCurrent.getDate() - 7); endDateComparison.setDate(startDateCurrent.getDate() - 1);
            comparisonLabel = "上周期 (7天)"; currentLabel = "近7天"; timeGranularity = 'daily';
            xAxisFormat = (date: Date | string) => {
                if (date instanceof Date) {
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                }
                const dateObj = new Date(date);
                return `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
            };
            break;
        case 'last_30_days':
            daysInRange = 30;
            startDateCurrent.setDate(today.getDate() - 29); endDateCurrent = today;
            startDateComparison.setDate(startDateCurrent.getDate() - 30); endDateComparison.setDate(startDateCurrent.getDate() - 1);
            comparisonLabel = "上周期 (30天)"; currentLabel = "近30天"; timeGranularity = 'daily';
            xAxisFormat = (date: Date | string) => {
                if (date instanceof Date) {
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                }
                const dateObj = new Date(date);
                return `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
            };
            break;
        case 'last_6_months':
            daysInRange = 180; // Approx
            startDateCurrent = new Date(today.getFullYear(), today.getMonth() - 5, 1); endDateCurrent = today;
            startDateComparison = new Date(startDateCurrent.getFullYear(), startDateCurrent.getMonth() - 6, 1);
            endDateComparison = new Date(startDateCurrent.getFullYear(), startDateCurrent.getMonth(), 0); // Last day of previous month
            comparisonLabel = "上周期 (6个月)"; currentLabel = "近6个月"; timeGranularity = 'monthly';
            xAxisFormat = (date: Date | string) => {
                let month: number;
                if (date instanceof Date) {
                    month = date.getMonth() + 1;
                } else {
                     const dateObj = new Date(date);
                     // Handle potential invalid date string for robustness
                     month = !isNaN(dateObj.getTime()) ? dateObj.getMonth() + 1 : NaN;
                }
                 // Fallback for NaN month
                 if (isNaN(month)) {
                     return String(date); // Or return an empty string/placeholder
                 }
                 return String(month).padStart(2, '0'); // Format as MM
             };
            break;
        default: // 'today'
            startDateComparison.setDate(today.getDate() - 1); endDateComparison.setDate(today.getDate() - 1);
            // Set specific formatter for hourly strings used in 'today' view
            xAxisFormat = (val: Date | string) => typeof val === 'string' ? val : String(val); // Return the hourly string directly (e.g., "2h")
            timeGranularity = 'hourly'; // Ensure granularity is set
            break;
    }

    // --- Simulate Data Points ---
    let simulatedSalesCurrent: TimePoint[] = [];
    let simulatedSalesComparison: TimePoint[] = [];
    let simulatedDauCurrent: TimePoint[] = [];
    let simulatedDauComparison: TimePoint[] = [];
    // Add temporary storage for daily/monthly country orders
    let simulatedOrdersCurrent: { date: string; country: string; orders: number }[] = [];
    let simulatedOrdersComparison: { date: string; country: string; orders: number }[] = [];


    if (timeGranularity === 'hourly') {
        // ... (hourly simulation for sales and DAU remains the same)
        const aggSalesCurrent = aggregateDataByTimeInterval(salesData[0], 2);
        const aggSalesComparison = aggregateDataByTimeInterval(salesDataYesterday[0], 2);
        const aggDauCurrent = aggregateDataByTimeInterval(dauData[0], 4);
        const aggDauComparison = aggregateDataByTimeInterval(dauDataYesterday[0], 4);
        simulatedSalesCurrent = aggSalesCurrent.map(item => ({ x: `${item.timeBlock.split('-')[1]}`, y: item.value }));
        simulatedSalesComparison = aggSalesComparison.map(item => ({ x: `${item.timeBlock.split('-')[1]}`, y: item.value }));
        simulatedDauCurrent = aggDauCurrent.map(item => ({ x: item.timeBlock, y: item.value }));
        simulatedDauComparison = aggDauComparison.map(item => ({ x: item.timeBlock, y: item.value }));
        // For hourly, use base country data directly for aggregation later
        simulatedOrdersCurrent = ordersByCountryData.map(co => ({ date: 'today', ...co }));
        simulatedOrdersComparison = ordersByCountryDataYesterday.map(co => ({ date: 'yesterday', ...co }));

    } else if (timeGranularity === 'daily') {
        for (let i = 0; i < daysInRange; i++) {
            const dateCurrent = new Date(startDateCurrent); dateCurrent.setDate(startDateCurrent.getDate() + i);
            const dayOfWeek = dateCurrent.getDay();
            const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
            const baseDailySales = 3000 + Math.random() * 1500;
            const baseDailyDau = 500 + Math.random() * 250;

            simulatedSalesCurrent.push({ x: dateCurrent, y: Math.floor(baseDailySales * weekendMultiplier * (0.9 + Math.random() * 0.2)) });
            simulatedSalesComparison.push({ x: dateCurrent, y: Math.floor(baseDailySales * weekendMultiplier * yesterdayMultiplier * (0.85 + Math.random() * 0.3)) });

            simulatedDauCurrent.push({ x: dateCurrent, y: Math.floor(baseDailyDau * weekendMultiplier * (0.9 + Math.random() * 0.2)) });
            simulatedDauComparison.push({ x: dateCurrent, y: Math.floor(baseDailyDau * weekendMultiplier * yesterdayMultiplier * (0.85 + Math.random() * 0.3)) });

            const dateStrForOrders = dateCurrent.toISOString().split('T')[0];
            ordersByCountryData.forEach(countryBase => {
                const dailyOrders = Math.floor(countryBase.orders / 24 * (18 + Math.random() * 12) * weekendMultiplier); // Very rough daily simulation
                simulatedOrdersCurrent.push({ date: dateStrForOrders, country: countryBase.country, orders: Math.floor(dailyOrders * (0.9 + Math.random() * 0.2)) });
                simulatedOrdersComparison.push({ date: dateStrForOrders, country: countryBase.country, orders: Math.floor(dailyOrders * yesterdayMultiplier * (0.85 + Math.random() * 0.3)) });
            });
        }
    } else { // monthly
         const numMonths = Math.ceil(daysInRange / 30); // Use calculated months
         for (let i = 0; i < numMonths; i++) {
             const dateCurrent = new Date(startDateCurrent); dateCurrent.setMonth(startDateCurrent.getMonth() + i);
             const monthMultiplier = 1.0 + (i / (numMonths * 2)); // Simulate slight growth
             const baseMonthlySales = 90000 + Math.random() * 30000;
             const baseMonthlyDau = 15000 + Math.random() * 5000;

            simulatedSalesCurrent.push({ x: dateCurrent, y: Math.floor(baseMonthlySales * monthMultiplier * (0.95 + Math.random() * 0.1)) });
            simulatedSalesComparison.push({ x: dateCurrent, y: Math.floor(baseMonthlySales * monthMultiplier * yesterdayMultiplier * (0.9 + Math.random() * 0.2)) });

            simulatedDauCurrent.push({ x: dateCurrent, y: Math.floor(baseMonthlyDau * monthMultiplier * (0.95 + Math.random() * 0.1)) });
            simulatedDauComparison.push({ x: dateCurrent, y: Math.floor(baseMonthlyDau * monthMultiplier * yesterdayMultiplier * (0.9 + Math.random() * 0.2)) });

            const dateStrForOrders = `${dateCurrent.getFullYear()}-${String(dateCurrent.getMonth() + 1).padStart(2, '0')}-01`;
             ordersByCountryData.forEach(countryBase => {
                 const monthlyOrders = Math.floor(countryBase.orders * 28 * monthMultiplier * (0.8 + Math.random()*0.4)); // Rough monthly simulation
                 simulatedOrdersCurrent.push({ date: dateStrForOrders, country: countryBase.country, orders: Math.floor(monthlyOrders * (0.95 + Math.random() * 0.1)) });
                 simulatedOrdersComparison.push({ date: dateStrForOrders, country: countryBase.country, orders: Math.floor(monthlyOrders * yesterdayMultiplier * (0.9 + Math.random() * 0.2)) });
             });
        }
    }

    // --- Combine into Nivo format ---
    const lineChartSalesData: TimeSeries[] = [
        { id: 'current', data: simulatedSalesCurrent },
        { id: 'comparison', data: simulatedSalesComparison }
    ];
    const dauChartData = [{ id: 'current', data: simulatedDauCurrent }, { id: 'comparison', data: simulatedDauComparison }];
    const combinedDauData = simulatedDauCurrent.map((curr, index) => ({
      timeBlock: timeGranularity === 'hourly' ? curr.x : xAxisFormat(curr.x),
      current: curr.y,
      comparison: simulatedDauComparison[index].y
    }));

    // --- Aggregate Simulated Country Orders --- 
    const aggregateOrders = (simulatedData: { country: string; orders: number }[]) => {
        return simulatedData.reduce((acc, curr) => {
            acc[curr.country] = (acc[curr.country] || 0) + curr.orders;
            return acc;
        }, {} as Record<string, number>);
    };
    const aggregatedOrdersCurrent = aggregateOrders(simulatedOrdersCurrent);
    const aggregatedOrdersComparison = aggregateOrders(simulatedOrdersComparison);

    // --- Calculate Totals & Changes ---
    const totalSales = simulatedSalesCurrent.reduce((sum, pt) => sum + pt.y, 0);
    const totalSalesComparison = simulatedSalesComparison.reduce((sum, pt) => sum + pt.y, 0);
    const salesChange = totalSalesComparison > 0 ? ((totalSales / totalSalesComparison) - 1) * 100 : (totalSales > 0 ? Infinity : 0);
    const totalDAU = simulatedDauCurrent.reduce((sum, pt) => sum + pt.y, 0);
    const totalDauComparison = simulatedDauComparison.reduce((sum, pt) => sum + pt.y, 0);
    const dauChange = totalDauComparison > 0 ? ((totalDAU / totalDauComparison) - 1) * 100 : (totalDAU > 0 ? Infinity : 0);
    // Calculate total orders from aggregated simulated data
    const totalOrders = Object.values(aggregatedOrdersCurrent).reduce((sum, val) => sum + val, 0);
    const totalOrdersComparison = Object.values(aggregatedOrdersComparison).reduce((sum, val) => sum + val, 0);
    const ordersChange = totalOrdersComparison > 0 ? ((totalOrders / totalOrdersComparison) - 1) * 100 : Infinity;

    // --- Format Aggregated Country Orders for Bar Chart ---
    const countryLabelMap: Record<string, string> = { USA: 'US', China: 'CN', Germany: 'DE', UK: 'UK', Japan: 'JP', India: 'IN' };
    const combinedOrdersData = Object.keys(aggregatedOrdersCurrent).map(country => ({
        country: countryLabelMap[country] ?? country,
        current: aggregatedOrdersCurrent[country],
        comparison: aggregatedOrdersComparison[country]
    })).sort((a, b) => b.current - a.current); // Sort by current orders desc

    // --- Simulate/Aggregate other metrics based on range (Keep existing simple logic for now) ---
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const averageOrderValueComparison = totalOrdersComparison > 0 ? totalSalesComparison / totalOrdersComparison : 0;
    const aovChange = averageOrderValueComparison > 0 ? ((averageOrderValue / averageOrderValueComparison) - 1) * 100 : Infinity;
    const totalAovOrders = aovDistributionData.reduce((sum, item) => sum + item.value, 0);
    const aovDataYesterday = aovDistributionData.map(item => ({ ...item, value: Math.floor(item.value * yesterdayMultiplier * (Math.random() * 0.3 + 0.85)) }));
    const totalAovOrdersY = aovDataYesterday.reduce((sum, item) => sum + item.value, 0);
    const combinedAovData = aovDistributionData.map((currentSegment, i) => ({
        label: currentSegment.label.replace('¥', ''),
        current: totalAovOrders > 0 ? parseFloat(((currentSegment.value / totalAovOrders) * 100).toFixed(1)) : 0,
        comparison: totalAovOrdersY > 0 ? parseFloat(((aovDataYesterday[i].value / totalAovOrdersY) * 100).toFixed(1)) : 0,
    }));
    const conversionRate = conversionFunnelData[conversionFunnelData.length - 1]?.value ?? 0;
    const conversionRateComparison = conversionFunnelYesterdayData[conversionFunnelYesterdayData.length - 1]?.value ?? 0;
    const conversionChange = conversionRateComparison > 0 ? ((conversionRate / conversionRateComparison) - 1) * 100 : Infinity;
    const orderTotalRatio = totalOrders / ordersByCountryData.reduce((sum, i) => sum + i.orders, 0); // Ratio based on simulated totals vs base
    const orderComparisonRatio = totalOrdersComparison / ordersByCountryDataYesterday.reduce((sum, i) => sum + i.orders, 0);
    const totalPageViews = Math.floor(pageViewsByPageData.reduce((s,i)=>s+i.views,0) * (daysInRange * 0.9 + Math.random() * 0.2));
    const totalPageViewsComparison = Math.floor(pageViewsByPageDataYesterday.reduce((s,i)=>s+i.views,0) * (daysInRange * 0.9 + Math.random() * 0.2));
    const pageViewsChange = totalPageViewsComparison > 0 ? ((totalPageViews / totalPageViewsComparison)-1)*100 : Infinity;
    const combinedPageViewsData = pageViewsByPageData.map((today, index) => ({ page: today.page, current: Math.floor(today.views * orderTotalRatio), comparison: Math.floor(pageViewsByPageDataYesterday[index].views * orderComparisonRatio) }));
    const avgTimeOnPage = Math.round(timeOnPageByPageData.reduce((s, i)=>s+i.time, 0) / timeOnPageByPageData.length * (0.95 + Math.random()*0.1));
    const avgTimeOnPageComparison = Math.round(timeOnPageByPageDataYesterday.reduce((s, i)=>s+i.time, 0) / timeOnPageByPageDataYesterday.length * (0.95 + Math.random()*0.1));
    const timeOnPageChange = avgTimeOnPageComparison > 0 ? ((avgTimeOnPage / avgTimeOnPageComparison)-1)*100 : Infinity;
    const combinedTimeOnPageData = timeOnPageByPageData.map((today, index) => ({ page: today.page, current: Math.floor(today.time * (0.95 + Math.random()*0.1)), comparison: Math.floor(timeOnPageByPageDataYesterday[index].time * (0.95 + Math.random()*0.1)) }));
    const totalItemsPurchased = Math.floor(itemsPurchasedBySkuData.reduce((s, i)=>s+i.purchases,0) * (daysInRange * 0.9 + Math.random() * 0.2));
    const totalItemsPurchasedComparison = Math.floor(itemsPurchasedBySkuDataYesterday.reduce((s, i)=>s+i.purchases,0) * (daysInRange * 0.9 + Math.random() * 0.2));
    const itemsPurchasedChange = totalItemsPurchasedComparison > 0 ? ((totalItemsPurchased / totalItemsPurchasedComparison)-1)*100 : Infinity;
    const combinedItemsPurchasedData = itemsPurchasedBySkuData.map((today, index) => ({ skuName: `${today.name.slice(0, 6)}${today.name.length > 6 ? '..' : ''}`, current: Math.floor(today.purchases * orderTotalRatio), comparison: Math.floor(itemsPurchasedBySkuDataYesterday[index].purchases * orderComparisonRatio), tooltip: `${today.name} (${today.sku})` }));
    const totalSearches = Math.floor(topSearchTermsData.reduce((s, i)=>s+i.count,0) * (daysInRange * 0.9 + Math.random() * 0.2));
    const totalSearchesComparison = Math.floor(topSearchTermsDataYesterday.reduce((s, i)=>s+i.count,0) * (daysInRange * 0.9 + Math.random() * 0.2));
    const searchesChange = totalSearchesComparison > 0 ? ((totalSearches / totalSearchesComparison)-1)*100 : Infinity;
    const combinedSearchTermsData = topSearchTermsData.map((today, index) => ({ term: today.term, current: Math.floor(today.count * orderTotalRatio), comparison: Math.floor(topSearchTermsDataYesterday[index].count * orderComparisonRatio) }));

    return {
        // ... (return unchanged structure, but using newly calculated/simulated values)
        totalSales, totalSalesYesterday: totalSalesComparison, salesChange,
        totalOrders, totalOrdersYesterday: totalOrdersComparison, ordersChange,
        averageOrderValue, averageOrderValueYesterday: averageOrderValueComparison, aovChange,
        totalDAU, totalDauYesterday: totalDauComparison, dauChange,
        totalPageViews, totalPageViewsYesterday: totalPageViewsComparison, pageViewsChange,
        avgTimeOnPage, avgTimeOnPageYesterday: avgTimeOnPageComparison, timeOnPageChange,
        totalItemsPurchased, totalItemsPurchasedYesterday: totalItemsPurchasedComparison, itemsPurchasedChange,
        conversionRate, conversionRateYesterday: conversionRateComparison, conversionChange,
        totalSearches, totalSearchesYesterday: totalSearchesComparison, searchesChange,
        lineChartSalesData,
        combinedOrdersData, // Use dynamically aggregated country orders
        combinedAovData, // Keep static structure for now
        combinedDauData, // Use dynamically aggregated DAU formatted for bar chart
        dauChartData, // Raw DAU data for potential line chart
        conversionFunnelData, // Keep static structure for now
        conversionFunnelYesterdayData,
        combinedTimeOnPageData, // Use scaled data
        combinedItemsPurchasedData, // Use scaled data
        combinedPageViewsData, // Use scaled data
        combinedSearchTermsData, // Use scaled data
        commonLineProps, commonBarProps, gradientDefs, barFill,
        xAxisFormat,
        currentLabel,
        comparisonLabel,
        timeGranularity
    };
};

// Define the main data structure type
export interface DashboardData {
    totalSales: number; totalSalesYesterday: number; salesChange: number;
    totalOrders: number; totalOrdersYesterday: number; ordersChange: number;
    averageOrderValue: number; averageOrderValueYesterday: number; aovChange: number;
    totalDAU: number; totalDauYesterday: number; dauChange: number;
    totalPageViews: number; totalPageViewsYesterday: number; pageViewsChange: number;
    avgTimeOnPage: number; avgTimeOnPageYesterday: number; timeOnPageChange: number;
    totalItemsPurchased: number; totalItemsPurchasedYesterday: number; itemsPurchasedChange: number;
    conversionRate: number; conversionRateYesterday: number; conversionChange: number;
    totalSearches: number; totalSearchesYesterday: number; searchesChange: number;
    lineChartSalesData: TimeSeries[];
    combinedOrdersData: any[]; // Replace any with specific type later
    combinedAovData: any[]; // Replace any with specific type later
    combinedDauData: any[]; // Replace any with specific type later (for bar chart)
    dauChartData: TimeSeries[]; // Raw DAU data (for potential line chart)
    conversionFunnelData: FunnelStep[];
    conversionFunnelYesterdayData: FunnelStep[];
    combinedTimeOnPageData: any[]; // Replace any with specific type later
    combinedItemsPurchasedData: any[]; // Replace any with specific type later
    combinedPageViewsData: any[]; // Replace any with specific type later
    combinedSearchTermsData: any[]; // Replace any with specific type later
    commonLineProps: any; // Replace any with specific Nivo type
    commonBarProps: any; // Replace any with specific Nivo type
    gradientDefs: any[]; // Replace any
    barFill: any[]; // Replace any
    xAxisFormat: (d: Date | string) => string;
    currentLabel: string;
    comparisonLabel: string;
    timeGranularity: 'hourly' | 'daily' | 'monthly';
} 