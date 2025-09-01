import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Award, Target } from 'lucide-react';

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

const AITable = ({ data, className = '' }: AITableProps) => {
  const { headers, rows, title, type = 'data' } = data;

  const getTableIcon = () => {
    switch (type) {
      case 'comparison': return <Target className="w-4 h-4" />;
      case 'ranking': return <Award className="w-4 h-4" />;
      case 'progress': return <TrendingUp className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTableTypeLabel = () => {
    switch (type) {
      case 'comparison': return 'جدول مقارنة';
      case 'ranking': return 'جدول ترتيب';
      case 'progress': return 'جدول تقدم';
      default: return 'جدول بيانات';
    }
  };

  const getCellClassName = (rowIndex: number, cellIndex: number) => {
    let baseClasses = 'font-medium';
    
    // إضافة ألوان مميزة للصفوف
    if (rowIndex % 2 === 0) {
      baseClasses += ' bg-primary/5';
    }
    
    // تمييز الخلية الأولى في كل صف
    if (cellIndex === 0) {
      baseClasses += ' bg-secondary/10 font-bold text-primary';
    }
    
    // تمييز خاص للجداول المرتبة
    if (type === 'ranking' && cellIndex === 0) {
      if (rowIndex === 0) baseClasses += ' bg-yellow-500/20 text-yellow-700';
      else if (rowIndex === 1) baseClasses += ' bg-gray-400/20 text-gray-700';
      else if (rowIndex === 2) baseClasses += ' bg-orange-500/20 text-orange-700';
    }
    
    return baseClasses;
  };

  return (
    <Card className={`card-glow overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/10 to-accent/10 p-4">
        <div className="flex items-center gap-2">
          {getTableIcon()}
          <Badge variant="secondary" className="gap-1">
            {getTableTypeLabel()}
          </Badge>
          {title && (
            <h3 className="text-lg font-bold text-gradient mr-2">{title}</h3>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-primary/20 to-accent/20 hover:bg-gradient-to-r hover:from-primary/30 hover:to-accent/30">
              {headers.map((header, index) => (
                <TableHead 
                  key={index} 
                  className="font-bold text-foreground text-center h-14 bg-primary/10 border-l border-border first:border-l-0"
                >
                  <div className="flex items-center justify-center gap-2">
                    {index === 0 && <Sparkles className="w-4 h-4 text-primary" />}
                    {header}
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
                  transition-all duration-200 hover:bg-primary/5 
                  ${rowIndex % 2 === 0 ? 'bg-secondary/5' : ''}
                  border-b border-border/50
                `}
              >
                {row.map((cell, cellIndex) => (
                  <TableCell 
                    key={cellIndex}
                    className={`
                      text-center py-4 border-l border-border/30 first:border-l-0
                      ${getCellClassName(rowIndex, cellIndex)}
                      transition-colors duration-200
                    `}
                  >
                    <div className="min-h-[24px] flex items-center justify-center">
                      {cell}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="border-t bg-gradient-to-r from-secondary/10 to-muted/10 p-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>عدد الصفوف: {rows.length}</span>
          <span>عدد الأعمدة: {headers.length}</span>
        </div>
      </div>
    </Card>
  );
};

export default AITable;