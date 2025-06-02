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

// 定义产品数据接口
interface ProductTimeData {
  time: string;
  views_count: number;
  sales_count: number;
}

interface CategoryStats {
  views: number;
  sales: number;
}

// 定义API返回的商品数据接口
interface ProductComparisonData {
  current: {
    data: {
      product_id: string;
      product_name: string;
      category: string;
      sales_count: number;
      views_count: number;
      conversion_rate: number;
      price: number;
      cost: number;
      profit: number;
      created_at: string;
    }[];
    fields: string[];
    total_products: number;
    total_views: number;
    total_sales: number;
    ave_price: number;
    ave_profit_margin: number;
    category_stats?: Record<string, CategoryStats>;
    time_aggregated_products?: ProductTimeData[];
  };
  previous: {
    data: {
      product_id: string;
      product_name: string;
      category: string;
      sales_count: number;
      views_count: number;
      conversion_rate: number;
      price: number;
      cost: number;
      profit: number;
      created_at: string;
    }[];
    fields: string[];
    total_products: number;
    total_views: number;
    total_sales: number;
    ave_price: number;
    ave_profit_margin: number;
    category_stats?: Record<string, CategoryStats>;
    time_aggregated_products?: ProductTimeData[];
  };
  comparison: {
    total_products_change: number;
    total_views_change: number;
    total_sales_change: number;
    ave_price_change: number;
    ave_profit_margin_change: number;
  };
  // 处理后的图表数据
  lineChartViewsData?: Array<{
    id: string;
    data: Array<{
      x: Date;
      y: number;
    }>;
  }>;
  lineChartSalesData?: Array<{
    id: string;
    data: Array<{
      x: Date;
      y: number;
    }>;
  }>;
  combinedCategoryData?: Array<{
    category: string;
    current_sales: number;
    comparison_sales: number;
    current_views: number;
    comparison_views: number;
  }>;
}

export default function ProductsPage() {
  const [selectedRange, setSelectedRange] = useState<string>('today');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  // 新增商品数据状态
  const [productData, setProductData] = useState<ProductComparisonData | null>(null);
  // 新增日期范围选择状态
  // 设置默认日期范围：今天往前推30天
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const [dateRange, setDateRange] = useState<DateRange>({from: thirtyDaysAgo, to: today});
  // 新增错误状态
  const [error, setError] = useState<string | null>(null);

  // 格式化日期为 YYYY-MM-DD 格式
  const formatDate = (date: Date): string => {
    try {
      return format(date, 'yyyy-MM-dd');
    } catch (err) {
      console.error('格式化日期错误:', err);
      // 返回一个备用格式
      return date.toISOString().split('T')[0];
    }
  };
  
  // 处理商品数据和图表数据转换
  const processProductData = (data: any) => {
    if (!data) return null;
    
    // 准备商品浏览量图表数据
    const prepareViewsChartData = () => {
      if (!data.current.time_aggregated_products) return [];
      
      // 当前时间段浏览量数据转换为线图格式
      const currentViewsData = data.current.time_aggregated_products.map((item: any) => ({
        x: new Date(item.time),
        y: item.views_count
      }));
      
      // 只返回当前时间段数据
      return [
        {
          id: 'current',
          data: currentViewsData
        }
      ];
    };
    
    // 准备商品销量图表数据
    const prepareSalesChartData = () => {
      if (!data.current.time_aggregated_products) return [];
      
      // 当前时间段销量数据转换为线图格式
      const currentSalesData = data.current.time_aggregated_products.map((item: any) => ({
        x: new Date(item.time),
        y: item.sales_count
      }));
      
      // 只返回当前时间段数据
      return [
        {
          id: 'current',
          data: currentSalesData
        }
      ];
    };
    
    // 准备商品类别数据
    const prepareCategoryData = () => {
      if (!data.current.category_stats) return [];
      
      // 按销量排序类别
      const sortedCategories = Object.entries(data.current.category_stats)
        .map(([category, stats]: [string, any]) => ({
          category: category === '0' ? '未分类' : category,
          sales: stats.sales,
          views: stats.views
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10); // 取前10名
      
      // 转换为图表数据格式
      return sortedCategories.map((item) => {
        const previousStats = data.previous.category_stats[item.category === '未分类' ? '0' : item.category];
        return {
          category: item.category,
          current_sales: item.sales,
          comparison_sales: previousStats ? previousStats.sales : 0,
          current_views: item.views,
          comparison_views: previousStats ? previousStats.views : 0
        };
      });
    };
    
    
    // 更新数据
    return {
      ...data,
      lineChartViewsData: prepareViewsChartData(),
      lineChartSalesData: prepareSalesChartData(),
      combinedCategoryData: prepareCategoryData()
    };
  };
  
  // 模拟获取后端商品数据
  const fetchProductData = async (from: Date, to: Date) => {
    setError(null);
    try {
      // 在实际应用中，这里会是真实的API调用
      // 现在我们模拟一些数据
      
      // 生成模拟数据
      const mockData = {
        current: {
          data: Array(50).fill(null).map((_, index) => ({
            product_id: `P${1000 + index}`,
            product_name: `商品${index + 1}`,
            category: ['服装', '电子产品', '家居', '食品', '美妆'][Math.floor(Math.random() * 5)],
            sales_count: Math.floor(Math.random() * 100),
            views_count: Math.floor(Math.random() * 1000),
            conversion_rate: Math.random() * 0.3,
            price: Math.floor(Math.random() * 1000) + 10,
            cost: Math.floor(Math.random() * 500) + 5,
            profit: Math.floor(Math.random() * 500) + 5,
            created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString()
          })),
          fields: ['product_id', 'product_name', 'category', 'sales_count', 'views_count', 'stock_level', 'conversion_rate', 'price', 'cost', 'profit', 'created_at'],
          total_products: 50,
          total_views: 25000,
          total_sales: 2500,
          ave_price: 250,
          ave_profit_margin: 0.4
        },
        previous: {
          data: Array(45).fill(null).map((_, index) => ({
            product_id: `P${1000 + index}`,
            product_name: `商品${index + 1}`,
            category: ['服装', '电子产品', '家居', '食品', '美妆'][Math.floor(Math.random() * 5)],
            sales_count: Math.floor(Math.random() * 90),
            views_count: Math.floor(Math.random() * 900),
            conversion_rate: Math.random() * 0.25,
            price: Math.floor(Math.random() * 950) + 10,
            cost: Math.floor(Math.random() * 450) + 5,
            profit: Math.floor(Math.random() * 450) + 5,
            created_at: new Date(Date.now() - Math.random() * 15000000000).toISOString()
          })),
          fields: ['product_id', 'product_name', 'category', 'sales_count', 'views_count', 'stock_level', 'conversion_rate', 'price', 'cost', 'profit', 'created_at'],
          total_products: 45,
          total_views: 22000,
          total_sales: 2200,
          ave_price: 240,
          ave_profit_margin: 0.38
        },
        comparison: {
          total_products_change: 11.11,
          total_views_change: 13.64,
          total_sales_change: 13.64,
          ave_price_change: 4.17,
          ave_profit_margin_change: 5.26
        }
      };
      
      // 添加类别统计
      const categoryStats: Record<string, CategoryStats> = {};
      const prevCategoryStats: Record<string, CategoryStats> = {};
      
      // 当前数据的类别统计
      mockData.current.data.forEach(product => {
        if (!categoryStats[product.category]) {
          categoryStats[product.category] = {
            views: 0,
            sales: 0
          };
        }
        categoryStats[product.category].views += product.views_count;
        categoryStats[product.category].sales += product.sales_count;
      });
      
      // 前期数据的类别统计
      mockData.previous.data.forEach(product => {
        if (!prevCategoryStats[product.category]) {
          prevCategoryStats[product.category] = {
            views: 0,
            sales: 0
          };
        }
        prevCategoryStats[product.category].views += product.views_count;
        prevCategoryStats[product.category].sales += product.sales_count;
      });
      
      mockData.current.category_stats = categoryStats;
      mockData.previous.category_stats = prevCategoryStats;
      
      // 添加时间聚合数据
      const daysInRange = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      const timeAggregated: ProductTimeData[] = [];
      const prevTimeAggregated: ProductTimeData[] = [];
      
      for (let i = 0; i < daysInRange; i++) {
        const date = new Date(from);
        date.setDate(from.getDate() + i);
        
        // 当前时间的数据
        timeAggregated.push({
          time: formatDate(date),
          views_count: Math.floor(Math.random() * 1000) + 500,
          sales_count: Math.floor(Math.random() * 100) + 50
        });
        
        // 前期时间的数据（稍低一些）
        prevTimeAggregated.push({
          time: formatDate(date),
          views_count: Math.floor(Math.random() * 900) + 450,
          sales_count: Math.floor(Math.random() * 90) + 45
        });
      }
      
      mockData.current.time_aggregated_products = timeAggregated;
      mockData.previous.time_aggregated_products = prevTimeAggregated;
      
      // 处理数据
      const processedData = processProductData(mockData);
      setProductData(processedData);
      
    } catch (err) {
      console.error('获取商品数据错误:', err);
      setError('获取数据失败，请稍后重试');
    }
  };
  
  useEffect(() => {
    console.log("Selected range changed:", selectedRange);
    // Generate data dynamically using the imported function
    const generatedData = generateDataForRange(selectedRange);
    setDashboardData(generatedData);
    
    // 根据选择的范围设置日期
    const today = new Date();
    let from = new Date(today);
    let to = new Date(today);
    
    switch (selectedRange) {
      case 'last_7_days':
        from.setDate(today.getDate() - 6);
        break;
      case 'last_30_days':
        from.setDate(today.getDate() - 29);
        break;
      case 'last_6_months':
        from.setMonth(today.getMonth() - 5);
        from.setDate(1);
        break;
      default: // 'today'
        // 对于今天，使用今天的0点到23:59
        from = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        to = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        break;
    }
    
    setDateRange({from, to} as DateRange);
    console.log('设置日期范围:', {from: formatDate(from), to: formatDate(to)});
    fetchProductData(from, to);
  }, [selectedRange]);
  
  // 处理日期范围变更
  const handleDateRangeChange = (range: DateRange) => {
    if (range.from && range.to) {
      // 检查日期范围是否合理
      if (range.from > range.to) {
        setError('起始日期不能大于结束日期');
        return;
      }
      
      setDateRange(range);
      setError(null); // 清除之前的错误提示
      fetchProductData(range.from, range.to);
    }
  };

  if (!dashboardData) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // 计算浏览量和销量图表的Y轴最大值
  const calculateYMax = (maxValue: number): number => {
    if (maxValue <= 0) return 500; // 默认最大值

    // 基于最大值确定步长
    let step = 100;
    if (maxValue > 10000) {
      step = 1000;
    } else if (maxValue > 1000) {
      step = 500;
    }

    let ceilValue = Math.ceil(maxValue / step) * step;

    // 确保计算的最大值严格大于数据最大值
    if (ceilValue <= maxValue) {
      ceilValue += step;
    }
    // 如果最大值太接近上限，确保有最小的间隙
    if (maxValue > ceilValue * 0.95) {
      ceilValue += step;
    }

    return ceilValue;
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商品数据</h1>
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
                // 如果结束日期是未来，调整为今天
                const adjustedRange: DateRange = {
                  from: range.from,
                  to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
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

      {/* 商品数据概览 */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总销售量（商品）({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {productData && productData.current && productData.current.total_sales !== undefined ? (
                <>
                  {productData.current.total_sales.toLocaleString()}
                  {productData.comparison && isFinite(productData.comparison.total_sales_change) && (
                    <span className={`ml-2 text-xs font-medium ${productData.comparison.total_sales_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {productData.comparison.total_sales_change >= 0 ? '+' : ''}{productData.comparison.total_sales_change.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {(dashboardData.totalItemsPurchased || 0).toLocaleString()}
                  {isFinite(dashboardData.itemsPurchasedChange || 0) && (
                    <span className={`ml-2 text-xs font-medium ${(dashboardData.itemsPurchasedChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(dashboardData.itemsPurchasedChange || 0) >= 0 ? '+' : ''}{(dashboardData.itemsPurchasedChange || 0).toFixed(1)}%
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
            <CardTitle className="text-sm font-medium text-muted-foreground">总加购量（商品）({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {productData && productData.current ? (
                <>
                  {Math.floor(productData.current.total_sales * 2.5).toLocaleString()}
                  {productData.comparison && isFinite(productData.comparison.total_sales_change) && (
                    <span className={`ml-2 text-xs font-medium ${productData.comparison.total_sales_change - 1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {productData.comparison.total_sales_change - 1 >= 0 ? '+' : ''}{(productData.comparison.total_sales_change - 1).toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {Math.floor((dashboardData.totalItemsPurchased || 0) * 2.5).toLocaleString()}
                  {isFinite(dashboardData.itemsPurchasedChange || 0) && (
                    <span className={`ml-2 text-xs font-medium ${((dashboardData.itemsPurchasedChange || 0) - 0.8) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {((dashboardData.itemsPurchasedChange || 0) - 0.8) >= 0 ? '+' : ''}{((dashboardData.itemsPurchasedChange || 0) - 0.8).toFixed(1)}%
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
            <CardTitle className="text-sm font-medium text-muted-foreground">总浏览量（商品）({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {productData && productData.current && productData.current.total_views !== undefined ? (
                <>
                  {productData.current.total_views.toLocaleString()}
                  {productData.comparison && isFinite(productData.comparison.total_views_change) && (
                    <span className={`ml-2 text-xs font-medium ${productData.comparison.total_views_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {productData.comparison.total_views_change >= 0 ? '+' : ''}{productData.comparison.total_views_change.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {(dashboardData.totalViews || 0).toLocaleString()}
                  {isFinite(dashboardData.viewsChange || 0) && (
                    <span className={`ml-2 text-xs font-medium ${(dashboardData.viewsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(dashboardData.viewsChange || 0) >= 0 ? '+' : ''}{(dashboardData.viewsChange || 0).toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(对比 {dashboardData.comparisonLabel})</span>
                    </span>
                  )}
                </>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* 详细商品数据可视化 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* 1. 浏览量趋势 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">商品浏览量趋势 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {productData && productData.lineChartViewsData ? (
              <ResponsiveLine
                key={`views-line-${dateRange.from && dateRange.to && Math.abs(dateRange.to.getTime() - dateRange.from.getTime()) <= 86400000 ? 'hourly' : 'daily'}`}
                {...dashboardData.commonLineProps}
                data={productData.lineChartViewsData}
                colors={['#6366f1']} // 只显示当前数据
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
                  max: calculateYMax(Math.max(...productData.lineChartViewsData
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
                    <strong>{format(new Date(point.data.x as Date), 'yyyy-MM-dd')}</strong>: {point.data.y?.toLocaleString() || '0'} 次浏览
                  </div>
                )}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <span>无浏览量数据</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. 销量趋势 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">商品销量趋势 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {productData && productData.lineChartSalesData ? (
              <ResponsiveLine
                key={`sales-line-${dateRange.from && dateRange.to && Math.abs(dateRange.to.getTime() - dateRange.from.getTime()) <= 86400000 ? 'hourly' : 'daily'}`}
                {...dashboardData.commonLineProps}
                data={productData.lineChartSalesData}
                colors={['#10b981']} // 销量用绿色
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
                  max: calculateYMax(Math.max(...productData.lineChartSalesData
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
                    <strong>{format(new Date(point.data.x as Date), 'yyyy-MM-dd')}</strong>: {point.data.y?.toLocaleString() || '0'} 件销售
                  </div>
                )}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <span>无销量数据</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. 按类别销售量 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">类别销量 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {productData && productData.combinedCategoryData ? (
              <ResponsiveBar
                {...dashboardData.commonBarProps}
                data={productData.combinedCategoryData}
                keys={['current_sales', 'comparison_sales']}
                indexBy="category"
                margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
                padding={0.3}
                defs={dashboardData.gradientDefs}
                fill={[
                  { match: { id: 'current_sales' }, id: 'gradientCurrent' },
                  { match: { id: 'comparison_sales' }, id: 'gradientComparison' }
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
                legends={[]}
                tooltip={({ id, value, indexValue }) => (
                  <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                    <strong>{indexValue}</strong>: {value.toLocaleString()} 销量
                  </div>
                )}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <span>无类别销量数据</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. 按类别浏览量 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">类别浏览量 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {productData && productData.combinedCategoryData ? (
              <ResponsiveBar
                {...dashboardData.commonBarProps}
                data={productData.combinedCategoryData}
                keys={['current_views', 'comparison_views']}
                indexBy="category"
                margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
                padding={0.3}
                colors={['#6366f1', '#a5b4fc']} // 浏览量用蓝色系
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
                legends={[]}
                tooltip={({ id, value, indexValue }) => (
                  <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                    <strong>{indexValue}</strong>: {value.toLocaleString()} 次浏览
                  </div>
                )}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <span>无类别浏览量数据</span>
              </div>
            )}
          </CardContent>
        </Card>



        {/* 7. 热销商品排名 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">热销商品排名 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">排名</th>
                    <th className="text-left pb-2">商品名称</th>
                    <th className="text-left pb-2">类别</th>
                    <th className="text-left pb-2">单价</th>
                    <th className="text-left pb-2">销量</th>
                    <th className="text-left pb-2">浏览量</th>
                    <th className="text-left pb-2">转化率</th>
                  </tr>
                </thead>
                <tbody>
                  {productData && productData.current && productData.current.data ? (
                    productData.current.data
                      .sort((a, b) => b.sales_count - a.sales_count)
                      .slice(0, 10)
                      .map((product, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3">{index + 1}</td>
                          <td className="py-3">{product.product_name}</td>
                          <td className="py-3">{product.category}</td>
                          <td className="py-3">¥{product.price.toFixed(2)}</td>
                          <td className="py-3">{product.sales_count}</td>
                          <td className="py-3">{product.views_count}</td>
                          <td className="py-3">{product.conversion_rate ? (product.conversion_rate * 100).toFixed(2) : '0.00'}%</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center">无商品数据</td>
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