// 日期格式化工具函数

/**
 * 格式化日期为 MM/DD 格式
 */
export const formatDateShort = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
};

/**
 * 格式化日期为 YYYY年MM月DD日 格式
 */
export const formatDateChinese = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};

/**
 * 根据日期范围生成标签
 */
export const getDateRangeLabel = (from: Date, to: Date): string => {
  // 检查是否是同一天
  const isSameDay = from.getFullYear() === to.getFullYear() &&
                    from.getMonth() === to.getMonth() &&
                    from.getDate() === to.getDate();
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 检查是否是今天
  const isToday = isSameDay && 
                  from.getFullYear() === today.getFullYear() &&
                  from.getMonth() === today.getMonth() &&
                  from.getDate() === today.getDate();
  
  // 检查是否是昨天
  const isYesterday = isSameDay && 
                      from.getFullYear() === yesterday.getFullYear() &&
                      from.getMonth() === yesterday.getMonth() &&
                      from.getDate() === yesterday.getDate();
  
  if (isToday) {
    return '今天';
  }
  
  if (isYesterday) {
    return '昨天';
  }
  
  if (isSameDay) {
    return formatDateShort(from);
  }
  
  // 如果是日期范围，返回范围字符串
  return `${formatDateShort(from)} - ${formatDateShort(to)}`;
};

/**
 * 获取对比期标签
 */
export const getComparisonLabel = (from: Date, to: Date): string => {
  const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  if (days === 1) {
    const yesterday = new Date(from);
    yesterday.setDate(yesterday.getDate() - 1);
    return `昨天 (${formatDateShort(yesterday)})`;
  }
  
  const comparisonFrom = new Date(from);
  comparisonFrom.setDate(comparisonFrom.getDate() - days);
  const comparisonTo = new Date(from);
  comparisonTo.setDate(comparisonTo.getDate() - 1);
  
  return `${formatDateShort(comparisonFrom)} - ${formatDateShort(comparisonTo)}`;
};