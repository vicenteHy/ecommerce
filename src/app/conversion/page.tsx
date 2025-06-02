'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveFunnel } from '@nivo/funnel';
import { ResponsiveSankey } from '@nivo/sankey';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import the data generation function and type
import { generateDataForRange, DashboardData } from '../../lib/dashboard-data';

export default function ConversionPage() {
  const [selectedRange, setSelectedRange] = useState<string>('today');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    // Generate data dynamically using the imported function
    const generatedData = generateDataForRange(selectedRange);
    setDashboardData(generatedData);
  }, [selectedRange]);

  if (!dashboardData) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Determine X axis scale type based on granularity
  const conversionXScale = dashboardData.timeGranularity === 'hourly'
    ? { type: 'point' as const }
    : dashboardData.timeGranularity === 'monthly'
      ? { type: 'time' as const, precision: 'month' as const }
      : { type: 'time' as const, precision: 'day' as const };

  // Define tick values and format based on granularity for conversion trends
  let conversionAxisBottom = { ...dashboardData.commonLineProps.axisBottom };

  if (dashboardData.timeGranularity === 'daily') {
    const currentSalesData = dashboardData.lineChartSalesData?.find(s => s.id === 'current')?.data ?? [];
    const dataLength = currentSalesData.length;

    // Set format for daily
    conversionAxisBottom.format = dashboardData.xAxisFormat;

    // Set tick values based on date range
    if (selectedRange === 'last_7_days' && dataLength > 0) {
      const dateTicks = currentSalesData
        .map(d => d.x)
        .filter((x): x is Date => x instanceof Date);
      const uniqueDateTicks = Array.from(new Set(dateTicks.map(d => d.getTime()))).map(t => new Date(t));
      conversionAxisBottom.tickValues = uniqueDateTicks;
    } else if (selectedRange === 'last_30_days') {
      conversionAxisBottom.tickValues = 'every 7 days';
    } else if (dataLength > 8) {
      conversionAxisBottom.tickValues = 'every 2 days';
    } else {
      delete conversionAxisBottom.tickValues;
    }
  } else if (dashboardData.timeGranularity === 'monthly') {
    // Set format for monthly
    conversionAxisBottom.format = dashboardData.xAxisFormat;

    // Set ticks based on unique Date objects
    const currentSalesData = dashboardData.lineChartSalesData?.find(s => s.id === 'current')?.data ?? [];
    const dateTicks = currentSalesData
      .map(d => d.x)
      .filter((x): x is Date => x instanceof Date);
    const uniqueDateTicks = Array.from(new Set(dateTicks.map(d => d.getTime()))).map(t => new Date(t));
    conversionAxisBottom.tickValues = uniqueDateTicks;
  } else { // hourly
    // Set format for hourly
    conversionAxisBottom.format = dashboardData.xAxisFormat;
    delete conversionAxisBottom.tickValues;
  }

  // Create conversion rate trend data (based on DAU data with modifications)
  const conversionRateTrendData = [
    {
      id: "当前转化率",
      data: dashboardData.dauChartData[0].data.map(item => ({
        x: item.x,
        y: typeof item.y === 'number' 
          ? (dashboardData.conversionRate + (Math.random() * 2 - 1)) // Add noise to conversion rate
          : 0
      }))
    },
    {
      id: "对比期转化率",
      data: dashboardData.dauChartData[1].data.map(item => ({
        x: item.x,
        y: typeof item.y === 'number' 
          ? (dashboardData.conversionRateYesterday + (Math.random() * 2 - 1)) // Add noise to conversion rate
          : 0
      }))
    }
  ];

  // Create page conversion rates data
  const pageConversionRatesData = [
    { page: '首页', conversionRate: 45, previousRate: 42 },
    { page: '产品列表页', conversionRate: 28, previousRate: 25 },
    { page: '产品详情页', conversionRate: 18, previousRate: 16 },
    { page: '购物车页', conversionRate: 15, previousRate: 13 },
    { page: '结算页', conversionRate: 12, previousRate: 10 },
  ].map(item => ({
    ...item,
    change: ((item.conversionRate / item.previousRate) - 1) * 100
  }));

  // Create conversion by source data
  const conversionBySourceData = [
    { source: '搜索引擎', visits: Math.round(dashboardData.totalDAU * 0.38), conversions: Math.round(dashboardData.totalDAU * 0.38 * 0.14) },
    { source: '直接访问', visits: Math.round(dashboardData.totalDAU * 0.25), conversions: Math.round(dashboardData.totalDAU * 0.25 * 0.12) },
    { source: '社交媒体', visits: Math.round(dashboardData.totalDAU * 0.18), conversions: Math.round(dashboardData.totalDAU * 0.18 * 0.08) },
    { source: '外部链接', visits: Math.round(dashboardData.totalDAU * 0.12), conversions: Math.round(dashboardData.totalDAU * 0.12 * 0.10) },
    { source: '邮件营销', visits: Math.round(dashboardData.totalDAU * 0.07), conversions: Math.round(dashboardData.totalDAU * 0.07 * 0.15) },
  ].map(item => ({
    ...item,
    conversionRate: (item.conversions / item.visits) * 100
  }));

  // Create user flow data for Sankey diagram
  const userFlowData = {
    nodes: [
      { id: 'HomePage', label: '首页' },
      { id: 'ProductList', label: '产品列表' },
      { id: 'ProductDetail', label: '产品详情' },
      { id: 'Cart', label: '购物车' },
      { id: 'Checkout', label: '结算页' },
      { id: 'Payment', label: '支付页' },
      { id: 'Exit1', label: '离开' },
      { id: 'Exit2', label: '离开' },
      { id: 'Exit3', label: '离开' },
      { id: 'Exit4', label: '离开' },
      { id: 'Exit5', label: '离开' },
    ],
    links: [
      // From HomePage
      { source: 'HomePage', target: 'ProductList', value: Math.round(dashboardData.totalDAU * 0.45) },
      { source: 'HomePage', target: 'ProductDetail', value: Math.round(dashboardData.totalDAU * 0.15) },
      { source: 'HomePage', target: 'Exit1', value: Math.round(dashboardData.totalDAU * 0.40) },
      
      // From ProductList
      { source: 'ProductList', target: 'ProductDetail', value: Math.round(dashboardData.totalDAU * 0.30) },
      { source: 'ProductList', target: 'Exit2', value: Math.round(dashboardData.totalDAU * 0.15) },
      
      // From ProductDetail
      { source: 'ProductDetail', target: 'Cart', value: Math.round(dashboardData.totalDAU * 0.25) },
      { source: 'ProductDetail', target: 'Exit3', value: Math.round(dashboardData.totalDAU * 0.20) },
      
      // From Cart
      { source: 'Cart', target: 'Checkout', value: Math.round(dashboardData.totalDAU * 0.20) },
      { source: 'Cart', target: 'Exit4', value: Math.round(dashboardData.totalDAU * 0.05) },
      
      // From Checkout
      { source: 'Checkout', target: 'Payment', value: Math.round(dashboardData.totalDAU * 0.15) },
      { source: 'Checkout', target: 'Exit5', value: Math.round(dashboardData.totalDAU * 0.05) },
    ]
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">转化数据</h1>
        <Select value={selectedRange} onValueChange={setSelectedRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择时间范围" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">今天</SelectItem>
            <SelectItem value="last_7_days">近7天</SelectItem>
            <SelectItem value="last_30_days">近30天</SelectItem>
            <SelectItem value="last_6_months">近6个月</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversion Overview Section */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">整体转化率 ({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {dashboardData.conversionRate.toFixed(1)}%
              {isFinite(dashboardData.conversionChange) && (
                <span className={`ml-2 text-xs font-medium ${dashboardData.conversionChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dashboardData.conversionChange >= 0 ? '+' : ''}{dashboardData.conversionChange.toFixed(1)}%
                  <span className="text-muted-foreground text-xs ml-1">(对比 {dashboardData.comparisonLabel})</span>
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">订单转化率 ({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {((dashboardData.totalOrders / dashboardData.totalDAU) * 100).toFixed(1)}%
              <span className={`ml-2 text-xs font-medium ${dashboardData.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.ordersChange >= 0 ? '+' : ''}{dashboardData.ordersChange.toFixed(1)}%
                <span className="text-muted-foreground text-xs ml-1">(对比 {dashboardData.comparisonLabel})</span>
              </span>
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">浏览商品转化率 ({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {Math.round(28 + (Math.random() * 5))}%
              <span className={`ml-2 text-xs font-medium ${Math.random() > 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.random() > 0.5 ? '+' : ''}{(Math.random() * 5).toFixed(1)}%
                <span className="text-muted-foreground text-xs ml-1">(对比 {dashboardData.comparisonLabel})</span>
              </span>
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">加购转化率 ({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {Math.round(20 + (Math.random() * 5))}%
              <span className={`ml-2 text-xs font-medium ${Math.random() > 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.random() > 0.5 ? '+' : ''}{(Math.random() * 5).toFixed(1)}%
                <span className="text-muted-foreground text-xs ml-1">(对比 {dashboardData.comparisonLabel})</span>
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Detailed Conversion Visualizations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* 1. Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">转化漏斗 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveFunnel
              data={dashboardData.conversionFunnelData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              valueFormat={value => `${value}%`}
              colors={['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']}
              borderWidth={2}
              labelColor={{ from: 'color', modifiers: [['darker', 3]] }}
              enableLabel={true}
              beforeSeparatorLength={20}
              beforeSeparatorOffset={10}
              afterSeparatorLength={20}
              afterSeparatorOffset={10}
              currentPartSizeExtension={10}
              currentBorderWidth={5}
              animate={true}
              motionConfig="gentle"
              isInteractive={true}
              tooltip={({ part }) => (
                <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                  <strong>{part.data.label}</strong>: {part.data.value}%
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* 2. Conversion Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">转化率趋势 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveLine
              key={`conversion-line-${dashboardData.timeGranularity}`}
              {...dashboardData.commonLineProps}
              data={conversionRateTrendData}
              colors={['#6366f1', '#a5b4fc']} // Current, Comparison
              lineWidth={2}
              enablePoints={dashboardData.timeGranularity !== 'monthly'}
              pointSize={dashboardData.timeGranularity === 'hourly' ? 6 : 4}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              enableGridX={false}
              enableGridY={true}
              xScale={conversionXScale}
              xFormat={dashboardData.timeGranularity === 'hourly' ? undefined :
                      "time:%Y-%m-%d"
              }
              yScale={{ type: 'linear', min: 0, max: 25 }}
              axisBottom={{
                ...conversionAxisBottom,
              }}
              axisLeft={{
                ...dashboardData.commonLineProps.axisLeft,
                format: v => `${v}%`,
              }}
              tooltip={({ point }) => (
                <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                  {point.data.yFormatted}%
                </div>
              )}
              legends={[
                {
                  anchor: 'top-right',
                  direction: 'column',
                  justify: false,
                  translateX: 0,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: 'left-to-right',
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  symbolBorderColor: 'rgba(0, 0, 0, .5)',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemBackground: 'rgba(0, 0, 0, .03)',
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
            />
          </CardContent>
        </Card>

        {/* 3. User Conversion Path (Sankey Diagram) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">用户转化路径 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveSankey
              data={userFlowData}
              margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
              align="justify"
              colors={{ scheme: 'category10' }}
              nodeOpacity={1}
              nodeHoverOpacity={1}
              nodeThickness={18}
              nodeSpacing={24}
              nodeBorderWidth={0}
              nodeBorderColor={{
                from: 'color',
                modifiers: [['darker', 0.8]]
              }}
              linkOpacity={0.5}
              linkHoverOpacity={0.8}
              linkHoverOthersOpacity={0.1}
              linkContract={3}
              enableLinkGradient={true}
              labelPosition="outside"
              labelOrientation="horizontal"
              labelPadding={16}
              labelTextColor={{
                from: 'color',
                modifiers: [['darker', 1]]
              }}
              tooltip={({ node }) => (
                <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                  <strong>{node.label}</strong>: {node.value} 用户
                </div>
              )}
              nodeTooltip={({ node }) => (
                <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                  <strong>{node.label}</strong>: {node.value} 用户
                </div>
              )}
              linkTooltip={({ link }) => (
                <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                  <strong>{link.source.label}</strong> → <strong>{link.target.label}</strong>: {link.value} 用户
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* 4. Page Conversion Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">各页面转化率 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveBar
              {...dashboardData.commonBarProps}
              data={pageConversionRatesData}
              keys={['conversionRate', 'previousRate']}
              indexBy="page"
              margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
              padding={0.3}
              defs={dashboardData.gradientDefs}
              fill={[
                { match: { id: 'conversionRate' }, id: 'gradientCurrent' },
                { match: { id: 'previousRate' }, id: 'gradientComparison' }
              ]}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                format: v => `${v}%`,
              }}
              enableLabel={true}
              labelFormat={value => `${value}%`}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'top-right',
                  direction: 'column',
                  justify: false,
                  translateX: 0,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              tooltip={({ id, value, indexValue }) => (
                <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                  <strong>{indexValue}</strong><br />
                  {id === 'conversionRate' ? '当前' : '对比期'}: {value}%
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* 5. Conversion by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">各来源转化率 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">来源</th>
                    <th className="text-left pb-2">访问数</th>
                    <th className="text-left pb-2">转化数</th>
                    <th className="text-left pb-2">转化率</th>
                  </tr>
                </thead>
                <tbody>
                  {conversionBySourceData.map((source, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3">{source.source}</td>
                      <td className="py-3">{source.visits.toLocaleString()}</td>
                      <td className="py-3">{source.conversions.toLocaleString()}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span>{source.conversionRate.toFixed(1)}%</span>
                          <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${source.conversionRate * 3}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 6. Conversion Improvement Opportunities */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">转化率优化建议</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-4 hover:bg-gray-50">
                <h3 className="text-sm font-medium mb-2">产品详情页优化</h3>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">产品详情页跳出率较高，建议优化以下方面：</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>添加更多产品图片</li>
                    <li>优化产品描述</li>
                    <li>突出用户评价</li>
                  </ul>
                  <p className="text-xs mt-2 text-green-600">预计提升转化率：1.5%</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 hover:bg-gray-50">
                <h3 className="text-sm font-medium mb-2">结算流程简化</h3>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">从购物车到下单流程中流失较多，建议：</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>减少结账步骤</li>
                    <li>提供游客结账选项</li>
                    <li>优化表单体验</li>
                  </ul>
                  <p className="text-xs mt-2 text-green-600">预计提升转化率：2.1%</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 hover:bg-gray-50">
                <h3 className="text-sm font-medium mb-2">社交媒体流量转化</h3>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">社交媒体访客转化率较低，建议：</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>针对性着陆页设计</li>
                    <li>社交媒体专属优惠</li>
                    <li>简化注册流程</li>
                  </ul>
                  <p className="text-xs mt-2 text-green-600">预计提升转化率：1.8%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}