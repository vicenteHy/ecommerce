'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveFunnel } from '@nivo/funnel';
// Import the data generation function and type
import { generateDataForRange, DashboardData } from '../../lib/dashboard-data';
import { DateTimeSelector } from "@/components/date-time-selector";

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

// 定义产品转化率数据接口
interface ProductConversionData {
  rank: number;
  product_id: string;
  product_name: string;
  viewed_users: number;
  purchased_users: number;
  conversion_rate: number;
}

interface ProductConversionResponse {
  data: ProductConversionData[];
  summary: {
    start_date: string;
    end_date: string;
    total_products: number;
    avg_conversion_rate: number;
    total_viewed_users: number;
    total_purchased_users: number;
  };
}

interface ProductConversionComparison {
  product_id: string;
  product_name: string;
  sku_image: string;
  current_conversion_rate: number;
  previous_conversion_rate: number;
  rate_change: number;
  current_viewed_users: number;
  previous_viewed_users: number;
  current_purchased_users: number;
  previous_purchased_users: number;
  rank: number;
}

// 定义产品转化率趋势数据接口
interface ConversionTrendDaily {
  date: string;
  viewed_users: number;
  purchased_users: number;
  conversion_rate: number;
}

interface ConversionTrendPeriod {
  daily_data: ConversionTrendDaily[];
  summary: {
    avg_conversion_rate: number;
    total_viewed_users: number;
    total_purchased_users: number;
  };
}

interface ConversionTrendComparison {
  current: ConversionTrendPeriod;
  previous: ConversionTrendPeriod;
  comparison: {
    avg_conversion_rate_change: number;
    avg_conversion_rate_change_rate: number;
    total_viewed_change: number;
    total_purchased_change: number;
  };
}

export default function ConversionPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  // 新增转化漏斗数据状态
  const [funnelData, setFunnelData] = useState<FunnelComparisonData | null>(null);
  // 新增产品转化率数据状态
  const [productConversionData, setProductConversionData] = useState<ProductConversionResponse | null>(null);
  // 新增产品转化率对比数据状态
  const [productComparisonData, setProductComparisonData] = useState<ProductConversionComparison[] | null>(null);
  // 新增日期范围状态，用于显示
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({from: new Date(), to: new Date()});
  // 新增错误状态
  const [error, setError] = useState<string | null>(null);
  // 新增图片预览状态
  const [previewImage, setPreviewImage] = useState<{url: string; name: string} | null>(null);
  // 新增产品转化率趋势数据状态
  const [conversionTrendData, setConversionTrendData] = useState<ConversionTrendComparison | null>(null);

  // 格式化日期为 YYYY-MM-DD 格式
  const formatDate = (date: Date): string => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
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

  // 获取产品转化率数据
  const fetchProductConversionData = async (from: Date, to: Date) => {
    try {
      // 获取产品转化率数据
      const url = `http://localhost:8000/product/conversion-rate?start_date=${formatDate(from)}&end_date=${formatDate(to)}&limit=10`;
      console.log('请求产品转化率数据URL:', url);
      
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
      
      const data = await response.json();
      console.log('产品转化率数据:', data);
      setProductConversionData(data);
      
      // 获取产品转化率对比数据
      const comparisonUrl = `http://localhost:8000/product/conversion-rate/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}&limit=10`;
      const comparisonResponse = await fetch(comparisonUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (comparisonResponse.ok) {
        const comparisonData = await comparisonResponse.json();
        console.log('产品转化率对比数据:', comparisonData);
        setProductComparisonData(comparisonData.comparison || []);
      }
    } catch (err) {
      console.error('获取产品转化率数据错误:', err);
    }
  };

  // 获取产品转化率趋势数据
  const fetchConversionTrendData = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/product/conversion-trend/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('请求产品转化率趋势数据URL:', url);
      
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
      
      const data = await response.json();
      console.log('产品转化率趋势数据:', data);
      setConversionTrendData(data);
    } catch (err) {
      console.error('获取产品转化率趋势数据错误:', err);
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

  // 处理日期范围变更的回调函数
  const handleDateRangeChange = (from: Date, to: Date) => {
    setDateRange({from, to});
    console.log('日期范围变更:', {from: formatDate(from), to: formatDate(to)});
    
    // 计算时间范围以确定要生成的数据类型
    const daysDiff = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    let rangeType = 'today';
    if (daysDiff <= 1) {
      rangeType = 'today';
    } else if (daysDiff <= 7) {
      rangeType = 'last_7_days';
    } else if (daysDiff <= 30) {
      rangeType = 'last_30_days';
    } else {
      rangeType = 'last_6_months';
    }
    
    // Generate data dynamically using the imported function
    const generatedData = generateDataForRange(rangeType);
    setDashboardData(generatedData);
    
    // 获取转化漏斗数据
    fetchFunnelData(from, to);
    // 获取产品转化率数据
    fetchProductConversionData(from, to);
    // 获取产品转化率趋势数据
    fetchConversionTrendData(from, to);
  };

  // 初始化时设置默认数据
  useEffect(() => {
    const generatedData = generateDataForRange('today');
    setDashboardData(generatedData);
    // 获取今天的数据
    const today = new Date();
    fetchProductConversionData(today, today);
    fetchConversionTrendData(today, today);
  }, []);

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
    const daysDiff = Math.floor((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7 && dataLength > 0) {
      const dateTicks = currentSalesData
        .map(d => d.x)
        .filter((x): x is Date => x instanceof Date);
      const uniqueDateTicks = Array.from(new Set(dateTicks.map(d => d.getTime()))).map(t => new Date(t));
      conversionAxisBottom.tickValues = uniqueDateTicks;
    } else if (daysDiff <= 30) {
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

  // Process conversion trend data for the chart
  const processConversionTrendData = () => {
    if (!conversionTrendData) {
      // Return empty data if no real data available
      return [
        {
          id: "当前转化率",
          data: []
        },
        {
          id: "对比期转化率",
          data: []
        }
      ];
    }

    // Process real data
    const currentData = conversionTrendData.current.daily_data.map(item => ({
      x: new Date(item.date),
      y: item.conversion_rate
    }));

    const previousData = conversionTrendData.previous.daily_data.map(item => ({
      x: new Date(item.date),
      y: item.conversion_rate
    }));

    return [
      {
        id: "当前转化率",
        data: currentData
      },
      {
        id: "对比期转化率",
        data: previousData
      }
    ];
  };

  const conversionRateTrendData = processConversionTrendData();


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


  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{'转化数据'}</h1>
        <DateTimeSelector 
          onDateRangeChange={handleDateRangeChange}
          defaultRange="today"
        />
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
              <CardTitle className="text-sm font-medium text-muted-foreground">{cardData.title}</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">转化漏斗</CardTitle>
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
                const stepData = funnelData?.current?.funnel_steps?.find(
                  step => step.step.replace(/^\d+\./, '') === part.data.id
                );
                return (
                  <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                    <strong>{part.data.id}</strong><br/>
                    转化率: {part.data.value}%<br/>
                    用户数: {stepData?.users.toLocaleString() || 0}
                  </div>
                )
              }}
            />
          </CardContent>
        </Card>

        {/* 2. Conversion by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">各来源转化率</CardTitle>
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

        {/* 3. Conversion Rate Trend - Expanded */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              转化率趋势
              {conversionTrendData && (
                <span className="ml-2 text-xs text-gray-500">
                  平均转化率: {conversionTrendData.current.summary.avg_conversion_rate.toFixed(2)}%
                  <span className={`ml-2 ${conversionTrendData.comparison.avg_conversion_rate_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {conversionTrendData.comparison.avg_conversion_rate_change >= 0 ? '+' : ''}{conversionTrendData.comparison.avg_conversion_rate_change.toFixed(2)}%
                  </span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {/* 检查是否有数据 */}
            {!conversionTrendData || conversionTrendData.current.daily_data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-lg mb-2">暂无转化率趋势数据</div>
                <div className="text-sm">请选择日期范围查看数据</div>
              </div>
            ) : conversionTrendData.current.daily_data.length === 1 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-6xl font-bold text-black mb-4">
                  {conversionTrendData.current.daily_data[0].conversion_rate.toFixed(2)}%
                </div>
                <div className="text-xl text-gray-600 mb-2">
                  今日转化率
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div>
                    浏览用户: {conversionTrendData.current.daily_data[0].viewed_users.toLocaleString()}
                  </div>
                  <div>
                    购买用户: {conversionTrendData.current.daily_data[0].purchased_users.toLocaleString()}
                  </div>
                </div>
                {conversionTrendData.comparison && conversionTrendData.comparison.avg_conversion_rate_change !== 0 && (
                  <div className={`mt-4 text-lg font-medium ${
                    conversionTrendData.comparison.avg_conversion_rate_change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {conversionTrendData.comparison.avg_conversion_rate_change >= 0 ? '↑' : '↓'} 
                    {' '}{Math.abs(conversionTrendData.comparison.avg_conversion_rate_change).toFixed(2)}%
                    <span className="text-sm text-gray-500 ml-2">环比</span>
                  </div>
                )}
              </div>
            ) : (
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
                yScale={{ 
                  type: 'linear', 
                  min: 0, 
                  max: conversionTrendData 
                    ? Math.max(
                        ...conversionTrendData.current.daily_data.map(d => d.conversion_rate),
                        ...conversionTrendData.previous.daily_data.map(d => d.conversion_rate)
                      ) * 1.2 
                    : 25 
                }}
                axisBottom={{
                  ...conversionAxisBottom,
                }}
                axisLeft={{
                  ...dashboardData.commonLineProps.axisLeft,
                  format: v => `${v}%`,
                }}
                tooltip={({ point }) => {
                  const dateStr = point.data.x instanceof Date 
                    ? point.data.x.toLocaleDateString('zh-CN')
                    : String(point.data.x);
                  const value = typeof point.data.y === 'number' ? point.data.y.toFixed(2) : '0';
                  
                  return (
                    <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                      <strong>{point.serieId}</strong><br/>
                      日期: {dateStr}<br/>
                      转化率: {value}%
                    </div>
                  );
                }}
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
            )}
          </CardContent>
        </Card>

        {/* 4. Product Conversion Rates */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              产品转化率排行
              {productConversionData && (
                <span className="ml-2 text-xs text-gray-500">
                  平均转化率: {productConversionData.summary.avg_conversion_rate.toFixed(1)}%
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 pr-4">排名</th>
                    <th className="text-left pb-2 pr-2">图片</th>
                    <th className="text-left pb-2">产品名称</th>
                    <th className="text-right pb-2 pr-4">浏览量</th>
                    <th className="text-right pb-2 pr-4">购买量</th>
                    <th className="text-right pb-2 pr-4">转化率</th>
                    <th className="text-right pb-2">环比变化</th>
                  </tr>
                </thead>
                <tbody>
                  {productConversionData?.data.map((product, index) => {
                    // 查找对应的对比数据
                    const comparisonItem = productComparisonData?.find(
                      item => item.product_id === product.product_id
                    );
                    return (
                      <tr key={product.product_id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                            product.rank <= 3 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {product.rank}
                          </span>
                        </td>
                        <td className="py-3 pr-2">
                          {comparisonItem?.sku_image && (
                            <img 
                              src={comparisonItem.sku_image} 
                              alt={product.product_name}
                              className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setPreviewImage({url: comparisonItem.sku_image, name: product.product_name})}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder.png';
                              }}
                            />
                          )}
                        </td>
                        <td className="py-3">
                          <div className="max-w-xs truncate" title={product.product_name}>
                            {product.product_name}
                          </div>
                          <div className="text-xs text-gray-500">ID: {product.product_id}</div>
                        </td>
                        <td className="py-3 text-right pr-4">{product.viewed_users.toLocaleString()}</td>
                        <td className="py-3 text-right pr-4">{product.purchased_users.toLocaleString()}</td>
                        <td className="py-3 text-right pr-4">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-medium">{product.conversion_rate.toFixed(1)}%</span>
                            <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full transition-all" 
                                style={{ width: `${Math.min(product.conversion_rate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          {comparisonItem && (
                            <div className="flex items-center justify-end gap-2">
                              <span className={`text-sm font-medium ${
                                comparisonItem.rate_change >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {comparisonItem.rate_change >= 0 ? '+' : ''}{comparisonItem.rate_change.toFixed(1)}%
                              </span>
                              {comparisonItem.rate_change !== 0 && (
                                <span className={`text-xs ${
                                  comparisonItem.rate_change >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {comparisonItem.rate_change >= 0 ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          )}
                          {!comparisonItem && <span className="text-gray-400 text-sm">--</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {(!productConversionData || productConversionData.data.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        暂无产品转化率数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {productConversionData && productConversionData.summary && (
                <div className="mt-4 pt-4 border-t flex justify-between text-sm text-gray-600">
                  <div>总产品数: {productConversionData.summary.total_products}</div>
                  <div>总浏览用户: {productConversionData.summary.total_viewed_users.toLocaleString()}</div>
                  <div>总购买用户: {productConversionData.summary.total_purchased_users.toLocaleString()}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 图片预览模态框 */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            {previewImage && (
              <img 
                src={previewImage.url} 
                alt={previewImage.name}
                className="max-w-full max-h-[70vh] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.png';
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}