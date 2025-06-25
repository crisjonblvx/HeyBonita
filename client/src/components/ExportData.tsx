import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Database, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportDataProps {
  userId: number;
}

export function ExportData({ userId }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'json' | 'csv' | 'txt') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `bonita-export.${format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Your data has been exported as ${format.toUpperCase()} format.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Download all your Bonita conversations, generated images, video scripts, and achievements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Database className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium">JSON</div>
              <div className="text-xs text-muted-foreground">
                Complete data with structure
              </div>
            </div>
          </Button>

          <Button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Table className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium">CSV</div>
              <div className="text-xs text-muted-foreground">
                Spreadsheet compatible
              </div>
            </div>
          </Button>

          <Button
            onClick={() => handleExport('txt')}
            disabled={isExporting}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <FileText className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium">TXT</div>
              <div className="text-xs text-muted-foreground">
                Human-readable format
              </div>
            </div>
          </Button>
        </div>

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-1">What's included in your export:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Complete chat history with Bonita</li>
            <li>All generated images with prompts</li>
            <li>Video scripts for all platforms</li>
            <li>Achievement progress and points</li>
            <li>Account statistics and level info</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}