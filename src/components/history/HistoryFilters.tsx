import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Calendar, 
  X,
  SortAsc,
  SortDesc
} from "lucide-react";

interface HistoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export function HistoryFilters({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
  activeFiltersCount
}: HistoryFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      {/* Search and Filter Toggle */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-9 h-9 text-sm"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1.5 h-9 px-2.5"
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">تصفية</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9 w-9 p-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {/* Date Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium">التاريخ</label>
                <Select value={dateFilter} onValueChange={onDateFilterChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="كل الأوقات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="today">اليوم</SelectItem>
                    <SelectItem value="week">الأسبوع</SelectItem>
                    <SelectItem value="month">الشهر</SelectItem>
                    <SelectItem value="year">السنة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium">النوع</label>
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="text_question">نصي</SelectItem>
                    <SelectItem value="image_question">صورة</SelectItem>
                    <SelectItem value="audio_summary">صوتي</SelectItem>
                    <SelectItem value="mind_map">خريطة</SelectItem>
                    <SelectItem value="chat_explanation">شرح</SelectItem>
                    <SelectItem value="research_paper">بحث</SelectItem>
                    <SelectItem value="text_editing">تحرير</SelectItem>
                    <SelectItem value="book_creator">كتاب</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <label className="text-xs font-medium">ترتيب</label>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">التاريخ</SelectItem>
                    <SelectItem value="credits">الكريدت</SelectItem>
                    <SelectItem value="messages">الرسائل</SelectItem>
                    <SelectItem value="title">العنوان</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-1">
                <label className="text-xs font-medium">اتجاه</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full h-8 justify-start gap-1.5 text-xs"
                >
                  {sortOrder === 'asc' ? (
                    <>
                      <SortAsc className="w-3.5 h-3.5" />
                      تصاعدي
                    </>
                  ) : (
                    <>
                      <SortDesc className="w-3.5 h-3.5" />
                      تنازلي
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}