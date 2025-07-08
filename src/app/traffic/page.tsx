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
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";

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

// 定义注册数据接口
interface RegistrationComparisonData {
  status: string;
  data: {
    current_period: {
      start: string;
      end: string;
      total_registrations: number;
      average_daily: number;
    };
    previous_period: {
      start: string;
      end: string;
      total_registrations: number;
      average_daily: number;
    };
    comparison: {
      total_change: number;
      change_rate: number;
    };
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

// 定义国家访问数据接口
interface CountryData {
  country_code: string;
  country_name: string;
  user_count: number;
  percentage: number;
}

interface CountryUsersData {
  total_users: number;
  countries: CountryData[];
  start_date: string;
  end_date: string;
}

interface CountryComparisonData {
  current: CountryUsersData;
  previous: CountryUsersData;
  comparison: {
    total_change_rate: number;
    total_change_amount: number;
    country_changes: Array<{
      country_code: string;
      country_name: string;
      current_count: number;
      previous_count: number;
      change_rate: number;
      change_amount: number;
    }>;
  };
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
  // 新增会话数据状态
  const [sessionData, setSessionData] = useState<SessionComparisonData | null>(null);
  // 新增注册数据状态
  const [registrationData, setRegistrationData] = useState<RegistrationComparisonData | null>(null);
  // 新增国家访问数据状态
  const [countryData, setCountryData] = useState<CountryComparisonData | null>(null);
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
      return date.toISOString().split('T')[0];
    }
  };

  // 格式化秒数为分钟:秒格式
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  // 获取后端注册数据
  const fetchRegistrationData = async (from: Date, to: Date) => {
    try {
      const formatDateTime = (date: Date): string => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day} 00:00:00`;
      };
      
      const url = `http://localhost:8000/registration/comparison?current_start_date=${formatDateTime(from)}&current_end_date=${formatDateTime(to)}`;
      console.log('请求注册数据URL:', url);
      
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
        console.error('解析注册数据JSON失败:', parseError);
        return;
      }
      
      console.log('注册数据:', data);
      
      // 检查数据格式
      const isValidData = data && typeof data === 'object' && 'status' in data && data.status === 'success' && 'data' in data;
      
      if (isValidData) {
        setRegistrationData(data);
      } else {
        console.log('注册数据格式不正确');
      }
    } catch (err) {
      console.error('获取注册数据错误:', err);
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

  // 获取后端国家访问数据
  const fetchCountryData = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/traffic/active-users/by-country/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('请求国家访问数据URL:', url);
      
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
        console.error('解析国家访问数据JSON失败:', parseError);
        return;
      }
      
      console.log('国家访问数据:', data);
      
      // 检查数据格式
      const isValidData = data && typeof data === 'object' && 'current' in data && 'previous' in data && 'comparison' in data;
      
      if (isValidData) {
        setCountryData(data);
      } else {
        console.log('国家访问数据格式不正确');
      }
    } catch (err) {
      console.error('获取国家访问数据错误:', err);
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
    
    setDateRange({from, to} as DateRange);
    fetchRegistrationData(from, to);
    fetchActiveUsersData(from, to);
    fetchPageViewsData(from, to);
    fetchDeviceTypeData(from, to);
    fetchSessionData(from, to);
    fetchCountryData(from, to);
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
      fetchRegistrationData(utcFrom, utcTo);
      fetchActiveUsersData(utcFrom, utcTo);
      fetchPageViewsData(utcFrom, utcTo);
      fetchDeviceTypeData(utcFrom, utcTo);
      fetchSessionData(utcFrom, utcTo);
      fetchCountryData(utcFrom, utcTo);
    }
  };

  if (!dashboardData) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
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
  ] : null;


  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">流量数据</h1>
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

      {/* Traffic Overview Section */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">注册人数 ({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {registrationData && registrationData.data ? (
                <>
                  {registrationData.data.current_period.total_registrations.toLocaleString()}
                  {registrationData.data.comparison && isFinite(registrationData.data.comparison.change_rate) && (
                    <span className={`ml-2 text-xs font-medium ${registrationData.data.comparison.change_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {registrationData.data.comparison.change_rate >= 0 ? '+' : ''}{registrationData.data.comparison.change_rate.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                '加载中...'
              )}
            </CardDescription>
          </CardHeader>
        </Card>

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
                '加载中...'
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
                '加载中...'
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">平均会话时长 ({dashboardData.currentLabel})</CardTitle>
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
                '加载中...'
              )}
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
            {/* 使用真实API数据 */}
            {activeUsersData && activeUsersData.current ? (
              selectedRange === 'today' ? (
                // 今天的数据显示为大数字
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-6xl font-bold text-foreground">
                    {activeUsersData.current.active_users.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-4">
                    今日访问人数
                  </div>
                  {activeUsersData.comparison && isFinite(activeUsersData.comparison.change_rate) && (
                    <div className={`mt-2 text-sm font-medium ${activeUsersData.comparison.change_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {activeUsersData.comparison.change_rate >= 0 ? '+' : ''}{activeUsersData.comparison.change_rate.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比昨天)</span>
                    </div>
                  )}
                </div>
              ) : activeUsersData.current.daily_data ? (
                // 其他时间范围显示曲线图
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
                <div className="flex items-center justify-center h-full text-gray-500">
                  加载中...
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                加载中...
              </div>
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
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 100,
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
            {deviceData ? (
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
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
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
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                加载中...
              </div>
            )}
          </CardContent>
        </Card>


        {/* 7. Country Ranking */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">访问国家排名 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">排名</th>
                    <th className="text-left pb-2">国家</th>
                    <th className="text-left pb-2">访问人数</th>
                    <th className="text-left pb-2">占比</th>
                    <th className="text-left pb-2">环比</th>
                  </tr>
                </thead>
                <tbody>
                  {countryData && countryData.current && countryData.current.countries ? (
                    countryData.current.countries.slice(0, 10).map((country, index) => {
                      // 查找对应的环比数据
                      const changeData = countryData.comparison.country_changes.find(
                        c => c.country_code === country.country_code
                      );
                      
                      return (
                        <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3">{index + 1}</td>
                          <td className="py-3">{country.country_name}</td>
                          <td className="py-3">{country.user_count.toLocaleString()}</td>
                          <td className="py-3">{country.percentage.toFixed(1)}%</td>
                          <td className={`py-3 ${changeData && changeData.change_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {changeData ? (
                              <>
                                {changeData.change_rate >= 0 ? '+' : ''}{changeData.change_rate.toFixed(1)}%
                              </>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-gray-500">
                        加载中...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}