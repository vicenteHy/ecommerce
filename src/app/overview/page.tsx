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
import { ResponsiveFunnel } from '@nivo/funnel';
import { format } from "date-fns";
import { DateTimeSelector } from "@/components/date-time-selector";


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

// 定义Sales数据接口
interface SalesTimeData {
  time: string;
  total_amount_cny: number;
  orders_count: number;
}

interface CountryStats {
  count: number;
  amount: number;
}

// 定义API返回的销售数据接口
interface SalesComparisonData {
  current: {
    data: {
      order_no: string;
      actual_amount: number;
      currency: string;
      payment_method: string;
      receiver_country: string;
      pay_time: string;
      amount_cny: number;
    }[];
    fields: string[];
    orders_count: number;
    ave_amount: number;
    total_amount: number;
    payment_stats: Record<string, number>;
    amount_distribution: Record<string, number>;
    time_aggregated_sales?: SalesTimeData[];
    country_stats?: Record<string, CountryStats>;
  };
  previous: {
    data: {
      order_no: string;
      actual_amount: number;
      currency: string;
      payment_method: string;
      receiver_country: string;
      pay_time: string;
      amount_cny: number;
    }[];
    fields: string[];
    orders_count: number;
    ave_amount: number;
    total_amount: number;
    payment_stats: Record<string, number>;
    amount_distribution: Record<string, number>;
    time_aggregated_sales?: SalesTimeData[];
    country_stats?: Record<string, CountryStats>;
  };
  comparison: {
    orders_count_change: number;
    total_amount_change: number;
    ave_amount_change: number;
  };
  // 处理后的图表数据
  lineChartSalesData?: Array<{
    id: string;
    data: Array<{
      x: Date;
      y: number;
    }>;
  }>;
  combinedOrdersData?: Array<{
    country: string;
    current: number;
    comparison: number;
  }>;
  combinedAovData?: Array<{
    label: string;
    current: number;
    comparison: number;
  }>;
}

// 定义搜索统计数据接口
interface SearchKeyword {
  keyword: string;
  search_count: number;
}

interface SearchStatsData {
  total_search_events: number;
  top_keywords: SearchKeyword[];
  start_date: string;
  end_date: string;
}

interface SearchStatsComparisonData {
  current: SearchStatsData;
  previous: SearchStatsData;
  comparison: {
    total_change_rate: number;
    total_change_amount: number;
    keywords: Array<{
      keyword: string;
      change_rate: number;
      change_amount: number;
    }>;
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

// 定义会话数据接口
interface SessionData {
  session_count: number;
  avg_session_duration_seconds: number;
  start_date: string;
  end_date: string;
}

interface SessionComparisonData {
  current: SessionData;
  previous: SessionData;
  comparison: {
    session_count_change_rate: number;
    session_count_change_amount: number;
    duration_change_rate: number;
    duration_change_amount: number;
  };
}

// 定义商品销量数据接口
interface DailyItemsSoldData {
  date: string;
  total_items_sold: number;
}

interface ItemsSoldData {
  current: {
    total_items_sold: number;
    start_date?: string;
    end_date?: string;
    daily_data?: DailyItemsSoldData[];
  };
  previous: {
    total_items_sold: number;
    start_date?: string;
    end_date?: string;
    daily_data?: DailyItemsSoldData[];
  };
  comparison: {
    total_items_sold_change: number;
  };
}

// --- Page Component ---
export default function DataOverviewPage() {
  // 新增销售数据状态
  const [salesData, setSalesData] = useState<SalesComparisonData | null>(null);
  // 新增活跃用户数据状态
  const [activeUsersData, setActiveUsersData] = useState<ActiveUsersComparisonData | null>(null);
  // 新增搜索统计数据状态
  const [searchStatsData, setSearchStatsData] = useState<SearchStatsComparisonData | null>(null);
  // 新增页面浏览量数据状态
  const [pageViewsData, setPageViewsData] = useState<PageViewsComparisonData | null>(null);
  // 新增转化漏斗数据状态
  const [funnelData, setFunnelData] = useState<FunnelComparisonData | null>(null);
  // 新增会话数据状态
  const [sessionData, setSessionData] = useState<SessionComparisonData | null>(null);
  // 新增商品销量数据状态
  const [itemsSoldData, setItemsSoldData] = useState<ItemsSoldData | null>(null);
  // 新增日期范围状态，用于显示
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({from: new Date(), to: new Date()});
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

  // 格式化秒数为分钟:秒格式
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 处理销售数据和图表数据转换
  const processSalesData = (data: any) => {
    if (!data) return null;
    
    // 准备销售金额图表数据
    const prepareSalesChartData = () => {
      if (!data.current.time_aggregated_sales) return [];
      
      // 当前时间段销售数据转换为线图格式
      const currentSalesData = data.current.time_aggregated_sales.map((item: any) => ({
        x: new Date(item.time),
        y: item.total_amount_cny
      }));
      
      // 只返回当前时间段数据，不返回对比时间段数据
      return [
        {
          id: 'current',
          data: currentSalesData
        }
      ];
    };
    
    // 准备订单数量图表数据（按国家）
    const prepareOrdersByCountryData = () => {
      if (!data.current.country_stats) return [];
      
      // 按销售额排序国家
      const sortedCountries = Object.entries(data.current.country_stats)
        .map(([country, stats]: [string, any]) => ({
          country: country === '0' ? '未知' : country,
          amount: stats.amount,
          count: stats.count
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10); // 取前10名
      
      // 转换为图表数据格式
      return sortedCountries.map((item) => {
        const previousStats = data.previous.country_stats[item.country === '未知' ? '0' : item.country];
        return {
          country: item.country,
          current: item.count,
          comparison: previousStats ? previousStats.count : 0
        };
      });
    };
    
    // 准备客单价图表数据
    const prepareAovData = () => {
      const currentDistribution = data.current.amount_distribution;
      const previousDistribution = data.previous.amount_distribution;
      
      return [
        {
          label: '0-100',
          current: currentDistribution['0-100'] || 0,
          comparison: previousDistribution['0-100'] || 0
        },
        {
          label: '100-500',
          current: currentDistribution['100-500'] || 0,
          comparison: previousDistribution['100-500'] || 0
        },
        {
          label: '500-1000',
          current: currentDistribution['500-1000'] || 0,
          comparison: previousDistribution['500-1000'] || 0
        },
        {
          label: '1000+',
          current: currentDistribution['1000+'] || 0,
          comparison: previousDistribution['1000+'] || 0
        }
      ];
    };
    
    // 更新数据
    return {
      ...data,
      lineChartSalesData: prepareSalesChartData(),
      combinedOrdersData: prepareOrdersByCountryData(),
      combinedAovData: prepareAovData()
    };
  };
  
  // 获取后端搜索统计数据
  const fetchSearchStatsData = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/traffic/search-stats/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('请求搜索统计数据URL:', url);
      
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
        console.error('解析搜索统计数据JSON失败:', parseError);
        return;
      }
      
      console.log('搜索统计数据:', data);
      
      // 检查数据格式
      const isValidData = data && typeof data === 'object' && 'current' in data && 'previous' in data && 'comparison' in data;
      
      if (isValidData) {
        setSearchStatsData(data);
      } else {
        console.log('搜索统计数据格式不正确');
      }
    } catch (err) {
      console.error('获取搜索统计数据错误:', err);
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

  // 获取后端会话数据
  const fetchSessionData = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/traffic/sessions/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('请求会话数据URL:', url);
      
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
        console.error('解析会话数据JSON失败:', parseError);
        return;
      }
      
      console.log('会话数据:', data);
      
      // 检查数据格式
      const isValidData = data && typeof data === 'object' && 'current' in data && 'previous' in data && 'comparison' in data;
      
      if (isValidData) {
        setSessionData(data);
      } else {
        console.log('会话数据格式不正确');
      }
    } catch (err) {
      console.error('获取会话数据错误:', err);
    }
  };

  // 获取商品销量数据
  const fetchItemsSoldData = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/sales/items-sold/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('请求商品销量URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        console.error(`商品销量API请求失败: ${response.status}`);
        // 对于500错误，记录但不抛出异常
        if (response.status === 500) {
          console.log('商品销量服务器内部错误，将使用模拟数据');
          return;
        }
        throw new Error(`商品销量请求失败: ${response.status}`);
      }
      
      const textData = await response.text();
      console.log('商品销量原始响应数据:', textData);
      
      let data;
      try {
        data = JSON.parse(textData);
      } catch (parseError) {
        console.error('解析商品销量JSON失败:', parseError);
        return;
      }
      
      console.log('解析后的商品销量数据:', data);
      
      // 验证数据格式并转换为期望的格式
      if (data && typeof data === 'object' && 'current' in data && 'previous' in data && 'summary' in data) {
        console.log('使用真实商品销量数据');
        // 转换数据格式
        const formattedData = {
          current: {
            total_items_sold: data.summary.current_total,
            daily_data: data.current
          },
          previous: {
            total_items_sold: data.summary.previous_total,
            daily_data: data.previous
          },
          comparison: {
            total_items_sold_change: data.summary.total_change_rate
          }
        };
        setItemsSoldData(formattedData);
      } else {
        console.log('商品销量数据格式不正确');
      }
      
    } catch (err) {
      console.error('获取商品销量数据错误:', err);
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
  
  // 获取后端销售数据
  const fetchSalesData = async (from: Date, to: Date) => {
    setError(null);
    try {
      const url = `http://localhost:8000/sales/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('请求URL:', url);
      
      // 添加跨域请求配置
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // 移除credentials选项，因为服务端设置了'Access-Control-Allow-Origin: *'
        mode: 'cors',  // 显式声明跨域请求
      });
      
      console.log('响应状态:', response.status);
      console.log('响应头:', [...response.headers.entries()]);
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }
      
      // 先获取原始文本以进行调试
      const textData = await response.text();
      console.log('原始响应数据:', textData);
      
      // 尝试处理可能的JSON格式问题
      let data;
      try {
        data = JSON.parse(textData);
      } catch (parseError) {
        console.error('解析JSON失败:', parseError);
        setError('响应数据格式错误，无法解析');
        return;
      }
      
      console.log('解析后的销售数据:', data);
      console.log('销售数据类型:', typeof data);
      console.log('销售数据是否有current属性:', data && typeof data === 'object' && 'current' in data);
      console.log('销售数据是否有comparison属性:', data && typeof data === 'object' && 'comparison' in data);
      
      // 判断是否使用模拟数据
      const useRealData = data && typeof data === 'object' && 'current' in data && 'previous' in data && 'comparison' in data;
      
      if (useRealData) {
        console.log('使用真实数据');
        const processedData = processSalesData(data);
        setSalesData(processedData);
      } else {
        console.log('数据格式不正确，无法处理');
        setError('返回数据格式不正确');
      }
      
      // 检查是否有订单数据
      if (useRealData && data.current.orders_count === 0) {
        console.log('所选时间范围内没有订单数据');
      }
    } catch (err) {
      console.error('获取销售数据错误:', err);
      setError('获取数据失败，请稍后重试');
    }
  };

  // 处理转化漏斗数据转换为Nivo格式
  const processFunnelData = (data: FunnelComparisonData) => {
    if (!data || !data.current || !data.current.funnel_steps) return null;
    
    // 转换API数据为Nivo漏斗图格式
    return data.current.funnel_steps.map((step, index) => {
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
  
  // 判断日期范围是否为今天
  const isToday = () => {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    
    return dateRange.from && dateRange.to && 
           dateRange.from.getTime() === todayStart.getTime() && 
           dateRange.to.getTime() === todayEnd.getTime();
  };

  // 处理日期范围变更的回调函数
  const handleDateRangeChange = (from: Date, to: Date) => {
    setDateRange({from, to});
    console.log('日期范围变更:', {from: formatDate(from), to: formatDate(to)});
    
    // 获取所有数据
    fetchSalesData(from, to);
    fetchActiveUsersData(from, to);
    fetchSearchStatsData(from, to);
    fetchPageViewsData(from, to);
    fetchFunnelData(from, to);
    fetchSessionData(from, to);
    fetchItemsSoldData(from, to);
  };



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

  // 定义基本的图表配置
  const commonLineProps = {
    margin: { top: 20, right: 20, bottom: 40, left: 50 },
    enableGridX: false,
    enableGridY: true,
    axisBottom: {
      tickSize: 0,
      tickPadding: 5,
      tickRotation: 0,
    },
    axisLeft: {
      tickSize: 0,
      tickPadding: 5,
      tickRotation: 0,
    },
  };

  const commonBarProps = {
    margin: { top: 20, right: 20, bottom: 40, left: 50 },
    padding: 0.3,
    axisBottom: {
      tickSize: 0,
      tickPadding: 5,
      tickRotation: 0,
    },
    axisLeft: {
      tickSize: 0,
      tickPadding: 5,
      tickRotation: 0,
    },
  };

  const gradientDefs = [
    {
      id: 'gradientCurrent',
      type: 'linearGradient',
      colors: [
        { offset: 0, color: '#6366f1' },
        { offset: 100, color: '#a5b4fc' },
      ],
    },
    {
      id: 'gradientComparison',
      type: 'linearGradient',
      colors: [
        { offset: 0, color: '#a5b4fc' },
        { offset: 100, color: '#e0e7ff' },
      ],
    },
  ];

  const barFill = [
    { match: { id: 'current' }, id: 'gradientCurrent' },
    { match: { id: 'comparison' }, id: 'gradientComparison' },
  ];


  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">数据总览</h1>
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
      
      {salesData && salesData.current && salesData.current.orders_count === 0 && !error && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-600 rounded-md">
          所选时间范围（{formatDate(dateRange.from)} 至 {formatDate(dateRange.to)}）内没有订单数据。<br/>
        </div>
      )}
      

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        {/* 1. 销售金额 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">销售金额</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {salesData && salesData.current && salesData.current.total_amount !== undefined ? (
                <>
                  ¥{salesData.current.total_amount.toLocaleString()}
                  {salesData.comparison && isFinite(salesData.comparison.total_amount_change) && (
                    <span className={`ml-2 text-xs font-medium ${salesData.comparison.total_amount_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesData.comparison.total_amount_change >= 0 ? '+' : ''}{salesData.comparison.total_amount_change.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  暂无数据
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
             {isToday() && salesData && salesData.current ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground mb-2">
                    ¥{salesData.current.total_amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    今日销售金额
                  </div>
                </div>
              </div>
             ) : salesData && salesData.lineChartSalesData ? (
              <ResponsiveLine
                key={`sales-line-${dateRange.from && dateRange.to && Math.abs(dateRange.to.getTime() - dateRange.from.getTime()) <= 86400000 ? 'hourly' : 'daily'}`}
                {...commonLineProps}
                data={salesData.lineChartSalesData}
                colors={['#6366f1']} // 只保留当前数据的颜色
                lineWidth={2}
                enablePoints={true}
                pointSize={4}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                enableGridX={false}
                enableGridY={true}
                xScale={{ 
                  type: 'time',
                  precision: 'day'
                }}
                xFormat="time:%Y-%m-%d"
                yScale={{ 
                  type: 'linear', 
                  min: 0, 
                  max: calculateYMax(Math.max(...salesData.lineChartSalesData
                    .flatMap(series => series.data
                      .map(point => typeof point.y === 'number' ? point.y : 0)
                    ))) 
                }}
                axisBottom={{
                  tickSize: 0,
                  tickPadding: 10,
                  tickRotation: 0,
                  legend: `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`,
                  legendPosition: 'middle',
                  legendOffset: 20, // 将legendOffset从40改为20，使组件整体向上移
                  format: () => '',  // 不显示各个日期刻度
                }}
                axisLeft={{
                  ...commonLineProps.axisLeft,
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
                    <strong>{format(new Date(point.data.x as Date), 'yyyy-MM-dd')}</strong>: ¥{point.data.y?.toLocaleString() || '0'}
                  </div>
                )}
              />
             ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无销售数据
              </div>
             )}
          </CardContent>
        </Card>

        {/* 2. 订单数量 */}
        <Card>
          <CardHeader>
             {/* Update title/comparison label */}
            <CardTitle className="text-sm font-medium text-muted-foreground">订单数量</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {salesData && salesData.current && salesData.current.orders_count !== undefined ? (
                <>
                  {salesData.current.orders_count.toLocaleString()}
                  {salesData.comparison && isFinite(salesData.comparison.orders_count_change) && (
                    <span className={`ml-2 text-xs font-medium ${salesData.comparison.orders_count_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesData.comparison.orders_count_change >= 0 ? '+' : ''}{salesData.comparison.orders_count_change.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  暂无数据
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
             {salesData && salesData.combinedOrdersData ? (
               <ResponsiveBar
                 {...commonBarProps}
                 data={salesData.combinedOrdersData}
                 keys={['current', 'comparison']}
                 indexBy="country"
                 innerPadding={3}
                 groupMode={'grouped'}
                 borderRadius={5}
                 defs={gradientDefs}
                 fill={barFill}
                 enableLabel={false}
                 minValue={0}
                 margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                 padding={0.3}
                 axisBottom={{
                   tickSize: 5,
                   tickPadding: 5,
                   tickRotation: -45,
                   legendPosition: 'middle',
                   legendOffset: 32
                 }}
                 axisLeft={{
                   tickSize: 5,
                   tickPadding: 5,
                   tickRotation: 0,
                   legendPosition: 'middle',
                   legendOffset: -30
                 }}
                 tooltip={({ id, value, indexValue }) => (
                   <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                     <strong>{indexValue}:</strong> {value.toLocaleString()} 订单
                   </div>
                 )}
               />
             ) : (
               <div className="flex items-center justify-center h-full text-gray-400">
                 暂无订单数据
               </div>
             )}
          </CardContent>
        </Card>

        {/* 3. 客单价 */}
        <Card>
          <CardHeader>
             {/* Update title/comparison label */}
             <CardTitle className="text-sm font-medium text-muted-foreground">客单价</CardTitle>
             <CardDescription className="text-2xl font-bold text-foreground flex items-center">
               {salesData && salesData.current && salesData.current.ave_amount !== undefined ? (
                 <>
                   ¥{salesData.current.ave_amount.toFixed(2)}
                   {salesData.comparison && isFinite(salesData.comparison.ave_amount_change) && (
                     <span className={`ml-2 text-xs font-medium ${salesData.comparison.ave_amount_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       {salesData.comparison.ave_amount_change >= 0 ? '+' : ''}{salesData.comparison.ave_amount_change.toFixed(1)}%
                       <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                     </span>
                   )}
                 </>
               ) : (
                 <>
                   暂无数据
                 </>
               )}
             </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
             {salesData && salesData.combinedAovData ? (
               <ResponsiveBar
                 {...commonBarProps}
                 data={salesData.combinedAovData}
                 keys={['current', 'comparison']}
                 indexBy="label"
                 margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
                 padding={0.3}
                 innerPadding={3}
                 groupMode={'grouped'}
                 borderRadius={5}
                 defs={gradientDefs}
                 fill={barFill}
                 axisTop={null}
                 axisRight={null}
                 axisBottom={{
                   ...commonBarProps.axisBottom,
                   tickSize: 5,
                   tickPadding: 5,
                   tickRotation: 0,
                 }}
                 axisLeft={{
                   tickSize: 5,
                   tickPadding: 5,
                   tickRotation: 0,
                 }}
                 enableLabel={false}
                 enableGridY={false}
                 tooltip={({ id, value, indexValue }) => (
                   <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                     <strong>{indexValue}</strong>: {value.toLocaleString()} 订单
                   </div>
                 )}
               />
             ) : (
               <div className="flex items-center justify-center h-full text-gray-400">
                 暂无客单价数据
               </div>
             )}
          </CardContent>
        </Card>

        {/* 4. 活跃用户 */}
        <Card>
          <CardHeader>
             {/* Update title/comparison label */}
             <CardTitle className="text-sm font-medium text-muted-foreground">活跃用户</CardTitle>
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
                   暂无数据
                 </>
               )}
             </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
             {/* 使用真实API数据或降级到模拟数据 */}
             {isToday() && activeUsersData && activeUsersData.current ? (
               <div className="flex items-center justify-center h-full">
                 <div className="text-center">
                   <div className="text-4xl font-bold text-foreground mb-2">
                     {activeUsersData.current.active_users.toLocaleString()}
                   </div>
                   <div className="text-sm text-muted-foreground">
                     今日活跃用户
                   </div>
                 </div>
               </div>
             ) : activeUsersData && activeUsersData.current && activeUsersData.current.daily_data ? (
               <ResponsiveLine
                 key={`active-users-line-${dateRange.from && dateRange.to && Math.abs(dateRange.to.getTime() - dateRange.from.getTime()) <= 86400000 ? 'hourly' : 'daily'}`}
                 {...commonLineProps}
                 data={[
                   {
                     id: 'current',
                     data: activeUsersData.current.daily_data.map(item => ({
                       x: new Date(item.date),
                       y: item.active_users
                     }))
                   }
                 ]}
                 colors={['#6366f1']} // 只保留当前数据的颜色
                 lineWidth={2}
                 enablePoints={true}
                 pointSize={4}
                 pointBorderWidth={2}
                 pointBorderColor={{ from: 'serieColor' }}
                 pointLabelYOffset={-12}
                 useMesh={true}
                 enableGridX={false}
                 enableGridY={true}
                 xScale={{ 
                   type: 'time',
                   precision: 'day'
                 }}
                 xFormat="time:%Y-%m-%d"
                 yScale={{ 
                   type: 'linear', 
                   min: 0, 
                   max: 'auto'
                 }}
                 axisBottom={{
                   tickSize: 0,
                   tickPadding: 10,
                   tickRotation: 0,
                   legend: `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`,
                   legendPosition: 'middle',
                   legendOffset: 20,
                   format: () => '',  // 不显示各个日期刻度
                 }}
                 axisLeft={{
                   ...commonLineProps.axisLeft,
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
                     <strong>{format(new Date(point.data.x as Date), 'yyyy-MM-dd')}</strong>: {point.data.y?.toLocaleString() || '0'} 用户
                   </div>
                 )}
               />
             ) : (
               <div className="flex items-center justify-center h-full text-gray-400">
                 暂无活跃用户数据
               </div>
             )}
          </CardContent>
        </Card>

        {/* 5. 转化率 */}
        <Card>
          <CardHeader>
             {/* Update title/comparison label */}
             <CardTitle className="text-sm font-medium text-muted-foreground">转化率</CardTitle>
             <CardDescription className="text-2xl font-bold text-foreground flex items-center">
               {funnelData && funnelData.current && funnelData.current.funnel_steps && funnelData.current.funnel_steps.length > 0 ? (
                 <>
                   {(() => {
                     const lastStep = funnelData.current.funnel_steps[funnelData.current.funnel_steps.length - 1];
                     const currentRate = lastStep.conversion_rate === '-' ? '0' : lastStep.conversion_rate.replace('%', '');
                     const previousStep = funnelData.previous?.funnel_steps?.[funnelData.previous.funnel_steps.length - 1];
                     const previousRate = previousStep?.conversion_rate === '-' ? '0' : previousStep?.conversion_rate?.replace('%', '') || '0';
                     const changeRate = funnelData.comparison?.steps?.[funnelData.comparison.steps.length - 1]?.change_rate || 0;
                     
                     return (
                       <>
                         {currentRate}%
                         {isFinite(changeRate) && (
                           <span className={`ml-2 text-xs font-medium ${changeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {changeRate >= 0 ? '+' : ''}{changeRate.toFixed(1)}%
                             <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                           </span>
                         )}
                       </>
                     );
                   })()}
                 </>
               ) : (
                 <>
                   暂无数据
                 </>
               )}
             </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
                         {funnelData && funnelData.current && funnelData.current.funnel_steps ? (
               <ResponsiveFunnel
                 data={processFunnelData(funnelData) as any}
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
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无转化数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6. 平均会话时间 */}
        <Card>
          <CardHeader>
             <CardTitle className="text-sm font-medium text-muted-foreground">平均会话时间</CardTitle>
             <CardDescription className="text-2xl font-bold text-foreground flex items-center">
               {sessionData && sessionData.current ? (
                 <>
                   {formatDuration(sessionData.current.avg_session_duration_seconds)}
                   {sessionData.comparison && isFinite(sessionData.comparison.duration_change_rate) && (
                     <span className={`ml-2 text-xs font-medium ${sessionData.comparison.duration_change_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       {sessionData.comparison.duration_change_rate >= 0 ? '+' : ''}{sessionData.comparison.duration_change_rate.toFixed(1)}%
                       <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                     </span>
                   )}
                 </>
               ) : (
                 '暂无数据'
               )}
             </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {sessionData && sessionData.current ? (
              <ResponsiveBar
                {...commonBarProps}
                data={[
                  {
                    metric: '会话数',
                    current: sessionData.current.session_count,
                    comparison: sessionData.previous.session_count
                  },
                  {
                    metric: '平均时长(秒)',
                    current: sessionData.current.avg_session_duration_seconds,
                    comparison: sessionData.previous.avg_session_duration_seconds
                  }
                ]}
                keys={['current', 'comparison']}
                indexBy="metric"
                margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
                padding={0.3}
                innerPadding={3}
                groupMode={'grouped'}
                borderRadius={5}
                defs={gradientDefs}
                fill={barFill}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  format: (value) => {
                    if (typeof value !== 'number') return String(value);
                    if (value >= 1000) {
                      return `${(value / 1000).toFixed(1)}k`;
                    }
                    return String(Math.round(value));
                  }
                }}
                enableLabel={false}
                enableGridY={true}
                enableGridX={false}
                tooltip={({ id, value, indexValue }) => (
                  <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                    <strong>{indexValue}</strong><br />
                    {id === 'current' ? '当前' : '对比'}: {
                      indexValue === '平均时长(秒)' 
                        ? formatDuration(value) 
                        : value.toLocaleString()
                    }
                  </div>
                )}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无会话数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7. 商品购买数量 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">商品购买数量</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {itemsSoldData && itemsSoldData.current && itemsSoldData.current.total_items_sold !== undefined ? (
                <>
                  {itemsSoldData.current.total_items_sold.toLocaleString()}
                  {itemsSoldData.comparison && isFinite(itemsSoldData.comparison.total_items_sold_change) && (
                    <span className={`ml-2 text-xs font-medium ${itemsSoldData.comparison.total_items_sold_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {itemsSoldData.comparison.total_items_sold_change >= 0 ? '+' : ''}{itemsSoldData.comparison.total_items_sold_change.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                '暂无数据'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {isToday() && itemsSoldData && itemsSoldData.current ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {itemsSoldData.current.total_items_sold.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    今日商品销量
                  </div>
                </div>
              </div>
            ) : itemsSoldData && itemsSoldData.current && itemsSoldData.current.daily_data ? (
              <ResponsiveLine
                key={`items-sold-line-${dateRange.from && dateRange.to && Math.abs(dateRange.to.getTime() - dateRange.from.getTime()) <= 86400000 ? 'hourly' : 'daily'}`}
                {...commonLineProps}
                data={[
                  {
                    id: 'current',
                    data: itemsSoldData.current.daily_data.map(item => ({
                      x: new Date(item.date),
                      y: item.total_items_sold
                    }))
                  }
                ]}
                colors={['#6366f1']} // 只保留当前数据的颜色
                lineWidth={2}
                enablePoints={true}
                pointSize={4}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                enableGridX={false}
                enableGridY={true}
                xScale={{ 
                  type: 'time',
                  precision: 'day'
                }}
                xFormat="time:%Y-%m-%d"
                yScale={{ 
                  type: 'linear', 
                  min: 0, 
                  max: 'auto'
                }}
                axisBottom={{
                  tickSize: 0,
                  tickPadding: 10,
                  tickRotation: 0,
                  legend: `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`,
                  legendPosition: 'middle',
                  legendOffset: 20,
                  format: () => '',  // 不显示各个日期刻度
                }}
                axisLeft={{
                  ...commonLineProps.axisLeft,
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
                    <strong>{format(new Date(point.data.x as Date), 'yyyy-MM-dd')}</strong>: {point.data.y?.toLocaleString() || '0'} 件
                  </div>
                )}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无商品购买数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 8. 页面浏览量 */}
        <Card>
          <CardHeader>
            {/* Update title/comparison label */}
            <CardTitle className="text-sm font-medium text-muted-foreground">页面浏览量</CardTitle>
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
                  暂无数据
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {pageViewsData && pageViewsData.current && pageViewsData.current.pages ? (
              <ResponsiveBar
                {...commonBarProps}
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
                margin={{ top: 10, right: 10, bottom: 50, left: 10 }}
                padding={0.3}
                innerPadding={3}
                groupMode={'grouped'}
                borderRadius={5}
                defs={gradientDefs}
                fill={barFill}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                }}
                enableLabel={false}
                enableGridY={false}
                tooltip={({ id, value, indexValue }) => (
                  <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                    <strong>{indexValue}</strong>: {value.toLocaleString()} 次浏览
                  </div>
                )}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无页面浏览量数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 9. 搜索次数 */}
        <Card>
          <CardHeader>
             {/* Update title/comparison label */}
             <CardTitle className="text-sm font-medium text-muted-foreground">搜索次数</CardTitle>
             <CardDescription className="text-2xl font-bold text-foreground flex items-center">
               {searchStatsData && searchStatsData.current ? (
                 <>
                   {searchStatsData.current.total_search_events.toLocaleString()}
                   {searchStatsData.comparison && isFinite(searchStatsData.comparison.total_change_rate) && (
                     <span className={`ml-2 text-xs font-medium ${searchStatsData.comparison.total_change_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       {searchStatsData.comparison.total_change_rate >= 0 ? '+' : ''}{searchStatsData.comparison.total_change_rate.toFixed(1)}%
                       <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                     </span>
                   )}
                 </>
               ) : (
                 <>
                   暂无数据
                 </>
               )}
             </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-gray-400">
            {searchStatsData && searchStatsData.current && searchStatsData.current.top_keywords ? (
                <div className="text-xs w-full px-4">
                    <p className="font-semibold mb-2 text-center">热门搜索词</p>
                     <ul>
                         {searchStatsData.current.top_keywords.slice(0, 5).map((keyword) => {
                           // 在对比时间段中查找相同的关键词
                           const previousKeyword = searchStatsData.previous.top_keywords.find(
                             prev => prev.keyword === keyword.keyword
                           );
                           const previousCount = previousKeyword ? previousKeyword.search_count : 0;
                           
                           return (
                             <li key={keyword.keyword} className="flex justify-between py-1 border-b border-dashed">
                                 <span className="truncate mr-2" title={keyword.keyword}>{keyword.keyword}</span>
                                 <span className="flex-shrink-0">{keyword.search_count} / <span className="text-muted-foreground">{previousCount}</span></span>
                             </li>
                           );
                         })}
                     </ul>
                 </div>
             ) : (
                 '暂无搜索数据'
             )}
           </CardContent>
         </Card>

       </div>
     </div>
   );
 } 