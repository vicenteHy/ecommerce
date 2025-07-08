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
import { format } from "date-fns";
import { DateTimeSelector } from "@/components/date-time-selector";

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

// 定义API返回的销量数据接口
interface SalesItem {
  date: string;
  total_items_sold: number;
}

interface DailyComparison {
  date: string;
  current_value: number;
  previous_value: number;
  change_rate: number;
}

interface SalesComparisonData {
  current: SalesItem[];
  previous: SalesItem[];
  daily_comparison: DailyComparison[];
  summary: {
    current_total: number;
    previous_total: number;
    total_change_rate: number;
  };
}

// 定义类别销量数据接口
interface CategorySalesItem {
  category_id: string;
  category_name: string;
  order_count: number;
  item_count: number;
  order_count_change: number;
  item_count_change: number;
}

interface CategorySalesComparison {
  current: {
    categories: CategorySalesItem[];
    total_categories: number;
  };
  previous: {
    categories: Array<{
      category_id: string;
      category_name: string;
      order_count: number;
      item_count: number;
    }>;
    total_categories: number;
  };
  comparison: {
    total_categories_change: number;
  };
}

// 定义类别浏览量数据接口
interface CategoryViewItem {
  category_name: string;
  current_count: number;
  previous_count: number;
  change_count: number;
  change_rate: number;
  rank: number;
}

interface CategoryViewComparison {
  current: {
    start_date: string;
    end_date: string;
    total_views: number;
  };
  previous: {
    start_date: string;
    end_date: string;
    total_views: number;
  };
  comparison: CategoryViewItem[];
}

// 定义处理后的图表数据接口
interface ProcessedProductData {
  salesComparison: SalesComparisonData;
  categorySalesData: CategorySalesComparison | null;
  categoryViewData: CategoryViewComparison | null;
  lineChartSalesData: Array<{
    id: string;
    data: Array<{
      x: Date;
      y: number;
    }>;
  }>;
  categorySalesBarData: Array<{
    category: string;
    item_count: number;
    order_count: number;
  }>;
  categoryViewBarData: Array<{
    category: string;
    current: number;
    comparison: number;
  }>;
  // 保留其他可能需要的数据结构
  totalSales: number;
  salesChange: number;
}

export default function ProductsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  // 新增商品数据状态
  const [productData, setProductData] = useState<ProcessedProductData | null>(null);
  // 新增类别销量数据状态
  const [categorySalesData, setCategorySalesData] = useState<CategorySalesComparison | null>(null);
  // 新增类别浏览量数据状态
  const [categoryViewData, setCategoryViewData] = useState<CategoryViewComparison | null>(null);
  // 新增日期范围选择状态
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
  
  // 处理商品数据和图表数据转换
  const processProductData = (data: SalesComparisonData, categoryData: CategorySalesComparison | null, viewData: CategoryViewComparison | null): ProcessedProductData | null => {
    if (!data) return null;
    
    // 准备商品销量图表数据
    const prepareSalesChartData = () => {
      if (!data.current || data.current.length === 0) return [];
      
      // 当前时间段销量数据转换为线图格式
      const currentSalesData = data.current.map((item) => ({
        x: new Date(item.date),
        y: item.total_items_sold
      }));
      
      // 上一时间段销量数据转换为线图格式
      const previousSalesData = data.previous.map((item) => ({
        x: new Date(item.date),
        y: item.total_items_sold
      }));
      
      // 返回两条线的数据
      return [
        {
          id: '当前时段',
          data: currentSalesData
        },
        {
          id: '对比时段',
          data: previousSalesData
        }
      ];
    };
    
    // 准备类别销量条形图数据
    const prepareCategorySalesBarData = () => {
      if (!categoryData || !categoryData.current.categories) return [];
      
      // 只取前10个类别
      return categoryData.current.categories.slice(0, 10).map(cat => ({
        category: cat.category_name,
        item_count: cat.item_count,
        order_count: cat.order_count
      }));
    };
    
    // 准备类别浏览量条形图数据
    const prepareCategoryViewBarData = () => {
      if (!viewData || !viewData.comparison) return [];
      
      // 使用返回的comparison数组，已经按rank排序
      return viewData.comparison.map(item => ({
        category: item.category_name,
        current: item.current_count,
        comparison: item.previous_count
      }));
    };
    
    // 返回处理后的数据
    return {
      salesComparison: data,
      categorySalesData: categoryData,
      categoryViewData: viewData,
      lineChartSalesData: prepareSalesChartData(),
      categorySalesBarData: prepareCategorySalesBarData(),
      categoryViewBarData: prepareCategoryViewBarData(),
      totalSales: data.summary.current_total,
      salesChange: data.summary.total_change_rate
    };
  };
  
  // 获取真实的商品销量数据
  const fetchProductData = async (from: Date, to: Date) => {
    setError(null);
    try {
      // 格式化日期为API需要的格式
      const startDate = formatDate(from);
      const endDate = formatDate(to);
      
      // 并行调用三个API
      const [salesResponse, categoryResponse, viewResponse] = await Promise.all([
        // 获取销量数据
        fetch(
          `http://localhost:8000/sales/items-sold/comparison?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              'accept': 'application/json'
            }
          }
        ),
        // 获取类别销量数据
        fetch(
          `http://localhost:8000/sales/categories/comparison?start_date=${startDate}&end_date=${endDate}&limit=10`,
          {
            headers: {
              'accept': 'application/json'
            }
          }
        ),
        // 获取类别浏览量数据
        fetch(
          `http://localhost:8000/product/category-view/comparison?start_date=${startDate}&end_date=${endDate}&limit=10`,
          {
            headers: {
              'accept': 'application/json'
            }
          }
        )
      ]);
      
      if (!salesResponse.ok) {
        throw new Error(`销量数据 HTTP error! status: ${salesResponse.status}`);
      }
      
      if (!categoryResponse.ok) {
        throw new Error(`类别数据 HTTP error! status: ${categoryResponse.status}`);
      }
      
      if (!viewResponse.ok) {
        throw new Error(`类别浏览量数据 HTTP error! status: ${viewResponse.status}`);
      }
      
      const salesData: SalesComparisonData = await salesResponse.json();
      const categoryData: CategorySalesComparison = await categoryResponse.json();
      const viewData: CategoryViewComparison = await viewResponse.json();
      
      // 设置类别销量数据
      setCategorySalesData(categoryData);
      // 设置类别浏览量数据
      setCategoryViewData(viewData);
      
      // 处理数据
      const processedData = processProductData(salesData, categoryData, viewData);
      setProductData(processedData);
      
    } catch (err) {
      console.error('获取商品数据错误:', err);
      setError('获取数据失败，请稍后重试');
    }
  };
  
  // 初始化时不做任何操作，等待 DateTimeSelector 组件的回调
  useEffect(() => {
    // 初始化 dashboardData
    const generatedData = generateDataForRange('today');
    setDashboardData(generatedData);
  }, []);
  
  // 处理日期范围变更
  const handleDateRangeChange = (from: Date, to: Date) => {
    setDateRange({from, to});
    setError(null); // 清除之前的错误提示
    
    // 根据日期范围更新 dashboardData
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    let rangeType = 'today';
    if (daysDiff === 0) {
      rangeType = 'today';
    } else if (daysDiff <= 7) {
      rangeType = 'last_7_days';
    } else if (daysDiff <= 30) {
      rangeType = 'last_30_days';
    } else {
      rangeType = 'last_6_months';
    }
    const generatedData = generateDataForRange(rangeType);
    setDashboardData(generatedData);
    
    fetchProductData(from, to);
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
        <DateTimeSelector onDateRangeChange={handleDateRangeChange} defaultRange="today" />
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
              {productData && productData.totalSales !== undefined ? (
                <>
                  {productData.totalSales.toLocaleString()}
                  {isFinite(productData.salesChange) && (
                    <span className={`ml-2 text-xs font-medium ${productData.salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {productData.salesChange >= 0 ? '+' : ''}{productData.salesChange.toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                <span>加载中...</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>


        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总加购量（商品）({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {productData && productData.totalSales !== undefined ? (
                <>
                  {Math.floor(productData.totalSales * 2.5).toLocaleString()}
                  {isFinite(productData.salesChange) && (
                    <span className={`ml-2 text-xs font-medium ${productData.salesChange - 1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {productData.salesChange - 1 >= 0 ? '+' : ''}{(productData.salesChange - 1).toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                <span>加载中...</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>


        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总浏览量（商品）({dashboardData.currentLabel})</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {categoryViewData && categoryViewData.current ? (
                <>
                  {categoryViewData.current.total_views.toLocaleString()}
                  {categoryViewData.previous && (
                    <span className={`ml-2 text-xs font-medium ${
                      ((categoryViewData.current.total_views - categoryViewData.previous.total_views) / categoryViewData.previous.total_views * 100) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {((categoryViewData.current.total_views - categoryViewData.previous.total_views) / categoryViewData.previous.total_views * 100) >= 0 ? '+' : ''}
                      {((categoryViewData.current.total_views - categoryViewData.previous.total_views) / categoryViewData.previous.total_views * 100).toFixed(1)}%
                      <span className="text-muted-foreground text-xs ml-1">(环比)</span>
                    </span>
                  )}
                </>
              ) : (
                <span>加载中...</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* 详细商品数据可视化 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">

        {/* 2. 销量趋势 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">商品销量趋势 ({dashboardData.currentLabel})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {productData && productData.lineChartSalesData && productData.lineChartSalesData.length > 0 ? (
              <ResponsiveLine
                key={`sales-line-${dateRange.from && dateRange.to && Math.abs(dateRange.to.getTime() - dateRange.from.getTime()) <= 86400000 ? 'hourly' : 'daily'}`}
                {...dashboardData.commonLineProps}
                data={productData.lineChartSalesData}
                colors={['#10b981', '#ef4444']} // 当前时段用绿色，对比时段用红色
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
                legends={[
                  {
                    anchor: 'top-right',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: -30,
                    itemsSpacing: 5,
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
                    <strong>{point.serieId}</strong><br/>
                    <strong>{format(new Date(point.data.x as Date), 'yyyy-MM-dd')}</strong>: {point.data.y?.toLocaleString() || '0'} 件销售
                  </div>
                )}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <span>加载销量数据中...</span>
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
            {productData && productData.categorySalesBarData && productData.categorySalesBarData.length > 0 ? (
              <ResponsiveBar
                {...dashboardData.commonBarProps}
                data={productData.categorySalesBarData.map(cat => ({
                  ...cat,
                  current: cat.item_count,
                  comparison: Math.floor(cat.item_count * 0.85) // 模拟对比数据
                }))}
                keys={['current', 'comparison']}
                indexBy="category"
                margin={{ top: 10, right: 10, bottom: 80, left: 60 }}
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
                tooltip={({ id, value, indexValue, data }) => {
                  const currentValue = Number(data.current) || 0;
                  const previousValue = Number(data.comparison) || 0;
                  const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;
                  
                  return (
                    <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                      <strong>{indexValue}</strong><br />
                      {id === 'current' ? '当前' : '对比'}: {value.toLocaleString()} 件<br />
                      {id === 'current' && data.order_count && (
                        <>订单数量: {data.order_count.toLocaleString()}<br /></>
                      )}
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
            {productData && productData.categoryViewBarData && productData.categoryViewBarData.length > 0 ? (
              <ResponsiveBar
                {...dashboardData.commonBarProps}
                data={productData.categoryViewBarData}
                keys={['current', 'comparison']}
                indexBy="category"
                margin={{ top: 10, right: 10, bottom: 80, left: 60 }}
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
                tooltip={({ id, value, indexValue, data }) => {
                  const currentValue = Number(data.current) || 0;
                  const previousValue = Number(data.comparison) || 0;
                  const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;
                  
                  return (
                    <div style={{ padding: '6px 10px', background: 'white', border: '1px solid #ccc', fontSize: '12px' }}>
                      <strong>{indexValue}</strong><br />
                      {id === 'current' ? '当前' : '对比'}: {value.toLocaleString()} 次浏览<br />
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
                  {/* 暂时显示模拟数据提示 */}
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-500">
                      暂无热销商品数据
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}