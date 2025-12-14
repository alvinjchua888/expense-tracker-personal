import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Camera, Loader2, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractedData {
  merchant?: string;
  amount?: string;
  date?: string;
  items?: string[];
  suggestedCategory?: string;
}

interface ReceiptUploadProps {
  onExtracted?: (data: ExtractedData) => void;
  trigger?: React.ReactNode;
}

export function ReceiptUpload({ onExtracted, trigger }: ReceiptUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type.startsWith("image/")) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processReceipt = async () => {
    if (!preview) return;
    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/receipt/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to process receipt");
      }
      
      const data = await response.json();
      const extracted: ExtractedData = {
        merchant: data.merchant,
        amount: data.amount?.toString(),
        date: data.date,
        items: data.items,
        suggestedCategory: data.suggestedCategory,
      };
      
      setExtractedData(extracted);
    } catch (error) {
      console.error("Error processing receipt:", error);
      toast({
        title: "Error",
        description: "Failed to process receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (extractedData) {
      onExtracted?.(extractedData);
    }
    resetState();
    setOpen(false);
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetState(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" data-testid="button-scan-receipt">
            <Camera className="h-4 w-4 mr-2" />
            Scan Receipt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl" data-testid="dialog-receipt-upload">
        <DialogHeader>
          <DialogTitle>Scan Receipt</DialogTitle>
        </DialogHeader>
        
        {!preview ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your receipt image here, or
            </p>
            <Label htmlFor="receipt-file">
              <Button variant="secondary" asChild>
                <span>Browse Files</span>
              </Button>
            </Label>
            <Input
              id="receipt-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFile(selectedFile);
              }}
              data-testid="input-receipt-file"
            />
            <p className="text-xs text-muted-foreground mt-4">
              Supports JPG, PNG, HEIC up to 10MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Receipt preview"
                className="w-full max-h-64 object-contain rounded-lg bg-muted"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/80"
                onClick={resetState}
                data-testid="button-remove-receipt"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!extractedData && !isProcessing && (
              <Button
                onClick={processReceipt}
                className="w-full"
                data-testid="button-process-receipt"
              >
                <Camera className="h-4 w-4 mr-2" />
                Process Receipt with AI
              </Button>
            )}

            {isProcessing && (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">Processing receipt...</p>
                    <p className="text-sm text-muted-foreground">
                      Extracting expense details with AI
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {extractedData && (
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-chart-1">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Data Extracted Successfully</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Merchant</p>
                    <p className="font-medium">{extractedData.merchant}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium">${extractedData.amount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{extractedData.date}</p>
                  </div>
                  {extractedData.suggestedCategory && (
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{extractedData.suggestedCategory}</p>
                    </div>
                  )}
                  {extractedData.items && extractedData.items.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Items</p>
                      <p className="font-medium">{extractedData.items.join(", ")}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={resetState}
                    className="flex-1"
                    data-testid="button-rescan-receipt"
                  >
                    Rescan
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1"
                    data-testid="button-confirm-receipt"
                  >
                    Add Expense
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
