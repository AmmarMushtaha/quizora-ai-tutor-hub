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
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في المحادثات والطلبات..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          تصفية
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={onClearFilters} className="gap-2">
            <X className="w-4 h-4" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">التاريخ</label>
                <Select value={dateFilter} onValueChange={onDateFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل الأوقات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأوقات</SelectItem>
                    <SelectItem value="today">اليوم</SelectItem>
                    <SelectItem value="week">هذا الأسبوع</SelectItem>
                    <SelectItem value="month">هذا الشهر</SelectItem>
                    <SelectItem value="year">هذا العام</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع الطلب</label>
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    <SelectItem value="text_question">سؤال نصي</SelectItem>
                    <SelectItem value="image_question">سؤال صورة</SelectItem>
                    <SelectItem value="audio_summary">تلخيص صوتي</SelectItem>
                    <SelectItem value="mind_map">خريطة ذهنية</SelectItem>
                    <SelectItem value="chat_explanation">شرح ذكي</SelectItem>
                    <SelectItem value="research_paper">بحث أكاديمي</SelectItem>
                    <SelectItem value="text_editing">تحرير نص</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ترتيب حسب</label>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">التاريخ</SelectItem>
                    <SelectItem value="credits">الكريدت المستخدم</SelectItem>
                    <SelectItem value="messages">عدد الرسائل</SelectItem>
                    <SelectItem value="title">العنوان</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium">اتجاه الترتيب</label>
                <Button
                  variant="outline"
                  onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full justify-start gap-2"
                >
                  {sortOrder === 'asc' ? (
                    <>
                      <SortAsc className="w-4 h-4" />
                      تصاعدي
                    </>
                  ) : (
                    <>
                      <SortDesc className="w-4 h-4" />
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