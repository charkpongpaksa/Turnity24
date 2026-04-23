import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { mockCourses, mockAssignments } from "../data/mockData";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

export function AssignmentSubmission() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  
  const [submissionType, setSubmissionType] = useState<"file" | "text" | "link">("file");
  const [files, setFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const course = mockCourses.find(c => c.id === courseId);
  const assignment = mockAssignments.find(a => a.id === assignmentId);

  if (!course || !assignment) {
    return <div className="p-6">Assignment not found</div>;
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Simulate submission
    setSubmitted(true);
    setTimeout(() => {
      navigate(`/course/${courseId}/assignment/${assignmentId}`);
    }, 2000);
  };

  const canSubmit = () => {
    if (submissionType === "file") return files.length > 0;
    if (submissionType === "text") return textContent.trim().length > 0;
    if (submissionType === "link") return linkUrl.trim().length > 0;
    return false;
  };

  if (submitted) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <Card className="text-center p-12">
          <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Successful! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your assignment has been submitted successfully. You will be redirected to the assignment page.
          </p>
          <Button 
            onClick={() => navigate(`/course/${courseId}/assignment/${assignmentId}`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            View Assignment
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate(`/course/${courseId}/assignment/${assignmentId}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Assignment
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">{course.code}</Badge>
                  <CardTitle className="text-2xl mb-1">{assignment.title}</CardTitle>
                  <p className="text-sm text-gray-600">{course.name}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", course.color)}>
                  <Upload className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submit Your Work</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={submissionType} onValueChange={(v) => setSubmissionType(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="file">
                    <FileText className="h-4 w-4 mr-2" />
                    File Upload
                  </TabsTrigger>
                  <TabsTrigger value="text">
                    <FileText className="h-4 w-4 mr-2" />
                    Text Entry
                  </TabsTrigger>
                  <TabsTrigger value="link">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Link
                  </TabsTrigger>
                </TabsList>

                {/* File Upload */}
                <TabsContent value="file" className="space-y-4">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                      dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">
                      Drag and drop files here, or click to select files
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Supported formats: PDF, DOC, DOCX, ZIP, JPG, PNG (Max 50MB)
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Browse Files
                    </Button>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Files ({files.length})</Label>
                      {files.map((file, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Text Entry */}
                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-content">Your Submission</Label>
                    <Textarea
                      id="text-content"
                      placeholder="Type or paste your submission here..."
                      className="min-h-[300px]"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      {textContent.length} characters
                    </p>
                  </div>
                </TabsContent>

                {/* Link Submission */}
                <TabsContent value="link" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="link-url">Submission Link</Label>
                    <Input
                      id="link-url"
                      type="url"
                      placeholder="https://example.com/your-project"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Provide a link to your work (e.g., Google Drive, GitHub, CodePen, etc.)
                    </p>
                  </div>
                  {linkUrl && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Preview</p>
                      <a 
                        href={linkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {linkUrl}
                      </a>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Additional Comments */}
              <div className="space-y-2 mt-6">
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any comments or notes for your instructor..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submission Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900 mb-1">Due Date</p>
                    <p className="text-orange-700">
                      {new Date(assignment.dueDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">Requirements</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Submit before the deadline</li>
                  <li>• Include all required files</li>
                  <li>• Follow naming conventions</li>
                  <li>• Check file formats</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">Late Policy</p>
                <p className="text-gray-600">{assignment.latePolicy}</p>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">Points</p>
                <p className="text-2xl font-bold text-blue-600">{assignment.points}</p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="p-6">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                disabled={!canSubmit()}
                onClick={handleSubmit}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Submit Assignment
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">
                You can resubmit anytime before the deadline
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}