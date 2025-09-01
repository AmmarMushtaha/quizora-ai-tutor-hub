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

const TypewriterText = memo(({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.substring(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }
    }, delay + currentIndex * 20); // أسرع في الكتابة

    return () => clearTimeout(timer);
  }, [currentIndex, text, delay]);

  return (
    <span className="inline-block">
      {displayText}
      {currentIndex < text.length && <span className="animate-pulse">|</span>}
    </span>
  );
});

const AITable = ({ data, className = '' }: AITableProps) => {
  const { headers, rows, title, type = 'data' } = data;
  const [visibleRows, setVisibleRows] = useState<number[]>([]);

  useEffect(() => {
    // إظهار الصفوف تدريجياً
    rows.forEach((_, index) => {
      setTimeout(() => {
        setVisibleRows(prev => [...prev, index]);
      }, index * 150); // تأخير قصير بين كل صف
    });
  }, [rows]);

  const getTableTypeLabel = () => {
    switch (type) {
      case 'comparison': return 'جدول مقارنة';
      case 'ranking': return 'جدول ترتيب';
      case 'progress': return 'جدول تقدم';
      default: return 'جدول بيانات';
    }
  };

  return (
    <Card className={`border border-border/50 shadow-sm ${className}`}>
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead 
                  key={index} 
                  className="text-center font-medium text-foreground bg-muted/20 h-10"
                >
                  <TypewriterText text={header} delay={index * 100} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex}
                className={`
                  ${visibleRows.includes(rowIndex) ? 'opacity-100' : 'opacity-0'} 
                  transition-opacity duration-300
                  ${rowIndex % 2 === 0 ? 'bg-muted/10' : ''}
                `}
                style={{
                  transitionDelay: `${rowIndex * 150}ms`
                }}
              >
                {row.map((cell, cellIndex) => (
                  <TableCell 
                    key={cellIndex}
                    className={`
                      text-center py-3 text-sm
                      ${cellIndex === 0 ? 'font-medium' : ''}
                    `}
                  >
                    {visibleRows.includes(rowIndex) && (
                      <TypewriterText 
                        text={cell} 
                        delay={rowIndex * 150 + cellIndex * 50} 
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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