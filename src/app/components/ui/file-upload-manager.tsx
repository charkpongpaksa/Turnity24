import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { 
  Upload, 
  Link as LinkIcon, 
  X, 
  FileText,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export interface AttachmentItem {
  id: string;
  name: string;
  url: string;
  type: "file" | "url";
  size?: number;
  uploadedAt?: string;
}

interface FileUploadManagerProps {
  attachments: AttachmentItem[];
  onAddAttachment: (attachment: AttachmentItem) => void;
  onRemoveAttachment: (id: string) => void;
  maxFileSize?: number; // in MB
  allowedFormats?: string[];
}

export function FileUploadManager({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  maxFileSize = 50,
  allowedFormats = [
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "txt", "zip", "rar", "jpg", "jpeg", "png", "gif", "mp4", "mp3"
  ]
}: FileUploadManagerProps) {
  // File upload states
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [fileInputValue, setFileInputValue] = useState("");
  
  // URL states
  const [urlInput, setUrlInput] = useState("");
  const [urlName, setUrlName] = useState("");
  const [urlError, setUrlError] = useState("");

  // Helper functions
  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxFileSize}MB limit. Your file is ${formatFileSize(file.size)}`
      };
    }

    // Check file format
    const extension = getFileExtension(file.name);
    if (!allowedFormats.includes(extension)) {
      return {
        valid: false,
        error: `File format ".${extension}" is not allowed. Allowed formats: ${allowedFormats.join(", ")}`
      };
    }

    return { valid: true };
  };

  const validateUrl = (url: string): { valid: boolean; error?: string } => {
    try {
      new URL(url);
      // Check if it's a common file hosting URL pattern
      if (!url.includes("/") || url.includes("javascript:") || url.includes("data:")) {
        return { valid: false, error: "Invalid URL format" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "Please enter a valid URL" };
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const validation = validateFile(file);

      if (!validation.valid) {
        toast.error(validation.error);
        setFileInputValue("");
        setFileInput(null);
        return;
      }

      setFileInput(file);
      setFileInputValue(file.name);
    }
  };

  const handleAddFile = () => {
    if (!fileInput) {
      toast.error("Please select a file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target?.result as string;
      const attachment: AttachmentItem = {
        id: `file-${Date.now()}`,
        name: fileInput.name,
        url: fileData, // In a real app, this would be uploaded to a server
        type: "file",
        size: fileInput.size,
        uploadedAt: new Date().toISOString()
      };

      onAddAttachment(attachment);
      toast.success(`File "${fileInput.name}" added successfully`);
      
      // Reset
      setFileInput(null);
      setFileInputValue("");
    };

    reader.onerror = () => {
      toast.error("Error reading file");
    };

    reader.readAsDataURL(fileInput);
  };

  // Handle URL addition
  const handleAddUrl = () => {
    if (!urlInput.trim()) {
      setUrlError("Please enter a URL");
      return;
    }

    if (!urlName.trim()) {
      setUrlError("Please enter a name for the URL");
      return;
    }

    const validation = validateUrl(urlInput);
    if (!validation.valid) {
      setUrlError(validation.error);
      return;
    }

    const attachment: AttachmentItem = {
      id: `url-${Date.now()}`,
      name: urlName,
      url: urlInput,
      type: "url",
      uploadedAt: new Date().toISOString()
    };

    onAddAttachment(attachment);
    toast.success(`URL link "${urlName}" added successfully`);
    
    // Reset
    setUrlInput("");
    setUrlName("");
    setUrlError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      callback();
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Add URL
          </TabsTrigger>
        </TabsList>

        {/* Upload File Tab */}
        <TabsContent value="upload" className="space-y-3 mt-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                <label htmlFor="file-upload" className="font-medium text-blue-600 cursor-pointer hover:text-blue-700">
                  Click to upload
                </label>
                <span> or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500">
                Max {maxFileSize}MB • {allowedFormats.join(", ")}
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={allowedFormats.map(f => `.${f}`).join(",")}
            />
          </div>

          {fileInputValue && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{fileInputValue}</p>
                  {fileInput && (
                    <p className="text-xs text-gray-600">{formatFileSize(fileInput.size)}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setFileInput(null);
                  setFileInputValue("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Button
            onClick={handleAddFile}
            disabled={!fileInput}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Add File
          </Button>
        </TabsContent>

        {/* Add URL Tab */}
        <TabsContent value="url" className="space-y-3 mt-4">
          <div className="space-y-2">
            <Label htmlFor="url-input">URL Link</Label>
            <Input
              id="url-input"
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError("");
              }}
              onKeyPress={(e) => handleKeyPress(e, handleAddUrl)}
              placeholder="https://example.com/document.pdf"
              className={urlError ? "border-red-500" : ""}
            />
            {urlError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {urlError}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url-name">Display Name</Label>
            <Input
              id="url-name"
              type="text"
              value={urlName}
              onChange={(e) => {
                setUrlName(e.target.value);
                setUrlError("");
              }}
              onKeyPress={(e) => handleKeyPress(e, handleAddUrl)}
              placeholder="e.g., Assignment Guidelines"
            />
          </div>

          <Button
            onClick={handleAddUrl}
            disabled={!urlInput.trim() || !urlName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Add URL
          </Button>
        </TabsContent>
      </Tabs>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">Added Attachments ({attachments.length})</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {attachment.type === "file" ? (
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <LinkIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.name}
                    </p>
                    {attachment.type === "file" && attachment.size && (
                      <p className="text-xs text-gray-600">
                        {formatFileSize(attachment.size)}
                      </p>
                    )}
                    {attachment.type === "url" && (
                      <p className="text-xs text-gray-600 truncate">
                        {attachment.url}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onRemoveAttachment(attachment.id);
                    toast.success("Attachment removed");
                  }}
                  className="ml-2 text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info message */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex gap-2">
        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Students can download files or access URLs directly from the assignment page. In a production environment, files would be securely stored on a server.
        </p>
      </div>
    </div>
  );
}
