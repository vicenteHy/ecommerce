"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useEffect, useRef, useState } from "react"
import { DayPicker } from "react-day-picker"

export interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  dateRange: DateRange
  onRangeChange: (range: DateRange) => void
  align?: "center" | "start" | "end"
  className?: string
  placeholder?: string
  onConfirm?: (range: DateRange) => void
}

// 自定义DayPicker组件，完全不使用内置导航
function CustomRangePicker({
  month,
  selected,
  onSelect,
  numberOfMonths = 1,
  ...props
}: {
  month: Date;
  selected: { from?: Date; to?: Date } | null;
  onSelect: (range: { from?: Date; to?: Date } | undefined) => void;
  numberOfMonths?: number;
}) {
  return (
    <DayPicker
      mode="range"
      month={month}
      selected={selected}
      onSelect={onSelect}
      numberOfMonths={numberOfMonths}
      showOutsideDays={true}
      disabled={props.disabled}
      modifiersClassNames={props.modifiersClassNames}
      captionLayout="hidden"
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "hidden", // 彻底隐藏内置标题和导航
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        day_range_start: "day-range-start rounded-full aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end: "day-range-end rounded-full aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
        day_today: "bg-accent text-accent-foreground rounded-full",
        day_outside: "day-outside text-muted-foreground aria-selected:text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent/50 aria-selected:text-accent-foreground",
        day_hidden: "invisible",
      }}
      {...props}
    />
  );
}

export function DateRangePicker({
  dateRange,
  onRangeChange,
  align = "end",
  className,
  placeholder = "选择日期范围",
  onConfirm,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<{from?: Date; to?: Date}>(dateRange)
  const [currentMonth, setCurrentMonth] = useState<Date>(dateRange?.from || new Date())
  
  // 当外部dateRange变化时，更新内部状态
  React.useEffect(() => {
    setSelectedRange(dateRange);
    if (dateRange?.from) {
      setCurrentMonth(dateRange.from);
    }
  }, [dateRange]);
  
  // 重置选择
  const resetSelection = () => {
    setSelectedRange({});
  };
  
  // 处理确认按钮点击
  const handleConfirm = () => {
    if (selectedRange?.from && selectedRange?.to) {
      const newRange: DateRange = {
        from: selectedRange.from,
        to: selectedRange.to
      };
      
      if (onConfirm) {
        onConfirm(newRange);
      } else {
        onRangeChange(newRange);
      }
      setOpen(false);
    }
  };
  
  // 上个月
  const goToPrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  // 下个月
  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !dateRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "yyyy-MM-dd")} -{" "}
                {format(dateRange.to, "yyyy-MM-dd")}
              </>
            ) : (
              format(dateRange.from, "yyyy-MM-dd")
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex flex-col space-y-2 p-2">
          <div className="flex justify-between items-center px-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {format(currentMonth, "yyyy年MM月")}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="calendar-container">
            <CustomRangePicker
              month={currentMonth}
              selected={selectedRange}
              onSelect={(range) => {
                if (range) {
                  // 如果只有from，等待选择to
                  setSelectedRange(range);
                  
                  // 如果完整选择了范围，准备确认
                  if (range.from && range.to && onConfirm) {
                    // 不关闭弹窗，等待用户确认
                  } else if (range.from && range.to) {
                    // 没有确认按钮，直接应用变更
                    onRangeChange(range as DateRange);
                    setOpen(false);
                  }
                }
              }}
            />
          </div>
          
          <div className="flex justify-between gap-2 pt-2 border-t mt-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={resetSelection}
            >
              重置
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // 关闭弹窗，不做任何更改
                  setOpen(false);
                }}
              >
                关闭
              </Button>
              {onConfirm && selectedRange?.from && selectedRange?.to && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleConfirm}
                >
                  确认
                </Button>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}