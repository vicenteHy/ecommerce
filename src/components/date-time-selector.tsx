'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";

interface DateTimeSelectorProps {
  onDateRangeChange: (from: Date, to: Date) => void;
  defaultRange?: string;
}

export function DateTimeSelector({ onDateRangeChange, defaultRange = 'today' }: DateTimeSelectorProps) {
  const [selectedRange, setSelectedRange] = useState<string>(defaultRange);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);
  
  // 根据选择范围计算日期
  const calculateDateRange = useCallback((range: string) => {
    const now = new Date();
    let from = new Date();
    let to = new Date();
    
    switch (range) {
      case 'yesterday':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case 'last_7_days':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'last_30_days':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'last_6_months':
        from = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      default: // 'today'
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
    }
    
    return { from, to };
  }, []);
  
  // 初始化日期范围
  const initialRange = calculateDateRange(defaultRange);
  const [dateRange, setDateRange] = useState<DateRange>(initialRange);

  // 使用 ref 保存 callback 的最新版本
  const onDateRangeChangeRef = useRef(onDateRangeChange);
  useEffect(() => {
    onDateRangeChangeRef.current = onDateRangeChange;
  }, [onDateRangeChange]);

  // 初始化时调用一次
  useEffect(() => {
    if (!isInitialized.current) {
      const range = calculateDateRange(defaultRange);
      onDateRangeChangeRef.current(range.from, range.to);
      isInitialized.current = true;
    }
  }, [calculateDateRange, defaultRange]);

  // 处理选择器变更
  const handleRangeSelect = (value: string) => {
    setSelectedRange(value);
    const range = calculateDateRange(value);
    setDateRange(range);
    onDateRangeChangeRef.current(range.from, range.to);
  };

  // 处理日期范围变更
  const handleDateRangeChange = (range: DateRange) => {
    if (range.from && range.to) {
      // 检查日期范围是否合理
      if (range.from > range.to) {
        setError('起始日期不能大于结束日期');
        return;
      }
      
      setDateRange(range);
      setError(null);
      onDateRangeChangeRef.current(range.from, range.to);
    }
  };

  return (
    <>
      <div className="flex gap-4 items-center">
        <DateRangePicker 
          dateRange={dateRange} 
          onRangeChange={(range) => {
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
                to: now
              };
              setDateRange(adjustedRange);
              handleDateRangeChange(adjustedRange);
            } else {
              handleDateRangeChange(range);
            }
          }}
        />
        <Select value={selectedRange} onValueChange={handleRangeSelect}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="选择时间范围" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">今天</SelectItem>
            <SelectItem value="yesterday">昨天</SelectItem>
            <SelectItem value="last_7_days">近7天</SelectItem>
            <SelectItem value="last_30_days">近30天</SelectItem>
            <SelectItem value="last_6_months">近6个月</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </>
  );
}