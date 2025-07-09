"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimeSelector } from "@/components/date-time-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveLine } from "@nivo/line";
import { Search, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { SearchMetrics, SearchTermData, SearchClickPosition, SearchBehavior, SearchSource, SearchDevice } from "@/lib/dashboard-data";

interface DailySearchData {
  date: string;
  search_count: number;
  unique_users: number;
}

interface SearchCountData {
  daily_data: DailySearchData[];
  summary: {
    total_search_count: number;
    total_unique_users: number;
    start_date: string;
    end_date: string;
  };
}

interface SearchCountComparison {
  current: DailySearchData[];
  previous: DailySearchData[];
  daily_comparison: Array<{
    date: string;
    current_search_count: number;
    current_unique_users: number;
    previous_search_count: number;
    previous_unique_users: number;
    search_count_change_rate: number;
    unique_users_change_rate: number;
  }>;
  summary: {
    current_total_search_count: number;
    current_total_unique_users: number;
    previous_total_search_count: number;
    previous_total_unique_users: number;
    search_count_change_rate: number;
    unique_users_change_rate: number;
  };
}

export default function SearchPage() {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({from: new Date(), to: new Date()});
  const [searchMetrics, setSearchMetrics] = useState<SearchMetrics | null>(null);
  const [topSearchTerms, setTopSearchTerms] = useState<SearchTermData[]>([]);
  const [searchTrends, setSearchTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCountData, setSearchCountData] = useState<SearchCountData | null>(null);
  const [searchComparisonData, setSearchComparisonData] = useState<SearchCountComparison | null>(null);

  // 格式化日期为 YYYY-MM-DD 格式
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 判断日期范围是否为今天
  const isToday = () => {
    if (!dateRange.from || !dateRange.to) return false;
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // 比较日期，忽略毫秒差异
    const fromDateOnly = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
    const toDateOnly = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return fromDateOnly.getTime() === todayDateOnly.getTime() && 
           toDateOnly.getTime() === todayDateOnly.getTime();
  };

  // 判断是否为单日数据
  const isSingleDay = () => {
    if (!dateRange.from || !dateRange.to) return false;
    
    const fromDateOnly = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
    const toDateOnly = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
    
    return fromDateOnly.getTime() === toDateOnly.getTime();
  };

  // 根据时间范围生成不同的数据
  const generateMockData = (timeRange: string) => {
    // 根据时间范围调整数据规模
    let dataMultiplier = 1;
    let trendLength = 24; // 默认24小时
    
    switch (timeRange) {
      case 'last_7_days':
        dataMultiplier = 7;
        trendLength = 7; // 7天
        break;
      case 'last_30_days':
        dataMultiplier = 30;
        trendLength = 30; // 30天
        break;
      case 'last_6_months':
        dataMultiplier = 180;
        trendLength = 6; // 6个月
        break;
    }

    // 使用真实的搜索总量数据，如果没有则使用默认值
    const totalSearchesCount = searchMetrics?.totalSearches || Math.floor(15000 * dataMultiplier);
    const baseSearches = totalSearchesCount / dataMultiplier;
    
    // 设置模拟的平均搜索深度和转化率
    if (!searchMetrics?.avgSearchDepth || !searchMetrics?.searchConversionRate) {
      setSearchMetrics(prev => prev ? ({
        ...prev,
        avgSearchDepth: prev.avgSearchDepth || parseFloat((Math.random() * 1.5 + 2.5).toFixed(2)),
        searchConversionRate: prev.searchConversionRate || parseFloat((Math.random() * 10 + 15).toFixed(2)),
        change: {
          ...prev.change,
          avgSearchDepth: prev.change.avgSearchDepth || parseFloat((Math.random() * 10 - 5).toFixed(2)),
          searchConversionRate: prev.change.searchConversionRate || parseFloat((Math.random() * 5 - 2).toFixed(2)),
        },
      }) : null);
    }

    // 热门搜索词 - 增加更多搜索词
    const allSearchTerms = [
      "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max", "笔记本电脑", "MacBook Air", "MacBook Pro",
      "无线耳机", "AirPods Pro", "索尼耳机", "智能手表", "Apple Watch", "小米手环",
      "平板电脑", "iPad Pro", "华为平板", "充电宝", "快充充电器", "无线充电器",
      "机械键盘", "游戏鼠标", "4K显示器", "手机壳", "钢化膜", "数据线",
      "蓝牙音箱", "智能音箱", "路由器", "移动硬盘", "U盘", "内存条"
    ];
    
    // 随机选择15个搜索词
    const selectedTerms = allSearchTerms
      .sort(() => Math.random() - 0.5)
      .slice(0, 15);
    
    const searchTerms: SearchTermData[] = selectedTerms.map((term, index) => {
      const termBaseSearches = Math.floor((3000 - index * 150) * dataMultiplier * (0.8 + Math.random() * 0.4));
      const searches = Math.max(100, termBaseSearches);
      const clicks = Math.floor(searches * (0.5 + Math.random() * 0.3));
      const conversions = Math.floor(clicks * (0.1 + Math.random() * 0.2));
      
      return {
        term,
        searches,
        clicks,
        conversions,
        ctr: parseFloat(((clicks / searches) * 100).toFixed(2)),
        conversionRate: parseFloat(((conversions / searches) * 100).toFixed(2)),
      };
    }).sort((a, b) => b.searches - a.searches);

    // 搜索趋势数据现在由API提供，不再生成模拟数据

    // 只设置模拟数据，不覆盖从API获取的搜索指标
    setTopSearchTerms(searchTerms);
  };

  // 获取搜索统计数据
  const fetchSearchCount = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/search/count?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('获取搜索统计数据 URL:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch search count');
      const data = await response.json();
      console.log('搜索统计数据:', data);
      setSearchCountData(data);
      
      // 设置核心指标
      if (data.summary) {
        setSearchMetrics(prev => ({
          totalSearches: data.summary.total_search_count,
          uniqueSearchUsers: data.summary.total_unique_users,
          avgSearchDepth: prev?.avgSearchDepth || 3.2,
          searchConversionRate: prev?.searchConversionRate || 18.5,
          change: prev?.change || {
            totalSearches: 0,
            uniqueSearchUsers: 0,
            avgSearchDepth: 0,
            searchConversionRate: 0,
          },
        }));
      }
    } catch (err) {
      console.log('获取搜索统计失败:', err);
    }
  };

  // 获取搜索对比数据
  const fetchSearchComparison = async (from: Date, to: Date) => {
    try {
      const url = `http://localhost:8000/search/count/comparison?start_date=${formatDate(from)}&end_date=${formatDate(to)}`;
      console.log('获取搜索对比数据 URL:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch search comparison');
      const data = await response.json();
      console.log('搜索对比数据:', data);
      setSearchComparisonData(data);
      
      // 更新变化率
      if (data.summary) {
        setSearchMetrics(prev => prev ? ({
          ...prev,
          change: {
            totalSearches: data.summary.search_count_change_rate,
            uniqueSearchUsers: data.summary.unique_users_change_rate,
            avgSearchDepth: prev.change.avgSearchDepth,
            searchConversionRate: prev.change.searchConversionRate,
          },
        }) : null);
      }

      // 准备趋势图数据
      if (data.current && Array.isArray(data.current) && data.current.length > 0) {
        console.log('原始搜索趋势数据:', data.current);
        
        // 排序数据以确保日期顺序正确
        const sortedData = [...data.current].sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        const searchCountTrend = sortedData.map((item: DailySearchData) => {
          // 确保日期格式正确
          const dateStr = item.date ? item.date.split('-').slice(1).join('/') : '';
          const searchCount = parseInt(String(item.search_count), 10) || 0;
          
          return {
            x: dateStr,
            y: searchCount
          };
        }).filter(item => item.x !== '' && typeof item.y === 'number' && !isNaN(item.y));
        
        const uniqueUsersTrend = sortedData.map((item: DailySearchData) => {
          // 确保日期格式正确
          const dateStr = item.date ? item.date.split('-').slice(1).join('/') : '';
          const uniqueUsers = parseInt(String(item.unique_users), 10) || 0;
          
          return {
            x: dateStr,
            y: uniqueUsers
          };
        }).filter(item => item.x !== '' && typeof item.y === 'number' && !isNaN(item.y));
        
        console.log('处理后的搜索量趋势:', searchCountTrend);
        console.log('处理后的独立用户趋势:', uniqueUsersTrend);
        
        if (searchCountTrend.length > 0 && uniqueUsersTrend.length > 0) {
          setSearchTrends({
            searchCount: [{ 
              id: "搜索量", 
              data: searchCountTrend,
              color: "#6366f1"
            }],
            uniqueUsers: [{ 
              id: "独立用户", 
              data: uniqueUsersTrend,
              color: "#10b981"
            }]
          });
        } else {
          console.error('趋势数据为空:', { searchCountTrend, uniqueUsersTrend });
        }
      }
    } catch (err) {
      console.log('获取搜索对比数据失败:', err);
    }
  };

  // 尝试从API获取数据，失败时使用模拟数据
  const fetchSearchData = async (rangeType: string, from: Date, to: Date) => {
    try {
      setLoading(true);
      
      console.log('fetchSearchData 被调用:', {
        rangeType,
        from: formatDate(from),
        to: formatDate(to),
        fromDate: from,
        toDate: to
      });
      
      // 并行请求多个API
      await Promise.all([
        fetchSearchCount(from, to),
        fetchSearchComparison(from, to)
      ]);
      
      // 继续使用模拟数据的其他部分
      generateMockData(rangeType);
      setError(null);
    } catch (err) {
      console.log('使用模拟数据:', err);
      generateMockData(rangeType);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // 处理日期范围变更
  const handleDateRangeChange = (from: Date, to: Date) => {
    setDateRange({from, to});
    setLoading(true);
    
    // 根据日期范围判断时间类型
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    let rangeType = 'custom';
    
    // 检查是否是今天
    const now = new Date();
    const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const toDateOnly = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (fromDateOnly.getTime() === todayDateOnly.getTime() && toDateOnly.getTime() === todayDateOnly.getTime()) {
      rangeType = 'today';
    } else if (daysDiff === 0) {
      rangeType = 'single_day';
    } else if (daysDiff <= 7) {
      rangeType = 'last_7_days';
    } else if (daysDiff <= 30) {
      rangeType = 'last_30_days';
    } else {
      rangeType = 'last_6_months';
    }
    
    console.log('日期范围类型:', rangeType, '天数差:', daysDiff);
    
    fetchSearchData(rangeType, from, to);
  };
  
  // 初始化时不做任何操作，等待 DateTimeSelector 组件的回调
  useEffect(() => {
    // 初始化时只设置loading为false，等待用户选择日期
    setLoading(false);
  }, []);

  const formatChange = (value: number) => {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value > 0 ? "text-green-600" : "text-red-600";
  };

  // 添加无结果搜索词数据
  const [noResultTerms, setNoResultTerms] = useState<string[]>([]);
  
  useEffect(() => {
    // 生成无结果搜索词
    const noResults = [
      "未上架商品", "停产型号", "错误拼写", "过时产品", "稀有配件",
      "未知品牌", "特殊规格", "定制产品", "限量版", "概念产品"
    ].sort(() => Math.random() - 0.5).slice(0, 5);
    setNoResultTerms(noResults);
  }, [dateRange]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">搜索数据分析</h1>
        <DateTimeSelector onDateRangeChange={handleDateRangeChange} defaultRange="today" />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 核心指标卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">搜索总量</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isToday() && searchMetrics ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {searchMetrics.totalSearches.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  今日搜索总量
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {searchMetrics?.totalSearches.toLocaleString()}
                </div>
                <p className={`text-xs ${getChangeColor(searchMetrics?.change.totalSearches || 0)}`}>
                  {formatChange(searchMetrics?.change.totalSearches || 0)} 较上期
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">独立搜索用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isToday() && searchMetrics ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {searchMetrics.uniqueSearchUsers.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  今日独立用户
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {searchMetrics?.uniqueSearchUsers.toLocaleString()}
                </div>
                <p className={`text-xs ${getChangeColor(searchMetrics?.change.uniqueSearchUsers || 0)}`}>
                  {formatChange(searchMetrics?.change.uniqueSearchUsers || 0)} 较上期
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均搜索深度</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {searchMetrics?.avgSearchDepth} 页
            </div>
            <p className={`text-xs ${getChangeColor(searchMetrics?.change.avgSearchDepth || 0)}`}>
              {formatChange(searchMetrics?.change.avgSearchDepth || 0)} 较上期
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">搜索转化率</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {searchMetrics?.searchConversionRate}%
            </div>
            <p className={`text-xs ${getChangeColor(searchMetrics?.change.searchConversionRate || 0)}`}>
              {formatChange(searchMetrics?.change.searchConversionRate || 0)} 较上期
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索量趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索量趋势</CardTitle>
          <CardDescription>
            {isToday() ? "24小时搜索量变化趋势" : "搜索量变化趋势"}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {!loading && searchCountData && isSingleDay() && searchCountData.daily_data.length === 1 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-6xl font-bold text-black mb-4">
                {searchCountData.summary.total_search_count.toLocaleString()}
              </div>
              <div className="text-xl text-gray-600 mb-2">
                {isToday() ? '今日搜索量' : `${formatDate(dateRange.from).split('-').slice(1).join('/')} 搜索量`}
              </div>
              {searchComparisonData && searchComparisonData.summary.search_count_change_rate !== 0 && (
                <div className={`mt-4 text-lg font-medium ${
                  searchComparisonData.summary.search_count_change_rate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {searchComparisonData.summary.search_count_change_rate >= 0 ? '↑' : '↓'} 
                  {' '}{Math.abs(searchComparisonData.summary.search_count_change_rate).toFixed(1)}%
                  <span className="text-sm text-gray-500 ml-2">环比</span>
                </div>
              )}
            </div>
          ) : !loading && searchTrends?.searchCount && searchTrends.searchCount[0]?.data && searchTrends.searchCount[0].data.length > 1 ? (
            <ResponsiveLine
              data={searchTrends.searchCount}
              margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
              xScale={{ type: "point" }}
              yScale={{ 
                type: "linear", 
                min: 0, 
                max: "auto",
                stacked: false,
                reverse: false
              }}
              curve="catmullRom"
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                format: (value) => `${value}`
              }}
              pointSize={8}
              pointColor={{ theme: "background" }}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              enableArea={true}
              areaOpacity={0.1}
              useMesh={true}
              colors={["#6366f1"]}
              enableSlices="x"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">{loading ? "加载中..." : "暂无数据"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 热门搜索词 */}
      <Card>
        <CardHeader>
          <CardTitle>热门搜索词</CardTitle>
          <CardDescription>搜索量最高的关键词及其表现</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>搜索词</TableHead>
                <TableHead className="text-right">搜索量</TableHead>
                <TableHead className="text-right">点击率</TableHead>
                <TableHead className="text-right">转化率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSearchTerms.slice(0, 8).map((term) => (
                <TableRow key={term.term}>
                  <TableCell className="font-medium">{term.term}</TableCell>
                  <TableCell className="text-right">{term.searches.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{term.ctr}%</TableCell>
                  <TableCell className="text-right">{term.conversionRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增：搜索独立用户趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索独立用户趋势</CardTitle>
          <CardDescription>
            {isToday() ? "24小时独立用户变化趋势" : "独立用户变化趋势"}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {!loading && searchCountData && isSingleDay() && searchCountData.daily_data.length === 1 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-6xl font-bold text-black mb-4">
                {searchCountData.summary.total_unique_users.toLocaleString()}
              </div>
              <div className="text-xl text-gray-600 mb-2">
                {isToday() ? '今日独立用户' : `${formatDate(dateRange.from).split('-').slice(1).join('/')} 独立用户`}
              </div>
              {searchComparisonData && searchComparisonData.summary.unique_users_change_rate !== 0 && (
                <div className={`mt-4 text-lg font-medium ${
                  searchComparisonData.summary.unique_users_change_rate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {searchComparisonData.summary.unique_users_change_rate >= 0 ? '↑' : '↓'} 
                  {' '}{Math.abs(searchComparisonData.summary.unique_users_change_rate).toFixed(1)}%
                  <span className="text-sm text-gray-500 ml-2">环比</span>
                </div>
              )}
            </div>
          ) : !loading && searchTrends?.uniqueUsers && searchTrends.uniqueUsers[0]?.data && searchTrends.uniqueUsers[0].data.length > 1 ? (
            <ResponsiveLine
              data={searchTrends.uniqueUsers}
              margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
              xScale={{ type: "point" }}
              yScale={{ 
                type: "linear", 
                min: 0, 
                max: "auto",
                stacked: false,
                reverse: false
              }}
              curve="catmullRom"
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                format: (value) => `${value}`
              }}
              pointSize={8}
              pointColor={{ theme: "background" }}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              enableArea={true}
              areaOpacity={0.1}
              useMesh={true}
              colors={["#10b981"]}
              enableSlices="x"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">{loading ? "加载中..." : "暂无数据"}</p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* 新增：无结果搜索词 */}
      <Card>
        <CardHeader>
          <CardTitle>无结果搜索词</CardTitle>
          <CardDescription>用户搜索但没有找到相关商品的关键词</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {noResultTerms.map((term, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
              >
                {term}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            建议：考虑添加相关商品或优化搜索算法以提供更好的搜索体验
          </p>
        </CardContent>
      </Card>

    </main>
  );
} 