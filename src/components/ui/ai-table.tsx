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

  return (
    <span className={`transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {text}
    </span>
  );
});

const AITable = ({ data, className = '' }: AITableProps) => {
  const { headers, rows, title, type = 'data' } = data;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // إظهار الجدول مباشرة مع وميض سريع
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
  }, []);

  const getTableTypeLabel = () => {
    switch (type) {
      case 'comparison': return 'جدول مقارنة';
      case 'ranking': return 'جدول ترتيب';
      case 'progress': return 'جدول تقدم';
      default: return 'جدول بيانات';
    }
  };

  return (
    <Card className={`border border-border/50 shadow-sm transition-all duration-500 ${
      isVisible ? 'opacity-100 animate-pulse' : 'opacity-0'
    } ${className}`}>
      {/* Header مبسط */}
      <div className="border-b p-3 bg-muted/30">
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

      {/* Table مبسط */}
      {isVisible && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead 
                    key={index} 
                    className="text-center font-medium text-foreground bg-muted/20 h-10"
                  >
                    <FlashText text={header} delay={index * 50} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex}
                  className={`
                    transition-opacity duration-300
                    ${rowIndex % 2 === 0 ? 'bg-muted/10' : ''}
                  `}
                >
                  {row.map((cell, cellIndex) => (
                    <TableCell 
                      key={cellIndex}
                      className={`
                        text-center py-3 text-sm
                        ${cellIndex === 0 ? 'font-medium' : ''}
                      `}
                    >
                      <FlashText 
                        text={cell} 
                        delay={rowIndex * 30 + cellIndex * 20} 
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer مبسط */}
      <div className="border-t p-2 bg-muted/10">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{rows.length} صف</span>
          <span>{headers.length} عمود</span>
        </div>
      </div>
    </Card>
  );
};

export default memo(AITable);