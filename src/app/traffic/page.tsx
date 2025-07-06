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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

// Import the data generation function and type
import { generateDataForRange, DashboardData } from '../../lib/dashboard-data';

// Define active users API response interface
interface DailyActiveUsersData {
  date: string;
  active_users: number;
}

interface ActiveUsersData {
  active_users: number;
  start_date: string;
  end_date: string;
  daily_data?: DailyActiveUsersData[];
}

interface ActiveUsersComparisonData {
  current: ActiveUsersData;
  previous: ActiveUsersData;
  comparison: {
    change_rate: number;
    change_amount: number;
  };
}

// 定义页面浏览量数据接口
interface PageViewData {
  page_name: string;
  page_views: number;
  percentage: string;
}

interface PageViewsData {
  pages: PageViewData[];
  total_page_views: number;
  start_date: string;
  end_date: string;
}

interface PageViewsComparisonData {
  current: PageViewsData;
  previous: PageViewsData;
  comparison: {
    total_change_rate: number;
    total_change_amount: number;
    pages: Array<{
      page_name: string;
      change_rate: number;
      change_amount: number;
    }>;
  };
}

// 定义设备类型数据接口
interface DeviceTypeData {
  total: number;
  ios: number;
  android: number;
  ios_percentage: string;
  android_percentage: string;
  start_date: string;
  end_date: string;
}

export default function TrafficPage() {
  const [selectedRange, setSelectedRange] = useState<string>('today');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  // 新增活跃用户数据状态
  const [activeUsersData, setActiveUsersData] = useState<ActiveUsersComparisonData | null>(null);
  // 新增页面浏览量数据状态
  const [pageViewsData, setPageViewsData] = useState<PageViewsComparisonData | null>(null);
  // 新增设备类型数据状态
  const [deviceTypeData, setDeviceTypeData] = useState<DeviceTypeData | null>(null);

  // 格式化日期为 YYYY-MM-DD 格式（UTC时区）
  const formatDate = (date: Date): string => {
    try {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (err) {
      console.error('格式化日期错误:', err);
      return date.toISOString().split('T')[0];
    }
  };

  // 获取后端活跃用户数据
  const fetchActiveUsersData = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/traffic/active-users/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('请求活跃用户数据URL:', url);
      
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
        console.error('解析活跃用户数据JSON失败:', parseError);
        return;
      }
      
      console.log('活跃用户数据:', data);
      
      // 检查数据格式
      const isValidData = data && typeof data === 'object' && 'current' in data && 'previous' in data && 'comparison' in data;
      
      if (isValidData) {
        setActiveUsersData(data);
      } else {
        console.log('活跃用户数据格式不正确');
      }
    } catch (err) {
      console.error('获取活跃用户数据错误:', err);
    }
  };

  // 获取后端页面浏览量数据
  const fetchPageViewsData = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/traffic/page-views/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}&limit=5`;
      console.log('请求页面浏览量数据URL:', url);
      
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
        console.error('解析页面浏览量数据JSON失败:', parseError);
        return;
      }
      
      console.log('页面浏览量数据:', data);
      
      // 检查数据格式
      const isValidData = data && typeof data === 'object' && 'current' in data && 'previous' in data && 'comparison' in data;
      
      if (isValidData) {
        setPageViewsData(data);
      } else {
        console.log('页面浏览量数据格式不正确');
      }
    } catch (err) {
      console.error('获取页面浏览量数据错误:', err);
    }
  };

  // 获取后端设备类型数据
  const fetchDeviceTypeData = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/traffic/device-type?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('请求设备类型数据URL:', url);
      
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
        console.error('解析设备类型数据JSON失败:', parseError);
        return;
      }
      
      console.log('设备类型数据:', data);
      
      // 检查数据格式
      const isValidData = data && typeof data === 'object' && 
                         'total' in data && 'ios' in data && 'android' in data && 
                         'ios_percentage' in data && 'android_percentage' in data;
      
      if (isValidData) {
        setDeviceTypeData(data);
      } else {
        console.log('设备类型数据格式不正确');
      }
    } catch (err) {
      console.error('获取设备类型数据错误:', err);
    }
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
    
    fetchActiveUsersData(from, to);
    fetchPageViewsData(from, to);
    fetchDeviceTypeData(from, to);
  }, [selectedRange]);

  if (!dashboardData) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Calculate dynamic Y-axis max for pageViews chart
  let maxPageViewValue = 0;
  dashboardData.combinedPageViewsData.forEach(item => {
    if (item.current > maxPageViewValue) maxPageViewValue = item.current;
    if (item.comparison > maxPageViewValue) maxPageViewValue = item.comparison;
  });

  // Helper function to calculate a "nice" upper bound for the Y axis
  const calculateYMax = (maxValue: number): number => {
    if (maxValue <= 0) return 500; // Default max if no positive data

    // Determine a step based on the magnitude of the max value
    let step = 100;
    if (maxValue > 10000) {
      step = 1000;
    } else if (maxValue > 1000) {
      step = 500;
    }

    let ceilValue = Math.ceil(maxValue / step) * step;

    // Ensure the calculated max is strictly greater than the data max
    if (ceilValue <= maxValue) {
      ceilValue += step;
    }
    // Ensure minimum ceiling gap if max value is too close to ceiling
    if (maxValue > ceilValue * 0.95) {
      ceilValue += step;
    }

    return ceilValue;
  };

  const pageViewsYScaleMax = calculateYMax(maxPageViewValue);
  
  // Determine X axis scale type based on granularity
  const visitsXScale = dashboardData.timeGranularity === 'hourly'
    ? { type: 'point' as const }
    : dashboardData.timeGranularity === 'monthly'
      ? { type: 'time' as const, precision: 'month' as const }
      : { type: 'time' as const, precision: 'day' as const };

  // Define tick values and format based on granularity for visits chart X-axis
  let visitsAxisBottom = { ...dashboardData.commonLineProps.axisBottom };

  if (dashboardData.timeGranularity === 'daily') {
    const currentDauData = dashboardData.dauChartData?.find(s => s.id === 'current')?.data ?? [];
    const dataLength = currentDauData.length;

    // Set format for daily
    visitsAxisBottom.format = dashboardData.xAxisFormat;

    // Set tick values based on date range
    if (selectedRange === 'last_7_days' && dataLength > 0) {
      const dateTicks = currentDauData
        .map(d => d.x)
        .filter((x): x is Date => x instanceof Date);
      const uniqueDateTicks = Array.from(new Set(dateTicks.map(d => d.getTime()))).map(t => new Date(t));
      visitsAxisBottom.tickValues = uniqueDateTicks;
    } else if (selectedRange === 'last_30_days') {
      visitsAxisBottom.tickValues = 'every 7 days';
    } else if (dataLength > 8) {
      visitsAxisBottom.tickValues = 'every 2 days';
    } else {
      delete visitsAxisBottom.tickValues;
    }
  } else if (dashboardData.timeGranularity === 'monthly') {
    // Set format for monthly
    visitsAxisBottom.format = dashboardData.xAxisFormat;

    // Set ticks based on unique Date objects
    const currentDauData = dashboardData.dauChartData?.find(s => s.id === 'current')?.data ?? [];
    const dateTicks = currentDauData
      .map(d => d.x)
      .filter((x): x is Date => x instanceof Date);
    const uniqueDateTicks = Array.from(new Set(dateTicks.map(d => d.getTime()))).map(t => new Date(t));
    visitsAxisBottom.tickValues = uniqueDateTicks;
  } else { // hourly
    // Set format for hourly
    visitsAxisBottom.format = dashboardData.xAxisFormat;
    delete visitsAxisBottom.tickValues;
  }

  // Create traffic source data
  const trafficSourceData = [
    { source: '搜索引擎', value: Math.round(dashboardData.totalPageViews * 0.38) },
    { source: '直接访问', value: Math.round(dashboardData.totalPageViews * 0.25) },
    { source: '社交媒体', value: Math.round(dashboardData.totalPageViews * 0.18) },
    { source: '外部链接', value: Math.round(dashboardData.totalPageViews * 0.12) },
    { source: '邮件营销', value: Math.round(dashboardData.totalPageViews * 0.07) },
  ];

  // Create device distribution data
  const deviceData = deviceTypeData ? [
    { 
      id: 'iOS', 
      label: 'iOS', 
      value: parseFloat(deviceTypeData.ios_percentage.replace('%', '')), 
      color: '#6366f1',
      count: deviceTypeData.ios
    },
    { 
      id: 'Android', 
      label: 'Android', 
      value: parseFloat(deviceTypeData.android_percentage.replace('%', '')), 
      color: '#a5b4fc',
      count: deviceTypeData.android
    },
  ] : [
    { id: 'iOS', label: 'iOS', value: 21.56, color: '#6366f1', count: 0 },
    { id: 'Android', label: 'Android', value: 66.59, color: '#a5b4fc', count: 0 },
  ];

  // Create browser distribution data
  const browserData = [
    { browser: 'Chrome', value: Math.round(dashboardData.totalDAU * 0.62) },
    { browser: 'Safari', value: Math.round(dashboardData.totalDAU * 0.18) },
    { browser: '微信浏览器', value: Math.round(dashboardData.totalDAU * 0.09) },
    { browser: 'Firefox', value: Math.round(dashboardData.totalDAU * 0.06) },
    { browser: 'Edge', value: Math.round(dashboardData.totalDAU * 0.04) },
    { browser: '其他', value: Math.round(dashboardData.totalDAU * 0.01) },
  ];

  // Calculate bounce rate and average session metrics
  const bounceRate = 35 + Math.floor(Math.random() * 10); // 35-45%
  const bounceRateChange = Math.floor(Math.random() * 10) - 5; // -5 to +5%

  const avgSessionDuration = 180 + Math.floor(Math.random() * 60); // 3-4 min in seconds
  const avgSessionDurationChange = Math.floor(Math.random() * 20) - 10; // -10 to +10%

  // Create user behavior data
  const userBehaviorData = [
    {
      id: "页面浏览",
      data: dashboardData.dauChartData[0].data.map(item => ({
        x: item.x,
        y: typeof item.y === 'number' ? Math.round(item.y * (Math.random() * 1.2 + 2.8)) : 0 // ~4 pages per user
      }))
    },
    {
      id: "留存率",
      data: dashboardData.dauChartData[0].data.map(item => ({
        x: item.x,
        y: typeof item.y === 'number' ? (100 - bounceRate) + (Math.random() * 10 - 5) : 0 // 100% - bounce rate with noise
      }))
    }
  ];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">流量数据</h1>
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

      {/* Traffic Overview Section */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">访问人数 ({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {activeUsersData && activeUsersData.current ? (
                <>
                  {activeUsersData.current.active_users.toLocaleString()}
                  {activeUsersData.comparison && isFinite(activeUsersData.comparison.change_rate) && (
                    <span className={`ml-2 text-xs font-medium ${activeUsersData.comparison.change_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {activeUsersData.comparison.change_rate >= 0 ? '+' : ''}{activeUsersData.comparison.change_rate.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {dashboardData.totalDAU.toLocaleString()}
                  {isFinite(dashboardData.dauChange) && (
                    <span className={`ml-2 text-xs font-medium ${dashboardData.dauChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.dauChange >= 0 ? '+' : ''}{dashboardData.dauChange.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(对比 {dashboardData.comparisonLabel})</span>
                    </span>
                  )}
                </>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">页面浏览量 ({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {pageViewsData && pageViewsData.current ? (
                <>
                  {pageViewsData.current.total_page_views.toLocaleString()}
                  {pageViewsData.comparison && isFinite(pageViewsData.comparison.total_change_rate) && (
                    <span className={`ml-2 text-xs font-medium ${pageViewsData.comparison.total_change_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pageViewsData.comparison.total_change_rate >= 0 ? '+' : ''}{pageViewsData.comparison.total_change_rate.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {dashboardData.totalPageViews.toLocaleString()}
                  {isFinite(dashboardData.pageViewsChange) && (
                    <span className={`ml-2 text-xs font-medium ${dashboardData.pageViewsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.pageViewsChange >= 0 ? '+' : ''}{dashboardData.pageViewsChange.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(对比 {dashboardData.comparisonLabel})</span>
                    </span>
                  )}
                </>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">留存率 ({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {100 - bounceRate}%
              <span className={`ml-2 text-xs font-medium ${bounceRateChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {bounceRateChange <= 0 ? '+' : ''}{-bounceRateChange}%
                <span className="text-muted-foreground text-xs ml-1">(对比 {dashboardData.comparisonLabel})</span>
              </span>
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">平均会话时长 ({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {Math.floor(avgSessionDuration / 60)}分{avgSessionDuration % 60}秒
              <span className={`ml-2 text-xs font-medium ${avgSessionDurationChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {avgSessionDurationChange >= 0 ? '+' : ''}{avgSessionDurationChange}%
                <span className="text-muted-foreground text-xs ml-1">(对比 {dashboardData.comparisonLabel})</span>
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Detailed Traffic Visualizations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* 1. Visits Over Time */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">访问趋势 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {/* 使用真实API数据（访问人数和访问趋势图表共享同一接口数据） */}
            {activeUsersData && activeUsersData.current && activeUsersData.current.daily_data ? (
              <ResponsiveLine
                key={`visits-line-real-data`}
                data={[
                  {
                    id: '当前时段',
                    data: activeUsersData.current.daily_data.map(item => ({
                      x: new Date(item.date),
                      y: item.active_users
                    }))
                  },
                  {
                    id: '对比时段',
                    data: (activeUsersData.previous.daily_data || []).map(item => ({
                      x: new Date(item.date),
                      y: item.active_users
                    }))
                  }
                ]}
                colors={['#6366f1', '#a5b4fc']}
                lineWidth={2}
                enablePoints={true}
                pointSize={4}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                useMesh={true}
                enableGridX={false}
                enableGridY={true}
                xScale={{ type: 'time', precision: 'day' }}
                xFormat="time:%Y-%m-%d"
                yScale={{ type: 'linear', min: 0, max: 'auto' }}
                margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  format: '%m/%d',
                  tickValues: activeUsersData.current.daily_data.length > 7 ? 
                    'every 3 days' : 'every day'
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  format: (v) => {
                    if (typeof v !== 'number') return String(v);
                    if (v >= 10000) {
                      const valueInWan = v / 10000;
                      const formattedValue = (v % 10000 === 0) ? valueInWan : valueInWan.toFixed(1);
                      return `${formattedValue}万`;
                    } else if (v >= 1000) {
                      const valueInQian = v / 1000;
                      const formattedValue = (v % 1000 === 0) ? valueInQian : valueInQian.toFixed(1);
                      return `${formattedValue}千`;
                    }
                    return String(v);
                  },
                }}
                tooltip={({ point }) => (
                  <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                    <strong>{format(new Date(point.data.x as Date), 'MM月dd日')}</strong><br />
                    {point.serieId}: {point.data.y} 人
                  </div>
                )}
                legends={[
                  {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
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
              />
            ) : (
              <ResponsiveLine
                key={`visits-line-${dashboardData.timeGranularity}`}
                {...dashboardData.commonLineProps}
                data={dashboardData.dauChartData}
                colors={['#6366f1', '#a5b4fc']}
                lineWidth={2}
                enablePoints={dashboardData.timeGranularity !== 'monthly'}
                pointSize={dashboardData.timeGranularity === 'hourly' ? 6 : 4}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                enableGridX={false}
                enableGridY={true}
                xScale={visitsXScale}
                xFormat={dashboardData.timeGranularity === 'hourly' ? undefined :
                         "time:%Y-%m-%d"
                }
                yScale={{ type: 'linear', min: 0, max: 'auto' }}
                axisBottom={{
                  ...visitsAxisBottom,
                }}
                axisLeft={{
                  ...dashboardData.commonLineProps.axisLeft,
                  format: (v) => {
                    if (typeof v !== 'number') return String(v);
                    if (v >= 10000) {
                      const valueInWan = v / 10000;
                      const formattedValue = (v % 10000 === 0) ? valueInWan : valueInWan.toFixed(1);
                      return `${formattedValue}万`;
                    } else if (v >= 1000) {
                      const valueInQian = v / 1000;
                      const formattedValue = (v % 1000 === 0) ? valueInQian : valueInQian.toFixed(1);
                      return `${formattedValue}千`;
                    }
                    return String(v);
                  },
                }}
                tooltip={({ point }) => (
                  <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                    {point.data.yFormatted.toLocaleString()}
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* 2. Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">流量来源分布 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsivePie
              data={trafficSourceData.map(item => ({
                id: item.source,
                label: item.source,
                value: item.value,
                color: item.source === '搜索引擎' ? '#6366f1' :
                       item.source === '直接访问' ? '#818cf8' :
                       item.source === '社交媒体' ? '#a5b4fc' :
                       item.source === '外部链接' ? '#c7d2fe' : '#e0e7ff',
              }))}
              margin={{ top: 30, right: 80, bottom: 30, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ datum: 'data.color' }}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              legends={[
                {
                  anchor: 'right',
                  direction: 'column',
                  justify: false,
                  translateX: 0,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemTextColor: '#999',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: '#000'
                      }
                    }
                  ]
                }
              ]}
              tooltip={({ datum }) => (
                <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                  <strong>{datum.id}</strong><br />
                  {datum.value.toLocaleString()} ({((datum.value / dashboardData.totalPageViews) * 100).toFixed(1)}%)
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* 3. Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">设备类型分布 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsivePie
              data={deviceData}
              margin={{ top: 30, right: 80, bottom: 30, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ datum: 'data.color' }}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              arcLabel={d => `${d.value}%`}
              legends={[
                {
                  anchor: 'right',
                  direction: 'column',
                  justify: false,
                  translateX: 0,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemTextColor: '#999',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: '#000'
                      }
                    }
                  ]
                }
              ]}
              tooltip={({ datum }) => (
                <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                  <strong>{datum.id}</strong><br />
                  {datum.value}%<br />
                  数量: {datum.data.count?.toLocaleString() || 0}
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* 4. Page Views by Page */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">页面浏览分布 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {pageViewsData && pageViewsData.current && pageViewsData.current.pages ? (
              <ResponsiveBar
                {...dashboardData.commonBarProps}
                data={(() => {
                  // 转换API数据为图表格式
                  const currentPages = pageViewsData.current.pages;
                  const previousPages = pageViewsData.previous.pages;
                  
                  return currentPages.map((page) => {
                    // 在对比时间段中查找相同的页面
                    const previousPage = previousPages.find(prev => prev.page_name === page.page_name);
                    return {
                      page: page.page_name,
                      current: page.page_views,
                      comparison: previousPage ? previousPage.page_views : 0
                    };
                  });
                })()}
                keys={['current', 'comparison']}
                indexBy="page"
                margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
                padding={0.3}
                defs={dashboardData.gradientDefs}
                fill={[
                  { match: { id: 'current' }, id: 'gradientCurrent' },
                  { match: { id: 'comparison' }, id: 'gradientComparison' }
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
                  format: (v) => {
                    if (typeof v !== 'number') return String(v);
                    if (v >= 10000) {
                      return `${(v / 10000).toFixed(1)}万`;
                    } else if (v >= 1000) {
                      return `${(v / 1000).toFixed(1)}千`;
                    }
                    return String(v);
                  },
                }}
                enableLabel={false}
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
                    {id === 'current' ? '当前' : '对比'}: {value.toLocaleString()} 次浏览
                  </div>
                )}
              />
            ) : (
              <ResponsiveBar
                {...dashboardData.commonBarProps}
                data={dashboardData.combinedPageViewsData}
                keys={['current', 'comparison']}
                indexBy="page"
                margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
                padding={0.3}
                defs={dashboardData.gradientDefs}
                fill={[
                  { match: { id: 'current' }, id: 'gradientCurrent' },
                  { match: { id: 'comparison' }, id: 'gradientComparison' }
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
                  format: (v) => {
                    if (typeof v !== 'number') return String(v);
                    if (v >= 10000) {
                      return `${(v / 10000).toFixed(1)}万`;
                    } else if (v >= 1000) {
                      return `${(v / 1000).toFixed(1)}千`;
                    }
                    return String(v);
                  },
                }}
                enableLabel={false}
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
                    {value.toLocaleString()}
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* 5. Browser Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">浏览器分布 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveBar
              {...dashboardData.commonBarProps}
              data={browserData}
              keys={['value']}
              indexBy="browser"
              margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
              padding={0.3}
              colors={['#6366f1']}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                format: (v) => {
                  if (typeof v !== 'number') return String(v);
                  if (v >= 10000) {
                    return `${(v / 10000).toFixed(1)}万`;
                  } else if (v >= 1000) {
                    return `${(v / 1000).toFixed(1)}千`;
                  }
                  return String(v);
                },
              }}
              enableLabel={true}
              labelSkipWidth={16}
              labelFormat={value => `${((value / dashboardData.totalDAU) * 100).toFixed(1)}%`}
              tooltip={({ id, value, indexValue, color, data }) => (
                <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                  <strong>{indexValue}</strong><br />
                  {value.toLocaleString()} ({((value / dashboardData.totalDAU) * 100).toFixed(1)}%)
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* 6. User Behavior Metrics */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">用户行为指标变化 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveLine
              {...dashboardData.commonLineProps}
              data={userBehaviorData}
              colors={['#6366f1', '#ef4444']} // Pages, Bounce rate
              lineWidth={2}
              enablePoints={dashboardData.timeGranularity !== 'monthly'}
              pointSize={dashboardData.timeGranularity === 'hourly' ? 6 : 4}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              enableGridX={false}
              enableGridY={true}
              xScale={visitsXScale}
              xFormat={dashboardData.timeGranularity === 'hourly' ? undefined :
                      "time:%Y-%m-%d"
              }
              yScale={{
                type: 'linear',
                min: 0,
                max: 'auto',
                stacked: false
              }}
              axisBottom={{
                ...visitsAxisBottom,
              }}
              axisLeft={{
                ...dashboardData.commonLineProps.axisLeft,
                legend: '页面浏览量',
                legendOffset: -40,
                legendPosition: 'middle'
              }}
              axisRight={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: '留存率 (%)',
                legendOffset: 40,
                legendPosition: 'middle'
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
              tooltip={({ point }) => (
                <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                  {point.serieId === '留存率' ? 
                    `${point.data.yFormatted}%` : 
                    point.data.yFormatted.toLocaleString()}
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* 7. Geographic Distribution */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">访问地区排名 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">排名</th>
                    <th className="text-left pb-2">地区</th>
                    <th className="text-left pb-2">访问人数</th>
                    <th className="text-left pb-2">占比</th>
                    <th className="text-left pb-2">平均停留时间</th>
                    <th className="text-left pb-2">同比</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { region: '广东省', visits: Math.round(dashboardData.totalDAU * 0.22), stayTime: 195, change: 8.3 },
                    { region: '北京市', visits: Math.round(dashboardData.totalDAU * 0.18), stayTime: 210, change: 5.5 },
                    { region: '上海市', visits: Math.round(dashboardData.totalDAU * 0.16), stayTime: 187, change: 7.2 },
                    { region: '江苏省', visits: Math.round(dashboardData.totalDAU * 0.12), stayTime: 165, change: -3.4 },
                    { region: '浙江省', visits: Math.round(dashboardData.totalDAU * 0.09), stayTime: 178, change: 4.1 },
                    { region: '四川省', visits: Math.round(dashboardData.totalDAU * 0.07), stayTime: 172, change: 2.8 },
                    { region: '湖北省', visits: Math.round(dashboardData.totalDAU * 0.05), stayTime: 153, change: 1.7 },
                    { region: '福建省', visits: Math.round(dashboardData.totalDAU * 0.04), stayTime: 144, change: -2.1 },
                    { region: '山东省', visits: Math.round(dashboardData.totalDAU * 0.04), stayTime: 160, change: 3.9 },
                    { region: '河南省', visits: Math.round(dashboardData.totalDAU * 0.03), stayTime: 148, change: 0.8 },
                  ].map((item, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3">{index + 1}</td>
                      <td className="py-3">{item.region}</td>
                      <td className="py-3">{item.visits.toLocaleString()}</td>
                      <td className="py-3">{((item.visits / dashboardData.totalDAU) * 100).toFixed(1)}%</td>
                      <td className="py-3">{Math.floor(item.stayTime / 60)}分{item.stayTime % 60}秒</td>
                      <td className={`py-3 ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change}%
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