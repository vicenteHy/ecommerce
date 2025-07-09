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

// 定义加购数据接口
interface CartQuantityComparison {
  current: {
    start_date: string;
    end_date: string;
    total_unique_users: number;
    total_cart_events: number;
    total_quantity: number;
    avg_quantity_per_event: number;
    avg_quantity_per_user: number;
  };
  previous: {
    start_date: string;
    end_date: string;
    total_unique_users: number;
    total_cart_events: number;
    total_quantity: number;
    avg_quantity_per_event: number;
    avg_quantity_per_user: number;
  };
  comparison: {
    unique_users: {
      current: number;
      previous: number;
      change: number;
      change_rate: number;
    };
    cart_events: {
      current: number;
      previous: number;
      change: number;
      change_rate: number;
    };
    total_quantity: {
      current: number;
      previous: number;
      change: number;
      change_rate: number;
    };
    avg_quantity_per_event: {
      current: number;
      previous: number;
      change: number;
      change_rate: number;
    };
    avg_quantity_per_user: {
      current: number;
      previous: number;
      change: number;
      change_rate: number;
    };
  };
  daily_comparison: Array<{
    date: string;
    unique_users: number;
    cart_events: number;
    total_quantity: number;
    previous_unique_users: number;
    previous_cart_events: number;
    previous_total_quantity: number;
    quantity_change: number;
    quantity_change_rate: number;
  }>;
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

// 定义热销商品数据接口
interface BestsellerItem {
  rank: number;
  offer_id: string;
  product_name: string;
  category_name: string;
  product_image: string;
  total_quantity: number;
  total_revenue_cny: number;
  total_revenue_original: number;
  original_currency: string;
  order_count: number;
  avg_unit_price_cny: number;
  price_range_cny: {
    min: number;
    max: number;
  };
}

interface BestsellersData {
  data: BestsellerItem[];
  summary: {
    start_date: string;
    end_date: string;
    sort_by: string;
    total_products: number;
    total_quantity_sold: number;
    total_revenue_cny: number;
    total_orders: number;
  };
}

// 定义处理后的图表数据接口
interface ProcessedProductData {
  salesComparison: SalesComparisonData;
  categorySalesData: CategorySalesComparison | null;
  categoryViewData: CategoryViewComparison | null;
  cartData: CartQuantityComparison | null;
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
  totalCartQuantity: number;
  cartQuantityChange: number;
}

export default function ProductsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  // 新增商品数据状态
  const [productData, setProductData] = useState<ProcessedProductData | null>(null);
  // 新增类别销量数据状态
  const [categorySalesData, setCategorySalesData] = useState<CategorySalesComparison | null>(null);
  // 新增类别浏览量数据状态
  const [categoryViewData, setCategoryViewData] = useState<CategoryViewComparison | null>(null);
  // 新增加购数据状态
  const [cartData, setCartData] = useState<CartQuantityComparison | null>(null);
  // 新增日期范围选择状态
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({from: new Date(), to: new Date()});
  // 新增错误状态
  const [error, setError] = useState<string | null>(null);
  // 新增热销商品状态
  const [bestsellersData, setBestsellersData] = useState<BestsellersData | null>(null);
  const [bestsellersSort, setBestsellersSort] = useState<string>('quantity');
  const [bestsellersLimit, setBestsellersLimit] = useState<number>(20);
  const [bestsellersLoading, setBestsellersLoading] = useState<boolean>(false);
  // 新增图片预览状态
  const [previewImage, setPreviewImage] = useState<{url: string; name: string} | null>(null);

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
  const processProductData = (data: SalesComparisonData, categoryData: CategorySalesComparison | null, viewData: CategoryViewComparison | null, cartData: CartQuantityComparison | null): ProcessedProductData | null => {
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
      cartData: cartData,
      lineChartSalesData: prepareSalesChartData(),
      categorySalesBarData: prepareCategorySalesBarData(),
      categoryViewBarData: prepareCategoryViewBarData(),
      totalSales: data.summary.current_total,
      salesChange: data.summary.total_change_rate,
      totalCartQuantity: cartData?.current?.total_quantity || 0,
      cartQuantityChange: cartData?.comparison?.total_quantity?.change_rate || 0
    };
  };
  
  // 获取热销商品数据
  const fetchBestsellersData = async (from: Date, to: Date, sort: string, limit: number) => {
    setBestsellersLoading(true);
    try {
      const startDate = formatDate(from);
      const endDate = formatDate(to);
      
      const response = await fetch(
        `http://localhost:8000/product/bestsellers?start_date=${startDate}&end_date=${endDate}&sort_by=${sort}&limit=${limit}`,
        {
          headers: {
            'accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`热销商品数据 HTTP error! status: ${response.status}`);
      }
      
      const data: BestsellersData = await response.json();
      setBestsellersData(data);
    } catch (err) {
      console.error('获取热销商品数据错误:', err);
    } finally {
      setBestsellersLoading(false);
    }
  };

  // 获取真实的商品销量数据
  const fetchProductData = async (from: Date, to: Date) => {
    setError(null);
    try {
      // 格式化日期为API需要的格式
      const startDate = formatDate(from);
      const endDate = formatDate(to);
      
      // 并行调用四个API
      const [salesResponse, categoryResponse, viewResponse, cartResponse] = await Promise.all([
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
        ),
        // 获取加购数据
        fetch(
          `http://localhost:8000/product/cart/quantity/comparison?start_date=${startDate}&end_date=${endDate}`,
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
      
      if (!cartResponse.ok) {
        throw new Error(`加购数据 HTTP error! status: ${cartResponse.status}`);
      }
      
      const salesData: SalesComparisonData = await salesResponse.json();
      const categoryData: CategorySalesComparison = await categoryResponse.json();
      const viewData: CategoryViewComparison = await viewResponse.json();
      const cartData: CartQuantityComparison = await cartResponse.json();
      
      // 设置类别销量数据
      setCategorySalesData(categoryData);
      // 设置类别浏览量数据
      setCategoryViewData(viewData);
      // 设置加购数据
      setCartData(cartData);
      
      // 处理数据
      const processedData = processProductData(salesData, categoryData, viewData, cartData);
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
  
  // 监听排序方式和数量变化
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchBestsellersData(dateRange.from, dateRange.to, bestsellersSort, bestsellersLimit);
    }
  }, [bestsellersSort, bestsellersLimit]);
  
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
    fetchBestsellersData(from, to, bestsellersSort, bestsellersLimit);
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
            <CardTitle className="text-sm font-medium text-muted-foreground">总销售量（商品）</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">总加购量（商品）</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center">
              {productData && productData.totalCartQuantity !== undefined ? (
                <>
                  {productData.totalCartQuantity.toLocaleString()}
                  {isFinite(productData.cartQuantityChange) && (
                    <span className={`ml-2 text-xs font-medium ${productData.cartQuantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {productData.cartQuantityChange >= 0 ? '+' : ''}{productData.cartQuantityChange.toFixed(1)}%
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
            <CardTitle className="text-sm font-medium text-muted-foreground">总浏览量（商品）</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">商品销量趋势</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {productData && productData.lineChartSalesData && productData.lineChartSalesData.length > 0 ? (
              (dateRange.from && dateRange.to && Math.abs(dateRange.to.getTime() - dateRange.from.getTime()) < 86400000 && 
               productData.lineChartSalesData[0]?.data.length === 1) ? (
                // 单天数据显示为大数字
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-6xl font-bold text-black mb-4">
                    {productData.totalSales.toLocaleString()}
                  </div>
                  <div className="text-xl text-gray-600 mb-2">
                    今日商品销售量
                  </div>
                  {isFinite(productData.salesChange) && (
                    <div className={`mt-4 text-lg font-medium ${
                      productData.salesChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {productData.salesChange >= 0 ? '↑' : '↓'} 
                      {' '}{Math.abs(productData.salesChange).toFixed(1)}%
                      <span className="text-sm text-gray-500 ml-2">环比</span>
                    </div>
                  )}
                </div>
              ) : (
                // 多天数据显示折线图
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
              )
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
            <CardTitle className="text-sm font-medium text-muted-foreground">类别销量</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">类别浏览量</CardTitle>
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
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">热销商品排名</CardTitle>
              <div className="flex gap-2">
                <select 
                  value={bestsellersSort}
                  onChange={(e) => setBestsellersSort(e.target.value)}
                  className="px-3 py-1 text-sm border rounded-md bg-white"
                >
                  <option value="quantity">按销量</option>
                  <option value="revenue">按销售额</option>
                  <option value="orders">按订单数</option>
                </select>
                <select 
                  value={bestsellersLimit}
                  onChange={(e) => setBestsellersLimit(Number(e.target.value))}
                  className="px-3 py-1 text-sm border rounded-md bg-white"
                >
                  <option value={10}>10条</option>
                  <option value={20}>20条</option>
                  <option value={50}>50条</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm">
                    <th className="text-left pb-2 pr-2">排名</th>
                    <th className="text-left pb-2 pr-2">商品图片</th>
                    <th className="text-left pb-2 pr-2">商品ID</th>
                    <th className="text-left pb-2 pr-2 min-w-[200px]">商品名称</th>
                    <th className="text-left pb-2 pr-2">类别</th>
                    <th className="text-left pb-2 pr-2">销量</th>
                    <th className="text-left pb-2 pr-2">销售额</th>
                    <th className="text-left pb-2 pr-2">订单数</th>
                    <th className="text-left pb-2 pr-2">均价</th>
                    <th className="text-left pb-2">价格区间</th>
                  </tr>
                </thead>
                <tbody>
                  {bestsellersData ? (
                    bestsellersData.data.map((item) => (
                      <tr key={item.offer_id} className="border-b hover:bg-gray-50">
                        <td className="py-2 pr-2 text-sm">{item.rank}</td>
                        <td className="py-2 pr-2">
                          <img 
                            src={item.product_image} 
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setPreviewImage({url: item.product_image, name: item.product_name})}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.png';
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 text-sm font-mono">{item.offer_id}</td>
                        <td className="py-2 pr-2 text-sm max-w-[300px] truncate" title={item.product_name}>
                          {item.product_name}
                        </td>
                        <td className="py-2 pr-2 text-sm">{item.category_name}</td>
                        <td className="py-2 pr-2 text-sm font-medium">{item.total_quantity.toLocaleString('zh-CN')}</td>
                        <td className="py-2 pr-2 text-sm font-medium">¥{item.total_revenue_cny.toFixed(2)}</td>
                        <td className="py-2 pr-2 text-sm">{item.order_count}</td>
                        <td className="py-2 pr-2 text-sm">¥{item.avg_unit_price_cny.toFixed(2)}</td>
                        <td className="py-2 text-sm">
                          ¥{item.price_range_cny.min.toFixed(2)} - ¥{item.price_range_cny.max.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-4 text-center text-gray-500">
                        {bestsellersLoading ? '加载中...' : '暂无热销商品数据'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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