import React, { useState, useEffect, memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface TableData {
  headers: string[];
  rows: string[][];
  title?: string;
  type?: 'data' | 'comparison' | 'ranking' | 'progress';
}

interface AITableProps {
  data: TableData;
  className?: string;
}

const FlashText = memo(({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!text || typeof text !== 'string') {
    return <span>-</span>;
  }

  return (
    <span className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {text}
    </span>
  );
});

const AITable = ({ data, className = '' }: AITableProps) => {
  const { headers, rows, title, type = 'data' } = data;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // إظهار الجدول مع fade-in بسيط
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // التحقق من صحة البيانات
  if (!headers || !Array.isArray(headers) || headers.length === 0) {
    return (
      <Card className="border border-red-200 p-4">
        <p className="text-red-600 text-sm">خطأ في بيانات الجدول</p>
      </Card>
    );
  }

  if (!rows || !Array.isArray(rows)) {
    return (
      <Card className="border border-red-200 p-4">
        <p className="text-red-600 text-sm">لا توجد بيانات لعرضها</p>
      </Card>
    );
  }

  const getTableTypeLabel = () => {
    switch (type) {
      case 'comparison': return 'جدول مقارنة';
      case 'ranking': return 'جدول ترتيب';
      case 'progress': return 'جدول تقدم';
      default: return 'جدول بيانات';
    }
  };

  return (
    <Card className={`border border-border/50 shadow-sm overflow-hidden bg-background ${
      isVisible ? 'animate-fade-in' : 'opacity-0'
    } ${className}`}>
      {/* Header بسيط */}
      <div className="border-b border-border/50 p-3 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <Badge variant="secondary" className="text-xs">
            {getTableTypeLabel()}
          </Badge>
          {title && (
            <h3 className="text-sm font-semibold">{title}</h3>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              {headers.map((header, index) => (
                <TableHead 
                  key={`header-${index}`}
                  className="text-center font-semibold text-foreground h-10 px-4"
                >
                  {header || '-'}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow 
                key={`row-${rowIndex}`}
                className={`hover:bg-muted/50 transition-colors ${
                  rowIndex % 2 === 0 ? 'bg-muted/10' : 'bg-background'
                }`}
              >
                {row.map((cell, cellIndex) => (
                  <TableCell 
                    key={`cell-${rowIndex}-${cellIndex}`}
                    className={`text-center py-3 px-4 text-sm ${
                      cellIndex === 0 ? 'font-medium' : ''
                    }`}
                  >
                    {cell || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 p-2 bg-muted/5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{rows.length} صف</span>
          <span>{headers.length} عمود</span>
        </div>
      </div>
    </Card>
  );
};

export default memo(AITable);