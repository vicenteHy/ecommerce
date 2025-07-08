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

// 定义商品销量数据接口
interface ItemsSoldData {
  current: {
    total_items_sold: number;
  };
  previous: {
    total_items_sold: number;
  };
  comparison: {
    total_items_sold_change: number;
  };
}

// 定义品类数据接口
interface CategoryData {
  category_id: number;
  category_name: string;
  order_count: number;
  item_count: number;
  order_count_change?: number;
  item_count_change?: number;
}

interface CategoriesComparisonData {
  current: {
    categories: CategoryData[];
    total_categories: number;
  };
  previous: {
    categories: CategoryData[];
    total_categories: number;
  };
  comparison: {
    total_categories_change: number;
  };
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

export default function SalesPage() {
  const [selectedRange, setSelectedRange] = useState<string>('today');
  // 新增销售数据状态
  const [salesData, setSalesData] = useState<SalesComparisonData | null>(null);
  // 新增商品销量数据状态
  const [itemsSoldData, setItemsSoldData] = useState<ItemsSoldData | null>(null);
  // 新增品类销售数据状态
  const [categoriesData, setCategoriesData] = useState<CategoriesComparisonData | null>(null);
  // 新增日期范围选择状态
  // 设置默认日期范围：今天往前推30天
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
      
      // 转换为图表数据格式 - 使用amount而不是count
      return sortedCountries.map((item) => {
        const previousStats = data.previous.country_stats[item.country === '未知' ? '0' : item.country];
        return {
          country: item.country,
          current: item.amount, // 改为使用amount
          comparison: previousStats ? previousStats.amount : 0 // 改为使用amount
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
  
  // 获取品类销售数据
  const fetchCategoriesData = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/sales/categories/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}&limit=10`;
      console.log('请求品类销售URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`品类销售请求失败: ${response.status}`);
      }
      
      const textData = await response.text();
      console.log('品类销售原始响应数据:', textData);
      
      let data;
      try {
        data = JSON.parse(textData);
      } catch (parseError) {
        console.error('解析品类销售JSON失败:', parseError);
        return;
      }
      
      console.log('解析后的品类销售数据:', data);
      
      // 验证数据格式
      if (data && typeof data === 'object' && 'current' in data && 'previous' in data && 'comparison' in data) {
        console.log('使用真实品类销售数据');
        setCategoriesData(data);
      } else {
        console.log('品类销售数据格式不正确');
      }
      
    } catch (err) {
      console.error('获取品类销售数据错误:', err);
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
            total_items_sold: data.summary.current_total
          },
          previous: {
            total_items_sold: data.summary.previous_total
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
        console.error(`销售数据API请求失败: ${response.status}`);
        // 对于500错误，记录详细信息但不抛出异常，使用降级数据
        if (response.status === 500) {
          console.log('服务器内部错误，将使用模拟数据');
          return; // 直接返回，使用模拟数据
        }
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
      // 只在非500错误时显示错误消息，500错误已经处理过了
      if (!(err instanceof Error && err.message.includes('500'))) {
        setError('获取数据失败，请稍后重试');
      }
    }
  };
  
  useEffect(() => {
    console.log("Selected range changed:", selectedRange);
    
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
    console.log('设置日期范围:', {from: formatDate(from), to: formatDate(to)});
    fetchSalesData(from, to);
    fetchItemsSoldData(from, to);
    fetchCategoriesData(from, to);
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
      fetchSalesData(utcFrom, utcTo);
      fetchItemsSoldData(utcFrom, utcTo);
      fetchCategoriesData(utcFrom, utcTo);
    }
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
        { offset: 100, color: '#6366f1' },
      ],
    },
    {
      id: 'gradientComparison',
      type: 'linearGradient',
      colors: [
        { offset: 0, color: '#a5b4fc' },
        { offset: 100, color: '#a5b4fc' },
      ],
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">销售数据</h1>
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
      
      {salesData && salesData.current && salesData.current.orders_count === 0 && !error && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-600 rounded-md">
          所选时间范围（{formatDate(dateRange.from)} 至 {formatDate(dateRange.to)}）内没有订单数据。<br/>
        </div>
      )}

      {/* Sales Overview Section */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总销售额</CardTitle>
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
        </Card>

        <Card>
          <CardHeader className="pb-2">
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
        </Card>

        <Card>
          <CardHeader className="pb-2">
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
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">商品总销量</CardTitle>
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
                <>--</>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Detailed Sales Visualizations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* 1. Sales by Time Period */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">销售趋势</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {salesData && salesData.current ? (
              selectedRange === 'today' ? (
                // 今天的数据显示为大数字
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-6xl font-bold text-foreground">
                    ¥{salesData.current.total_amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-4">
                    今日销售总额
                  </div>
                  {salesData.comparison && isFinite(salesData.comparison.total_amount_change) && (
                    <div className={`mt-2 text-sm font-medium ${salesData.comparison.total_amount_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesData.comparison.total_amount_change >= 0 ? '+' : ''}{salesData.comparison.total_amount_change.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比昨天)</span>
                    </div>
                  )}
                </div>
              ) : salesData.lineChartSalesData ? (
                // 其他时间范围显示曲线图
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
                    format: '%m/%d', // 简化日期显示
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
                      <strong>{format(new Date(point.data.x as Date), 'yyyy-MM-dd')}</strong>: {point.data.y?.toLocaleString() || '0'}
                    </div>
                  )}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  暂无销售趋势数据
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无销售趋势数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Category Orders Count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">品类订单数 (前10)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {categoriesData && categoriesData.current && categoriesData.current.categories ? (
              <ResponsiveBar
                {...commonBarProps}
                data={(() => {
                  // 创建对比数据，匹配当前品类与历史品类
                  return categoriesData.current.categories.map(currentCategory => {
                    const previousCategory = categoriesData.previous.categories.find(
                      prev => prev.category_id === currentCategory.category_id
                    );
                    return {
                      category_name: currentCategory.category_name,
                      current: currentCategory.order_count,
                      comparison: previousCategory ? previousCategory.order_count : 0
                    };
                  });
                })()}
                keys={['current', 'comparison']}
                indexBy="category_name"
                margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
                padding={0.3}
                innerPadding={3}
                groupMode={'grouped'}
                borderRadius={5}
                defs={[
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
                ]}
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
                    return String(v);
                  },
                }}
                enableLabel={false}
                legends={[]}
                tooltip={({ id, value, indexValue, color, data }) => {
                  // 计算环比变化
                  const currentValue = Number(data.current) || 0;
                  const previousValue = Number(data.comparison) || 0;
                  const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;
                  
                  return (
                    <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                      <strong>{indexValue}</strong><br />
                      {id === 'current' ? '当前' : '对比'}: {value}<br />
                      {id === 'current' && previousValue > 0 && (
                        <span style={{ color: change >= 0 ? 'green' : 'red' }}>
                          环比: {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                暂无品类数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Sales by Region/Country */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">地区销售额</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {salesData && salesData.combinedOrdersData ? (
              <ResponsiveBar
                {...commonBarProps}
                data={salesData.combinedOrdersData}
                keys={['current', 'comparison']}
                indexBy="country"
                margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
                padding={0.3}
                innerPadding={3}
                groupMode={'grouped'}
                borderRadius={5}
                defs={[
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
                ]}
                fill={[
                  { match: { id: 'current' }, id: 'gradientCurrent' },
                  { match: { id: 'comparison' }, id: 'gradientComparison' }
                ]}
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
                enableLabel={false}
                legends={[]}
                tooltip={({ id, value, indexValue }) => (
                  <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                    <strong>{indexValue}</strong>: ¥{value.toLocaleString()} 
                  </div>
                )}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无地区销售数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Top Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">订单付款方式分布</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {salesData && salesData.current && salesData.current.payment_stats ? (
              <ResponsiveBar
                {...commonBarProps}
                data={(() => {
                  // 获取所有付款方式（当前和历史）
                  const allMethods = new Set([
                    ...Object.keys(salesData.current.payment_stats),
                    ...Object.keys(salesData.previous.payment_stats || {})
                  ]);
                  
                  // 创建对比数据
                  return Array.from(allMethods).map(method => ({
                    method: method,
                    current: salesData.current.payment_stats[method] || 0,
                    comparison: salesData.previous.payment_stats?.[method] || 0
                  })).sort((a, b) => b.current - a.current);
                })()}
                keys={['current', 'comparison']}
                indexBy="method"
                margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
                padding={0.3}
                innerPadding={3}
                groupMode={'grouped'}
                borderRadius={5}
                defs={[
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
                ]}
                fill={[
                  { match: { id: 'current' }, id: 'gradientCurrent' },
                  { match: { id: 'comparison' }, id: 'gradientComparison' }
                ]}
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
                enableLabel={false}
                legends={[]}
                tooltip={({ id, value, indexValue, color, data }) => {
                  // 计算环比变化
                  const currentValue = Number(data.current) || 0;
                  const previousValue = Number(data.comparison) || 0;
                  const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;
                  
                  // 计算当前期间总付款方式数量用于百分比计算
                  const totalPaymentCount = Object.values(salesData.current.payment_stats).reduce((sum, val) => sum + (val as number), 0);
                  const percentage = totalPaymentCount > 0 ? ((currentValue / totalPaymentCount) * 100).toFixed(1) : '0.0';
                  
                  return (
                    <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                      <strong>{indexValue}</strong><br />
                      {id === 'current' ? '当前' : '对比'}: {value.toLocaleString()}<br />
                      {id === 'current' && (
                        <>
                          占比: {percentage}%<br />
                          {previousValue > 0 && (
                            <span style={{ color: change >= 0 ? 'green' : 'red' }}>
                              环比: {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无付款方式数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. Customer Segment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">客户价格区间分布</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {salesData && salesData.combinedAovData ? (
              <ResponsivePie
                data={(() => {
                  // 计算总数
                  const total = salesData.combinedAovData.reduce((sum, item) => sum + item.current, 0);
                  // 计算每个区间的百分比
                  return salesData.combinedAovData.map(item => ({
                    id: item.label,
                    label: item.label,
                    value: total > 0 ? Math.round((item.current / total) * 100) : 0,
                    color: item.label === '0-100' ? '#818cf8' :
                           item.label === '100-500' ? '#6366f1' :
                           item.label === '500-1000' ? '#4f46e5' : '#4338ca',
                  }));
                })()}
                margin={{ top: 30, right: 30, bottom: 70, left: 30 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ datum: 'data.color' }}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#555555"
                arcLinkLabelsThickness={1.5}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                enableArcLabels={false}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 20,
                    translateY: 60,
                    itemsSpacing: 6,
                    itemWidth: 80,
                    itemHeight: 10,
                    itemTextColor: '#555',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolSpacing: 6,
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
                tooltip={({ datum }) => {
                  // 获取原始数据中的订单数量
                  const originalItem = salesData?.combinedAovData?.find(item => item.label === datum.id);
                  const orderCount = originalItem ? originalItem.current : 0;
                  
                  return (
                    <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                      <strong>{datum.id}</strong><br />
                      {orderCount} 订单 ({datum.value}%)
                    </div>
                  );
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无客户价格区间数据
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}