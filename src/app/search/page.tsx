"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimeSelector } from "@/components/date-time-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Line } from "@nivo/line";
import { Bar } from "@nivo/bar";
import { Pie } from "@nivo/pie";
import { Search, TrendingUp, Users, ShoppingCart, MousePointer, BarChart3, PieChart, Target } from "lucide-react";
import { SearchMetrics, SearchTermData, SearchClickPosition, SearchBehavior, SearchSource, SearchDevice } from "@/lib/dashboard-data";

export default function SearchPage() {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({from: new Date(), to: new Date()});
  const [searchMetrics, setSearchMetrics] = useState<SearchMetrics | null>(null);
  const [topSearchTerms, setTopSearchTerms] = useState<SearchTermData[]>([]);
  const [searchTrends, setSearchTrends] = useState<any>(null);
  const [clickPositions, setClickPositions] = useState<SearchClickPosition[]>([]);
  const [searchBehavior, setSearchBehavior] = useState<SearchBehavior | null>(null);
  const [searchSources, setSearchSources] = useState<SearchSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    // 核心搜索指标
    const baseSearches = 15000 + Math.random() * 5000;
    const baseUsers = 8000 + Math.random() * 3000;
    
    const metrics: SearchMetrics = {
      totalSearches: Math.floor(baseSearches * dataMultiplier),
      uniqueSearchUsers: Math.floor(baseUsers * dataMultiplier * 0.7), // 用户数增长较慢
      avgSearchDepth: parseFloat((Math.random() * 1.5 + 2.5).toFixed(2)),
      searchConversionRate: parseFloat((Math.random() * 10 + 15).toFixed(2)),
      change: {
        totalSearches: parseFloat((Math.random() * 20 - 10).toFixed(2)),
        uniqueSearchUsers: parseFloat((Math.random() * 15 - 5).toFixed(2)),
        avgSearchDepth: parseFloat((Math.random() * 10 - 5).toFixed(2)),
        searchConversionRate: parseFloat((Math.random() * 5 - 2).toFixed(2)),
      },
    };

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
      const baseSearches = Math.floor((3000 - index * 150) * dataMultiplier * (0.8 + Math.random() * 0.4));
      const searches = Math.max(100, baseSearches);
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

    // 搜索趋势数据
    let trendData: { x: string; y: number }[] = [];
    
    if (timeRange === 'today') {
      // 24小时数据
      trendData = Array.from({ length: 24 }, (_, i) => {
        // 模拟真实的搜索趋势：早上和晚上高峰
        const hourFactor = 
          (i >= 9 && i <= 11) ? 1.5 :  // 上午高峰
          (i >= 20 && i <= 22) ? 1.8 : // 晚上高峰
          (i >= 0 && i <= 6) ? 0.3 :   // 凌晨低谷
          1.0;
        
        return {
          x: `${i}:00`,
          y: Math.floor((200 + Math.random() * 300) * hourFactor),
        };
      });
    } else if (timeRange === 'last_7_days') {
      // 7天数据
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      trendData = Array.from({ length: 7 }, (_, i) => {
        const dayFactor = (i === 5 || i === 6) ? 1.3 : 1.0; // 周末较高
        return {
          x: days[i],
          y: Math.floor((baseSearches * dayFactor) + Math.random() * 2000),
        };
      });
    } else if (timeRange === 'last_30_days') {
      // 30天数据
      trendData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 29 + i);
        const dayOfWeek = date.getDay();
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
        
        return {
          x: `${date.getMonth() + 1}/${date.getDate()}`,
          y: Math.floor((baseSearches * weekendFactor) + Math.random() * 3000 - 1500),
        };
      });
    } else {
      // 6个月数据
      const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
      trendData = Array.from({ length: 6 }, (_, i) => {
        const monthFactor = 1 + (i * 0.1); // 逐月增长
        return {
          x: months[i],
          y: Math.floor(baseSearches * 30 * monthFactor + Math.random() * 50000),
        };
      });
    }
    
    const trends = {
      data: [
        {
          id: "搜索量",
          data: trendData,
        },
      ],
    };

    // 点击位置分布 - 根据总点击量生成
    const totalClicks = searchTerms.reduce((sum, term) => sum + term.clicks, 0);
    const clickDistribution = [35, 23, 15, 10, 7, 5, 3, 2]; // 典型的点击分布百分比
    
    const positions: SearchClickPosition[] = clickDistribution.map((percentage, index) => ({
      position: index + 1,
      clicks: Math.floor(totalClicks * (percentage / 100)),
      percentage,
    }));

    // 搜索行为指标 - 基于实际数据计算
    const totalSearchesCount = metrics.totalSearches;
    const zeroClickSearches = Math.floor(totalSearchesCount * (0.15 + Math.random() * 0.05));
    const exitSearches = Math.floor(totalSearchesCount * (0.25 + Math.random() * 0.1));
    const refinedSearches = Math.floor(totalSearchesCount * (0.3 + Math.random() * 0.15));
    
    const behavior: SearchBehavior = {
      exitRate: parseFloat(((exitSearches / totalSearchesCount) * 100).toFixed(2)),
      refinementRate: parseFloat(((refinedSearches / totalSearchesCount) * 100).toFixed(2)),
      avgClickPosition: parseFloat((2.3 + Math.random() * 0.4).toFixed(2)),
      zeroClickRate: parseFloat(((zeroClickSearches / totalSearchesCount) * 100).toFixed(2)),
    };

    // 搜索来源分布 - 动态计算
    const sourceDistribution = [
      { source: "首页", percentage: 35 },
      { source: "分类页", percentage: 27 },
      { source: "商品页", percentage: 20 },
      { source: "购物车", percentage: 12 },
      { source: "其他", percentage: 6 },
    ];
    
    const sources: SearchSource[] = sourceDistribution.map(item => ({
      source: item.source,
      searches: Math.floor(totalSearchesCount * (item.percentage / 100)),
      percentage: item.percentage,
    }));


    setSearchMetrics(metrics);
    setTopSearchTerms(searchTerms);
    setSearchTrends(trends);
    setClickPositions(positions);
    setSearchBehavior(behavior);
    setSearchSources(sources);
  };

  // 尝试从API获取数据，失败时使用模拟数据
  const fetchSearchData = async (rangeType: string) => {
    try {
      const response = await fetch(`http://localhost:8000/search/metrics?range=${rangeType}`);
      if (!response.ok) {
        throw new Error('API not available');
      }
      const data = await response.json();
      
      // 设置真实数据
      setSearchMetrics(data.metrics);
      setTopSearchTerms(data.topSearchTerms);
      setSearchTrends(data.searchTrends);
      setClickPositions(data.clickPositions);
      setSearchBehavior(data.searchBehavior);
      setSearchSources(data.searchSources);
      setError(null);
    } catch (err) {
      console.log('使用模拟数据:', err);
      generateMockData(rangeType);
      setError(null); // 不显示错误，因为有模拟数据
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
    
    fetchSearchData(rangeType);
  };
  
  // 初始化时不做任何操作，等待 DateTimeSelector 组件的回调
  useEffect(() => {
    // 可以在这里添加一些初始化逻辑
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
            <div className="text-2xl font-bold">
              {searchMetrics?.totalSearches.toLocaleString()}
            </div>
            <p className={`text-xs ${getChangeColor(searchMetrics?.change.totalSearches || 0)}`}>
              {formatChange(searchMetrics?.change.totalSearches || 0)} 较上期
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">独立搜索用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {searchMetrics?.uniqueSearchUsers.toLocaleString()}
            </div>
            <p className={`text-xs ${getChangeColor(searchMetrics?.change.uniqueSearchUsers || 0)}`}>
              {formatChange(searchMetrics?.change.uniqueSearchUsers || 0)} 较上期
            </p>
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

      {/* 热门搜索词和搜索趋势 */}
      <div className="grid gap-4 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle>搜索趋势</CardTitle>
            <CardDescription>24小时搜索量变化趋势</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {!loading && searchTrends && searchTrends.data.length > 0 ? (
              <Line
                data={searchTrends.data}
                margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
                xScale={{ type: "point" }}
                yScale={{ type: "linear", min: "auto", max: "auto" }}
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
                }}
                pointSize={8}
                pointColor={{ theme: "background" }}
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                colors={["#6366f1"]}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 搜索质量监控 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>点击位置分布</CardTitle>
            <CardDescription>用户点击搜索结果的位置分布</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {!loading && clickPositions.length > 0 ? (
              <Bar
                data={clickPositions.map(item => ({
                  position: `第${item.position}位`,
                  点击次数: item.clicks,
                }))}
                keys={["点击次数"]}
                indexBy="position"
                margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
                padding={0.3}
                colors={["#6366f1"]}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "位置",
                  legendPosition: "middle",
                  legendOffset: 32,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "点击次数",
                  legendPosition: "middle",
                  legendOffset: -40,
                }}
                enableLabel={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>搜索行为指标</CardTitle>
            <CardDescription>用户搜索行为关键指标</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">零点击率</span>
                </div>
                <span className="text-sm font-medium">{searchBehavior?.zeroClickRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">搜索退出率</span>
                </div>
                <span className="text-sm font-medium">{searchBehavior?.exitRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">搜索细化率</span>
                </div>
                <span className="text-sm font-medium">{searchBehavior?.refinementRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">平均点击位置</span>
                </div>
                <span className="text-sm font-medium">第 {searchBehavior?.avgClickPosition} 位</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>搜索来源分布</CardTitle>
            <CardDescription>不同页面发起的搜索占比</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {!loading && searchSources.length > 0 ? (
              <Pie
                data={searchSources.map(s => ({ id: s.source, value: s.percentage }))}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ scheme: "purple_blue" }}
                borderWidth={1}
                borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                enableArcLinkLabels={false}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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