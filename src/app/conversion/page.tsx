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
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";

// 定义转化漏斗数据接口
interface FunnelStepData {
  step: string;
  users: number;
  conversion_rate: string;
}

interface FunnelData {
  funnel_steps: FunnelStepData[];
  start_date: string;
  end_date: string;
}

interface FunnelComparisonData {
  current: FunnelData;
  previous: FunnelData;
  comparison: {
    steps: Array<{
      step: string;
      change_rate: number;
      change_amount: number;
    }>;
  };
}

export default function ConversionPage() {
  const [selectedRange, setSelectedRange] = useState<string>('today');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  // 新增转化漏斗数据状态
  const [funnelData, setFunnelData] = useState<FunnelComparisonData | null>(null);
  // 新增日期范围选择状态
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const [dateRange, setDateRange] = useState<DateRange>({from: thirtyDaysAgo, to: today});
  // 新增错误状态
  const [error, setError] = useState<string | null>(null);

  // 格式化日期为 YYYY-MM-DD 格式（UTC时区）
  const formatDate = (date: Date): string => {
    try {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (err) {
      console.error('格式化日期错误:', err);
      // 返回一个备用格式
      return date.toISOString().split('T')[0];
    }
  };

  // 获取后端转化漏斗数据
  const fetchFunnelData = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/traffic/conversion-funnel/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('请求转化漏斗数据URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }
      
      const textData = await response.text();
      let data;
      try {
        data = JSON.parse(textData);
      } catch (parseError) {
        console.error('解析转化漏斗数据JSON失败:', parseError);
        return;
      }
      
      console.log('转化漏斗数据:', data);
      
      // 检查数据格式
      const isValidData = data && typeof data === 'object' && 'current' in data && 'previous' in data && 'comparison' in data;
      
      if (isValidData) {
        setFunnelData(data);
      } else {
        console.log('转化漏斗数据格式不正确');
      }
    } catch (err) {
      console.error('获取转化漏斗数据错误:', err);
    }
  };

  // 处理转化漏斗数据转换为Nivo格式
  const processFunnelData = (data: FunnelComparisonData) => {
    if (!data || !data.current || !data.current.funnel_steps) return null;
    
    // 转换API数据为Nivo漏斗图格式，只取前4个步骤
    return data.current.funnel_steps.slice(0, 4).map((step, index) => {
      // 计算转化率百分比
      let conversionRate: number;
      if (step.conversion_rate === '-' || step.conversion_rate === '') {
        // 第一步默认为100%
        conversionRate = 100;
      } else {
        // 移除百分号并转换为数字
        conversionRate = parseFloat(step.conversion_rate.replace('%', ''));
      }
      
      return {
        id: step.step.replace(/^\d+\./, ''), // 移除步骤前面的数字前缀
        value: conversionRate,
        label: `${conversionRate}%`
      };
    });
  };

  // 从转化漏斗数据中提取卡片数据
  const getFunnelCardsData = () => {
    if (!funnelData || !funnelData.current || !funnelData.current.funnel_steps) {
      // 返回默认数据
      return [
        { title: '访问商品页', rate: 0, change: 0 },
        { title: '浏览商品详情', rate: 0, change: 0 },
        { title: '添加购物车', rate: 0, change: 0 },
        { title: '进入结算', rate: 0, change: 0 }
      ];
    }

    // 只取前4个步骤
    return funnelData.current.funnel_steps.slice(0, 4).map((step, index) => {
      const currentRate = step.conversion_rate === '-' || step.conversion_rate === '' 
        ? 100 
        : parseFloat(step.conversion_rate.replace('%', ''));
      
      // 从比较数据中获取变化率
      const comparison = funnelData.comparison?.steps?.find(s => s.step === step.step);
      const changeRate = comparison ? comparison.change_rate : 0;
      
      return {
        title: step.step.replace(/^\d+\./, ''), // 移除步骤前面的数字前缀
        rate: currentRate,
        change: changeRate
      };
    });
  };

  useEffect(() => {
    // Generate data dynamically using the imported function
    const generatedData = generateDataForRange(selectedRange);
    setDashboardData(generatedData);
    
    // 根据选择的范围设置日期（UTC时区）
    const now = new Date();
    let from = new Date();
    let to = new Date();
    
    switch (selectedRange) {
      case 'last_7_days':
        from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0));
        to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
        break;
      case 'last_30_days':
        from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29, 0, 0, 0));
        to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
        break;
      case 'last_6_months':
        from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1, 0, 0, 0));
        to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
        break;
      default: // 'today'
        // 对于今天，使用今天的UTC 0点到23:59
        from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
        break;
    }
    
    setDateRange({from, to} as DateRange);
    fetchFunnelData(from, to);
  }, [selectedRange]);
  
  // 处理日期范围变更
  const handleDateRangeChange = (range: DateRange) => {
    if (range.from && range.to) {
      // 检查日期范围是否合理
      if (range.from > range.to) {
        setError('起始日期不能大于结束日期');
        return;
      }
      
      // 将本地时间转换为UTC时间
      const utcFrom = new Date(Date.UTC(
        range.from.getFullYear(),
        range.from.getMonth(),
        range.from.getDate(),
        0, 0, 0
      ));
      const utcTo = new Date(Date.UTC(
        range.to.getFullYear(),
        range.to.getMonth(),
        range.to.getDate(),
        23, 59, 59
      ));
      
      setDateRange(range);
      setError(null); // 清除之前的错误提示
      fetchFunnelData(utcFrom, utcTo);
    }
  };

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
        <div className="flex gap-4 items-center">
          {/* 添加日期选择器 */}
          <DateRangePicker 
            dateRange={dateRange} 
            onRangeChange={(range) => {
              // 只更新UI状态，不发送请求
              setDateRange(range);
            }} 
            placeholder="选择日期范围"
            onConfirm={(range) => {
              // 检查日期范围是否合理
              if (range.from > range.to) {
                setError('起始日期不能大于结束日期');
                return;
              }
              
              // 检查是否选择了未来日期
              const now = new Date();
              if (range.from > now) {
                setError('开始日期不能是未来日期，请选择当前或过去的日期');
                return;
              }
              
              if (range.to > now) {
                // 如果结束日期是未来，调整为今天（UTC时区）
                const adjustedRange: DateRange = {
                  from: range.from,
                  to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59))
                };
                setDateRange(adjustedRange);
                handleDateRangeChange(adjustedRange);
              } else {
                // 发送请求
                handleDateRangeChange(range);
              }
            }}
          />
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
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {/* Conversion Overview Section */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {getFunnelCardsData().map((cardData, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{cardData.title} ({dashboardData.currentLabel})</CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground flex items-center">
                {cardData.rate.toFixed(1)}%
                {isFinite(cardData.change) && (
                  <span className={`ml-2 text-xs font-medium ${cardData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cardData.change >= 0 ? '+' : ''}{cardData.change.toFixed(1)}%
                    <span className="text-muted-foreground text-xs ml-1">(对比 {dashboardData.comparisonLabel})</span>
                  </span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
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
              data={funnelData ? processFunnelData(funnelData) : dashboardData.conversionFunnelData}
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
              tooltip={({ part }) => {
                // 查找对应的原始数据以显示用户数
                const stepData = funnelData.current.funnel_steps.find(
                  step => step.step.replace(/^\d+\./, '') === part.data.id
                );
                return (
                  <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                    <strong>{part.data.id}</strong><br/>
                    转化率: {part.data.value}%<br/>
                    用户数: {stepData?.users.toLocaleString() || 0}
                  </div>
                )}
              }
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

      </div>
    </div>
  );
}