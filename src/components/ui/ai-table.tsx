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
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    // إيقاف الوميض بعد ثانية ونصف
    const pulseTimer = setTimeout(() => {
      setIsPulsing(false);
    }, delay + 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(pulseTimer);
    };
  }, [delay]);

  return (
    <span className={`${isVisible ? 'animate-fade-in' : 'opacity-0'} ${isPulsing ? 'animate-pulse' : ''}`}>
      {text}
    </span>
  );
});

const AITable = ({ data, className = '' }: AITableProps) => {
  const { headers, rows, title, type = 'data' } = data;
  const [isVisible, setIsVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    // إظهار الجدول مع fade-in
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    // إيقاف الوميض بعد ثانيتين
    setTimeout(() => {
      setIsPulsing(false);
    }, 2000);
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
    <Card className={`border border-border/50 shadow-lg overflow-hidden bg-gradient-to-br from-background to-primary/5 ${
      isVisible ? 'animate-fade-in' : 'opacity-0'
    } ${isPulsing ? 'animate-pulse' : ''} ${className}`}>
      {/* Header مطور */}
      <div className="border-b border-border/50 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-primary to-secondary">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary/20 to-secondary/20 border-0">
              {getTableTypeLabel()}
            </Badge>
            {title && (
              <h3 className="text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{title}</h3>
            )}
          </div>
        </div>
      </div>

      {/* Table محسن */}
      {isVisible && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-primary/5 to-secondary/5 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10">
                {headers.map((header, index) => (
                  <TableHead 
                    key={index} 
                    className="text-center font-semibold text-foreground h-12 border-r border-border/30 last:border-r-0"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FlashText text={header} delay={index * 50} />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex}
                  className={`
                    transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent
                    ${rowIndex % 2 === 0 ? 'bg-muted/20' : 'bg-background'}
                  `}
                >
                  {row.map((cell, cellIndex) => (
                    <TableCell 
                      key={cellIndex}
                      className={`
                        text-center py-4 text-sm border-r border-border/20 last:border-r-0
                        ${cellIndex === 0 ? 'font-semibold bg-gradient-to-r from-primary/10 to-transparent' : ''}
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

      {/* Footer محسن */}
      <div className="border-t border-border/50 p-3 bg-gradient-to-r from-secondary/10 to-primary/5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary"></div>
            <span>{rows.length} صف</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{headers.length} عمود</span>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-secondary to-primary"></div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default memo(AITable);