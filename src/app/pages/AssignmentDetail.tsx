import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { 
  Clock, 
  FileText, 
  Download, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Upload
} from "lucide-react";
import { cn } from "../components/ui/utils";
import {
  getAssignmentById,
  getCourseById,
  requestPresignedDownload,
} from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import { appConfig } from "@/lib/config/env";
import { toast } from "sonner";

const LOCAL_SUBMISSION_PREVIEW_PREFIX = "turnity_submission_preview:";

function buildCdnFileUrl(fileKey: string): string | null {
  const baseUrl = appConfig.cdnBaseUrl;
  if (!baseUrl || /x{4,}/i.test(baseUrl)) return null;

  const encodedKey = fileKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${baseUrl.replace(/\/$/, "")}/${encodedKey}`;
}

export function AssignmentDetail() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();

  console.log("AssignmentDetail rendered with params:", { courseId, assignmentId });

  const { data: course, loading: courseLoading, error: courseError } = useAsyncData(
    () => (courseId ? getCourseById(courseId) : Promise.resolve(null)),
    [courseId]
  );
  const { data: assignment, loading: assignmentLoading, error: assignmentError } = useAsyncData(
    () =>
      courseId && assignmentId
        ? getAssignmentById(courseId, assignmentId)
        : Promise.resolve(null),
    [courseId, assignmentId]
  );

  console.log("AssignmentDetail data:", { course, assignment, courseError, assignmentError });

  if (courseLoading || assignmentLoading) {
    return <div className="p-6">Loading assignment...</div>;
  }

  if (!course || !assignment) {
    return (
      <div className="p-6">
        {courseError?.message || assignmentError?.message ? (
          <div className="text-red-600">Error: {courseError?.message || assignmentError?.message}</div>
        ) : (
          "Assignment not found"
        )}
      </div>
    );
  }

  const getDaysUntil = (dueDate: string) => {
    const daysUntil = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    return `Due in ${daysUntil} days`;
  };

  const isOverdue = new Date(assignment.dueDate) < new Date();
  const hasSubmitted = assignment.submissions.length > 0;

  const openSubmittedFile = async (fileKey?: string | null) => {
    if (!fileKey) {
      toast.error("No file is attached to this submission");
      return;
    }

    const localPreviewUrl =
      typeof window !== "undefined"
        ? sessionStorage.getItem(`${LOCAL_SUBMISSION_PREVIEW_PREFIX}${fileKey}`)
        : null;

    if (localPreviewUrl) {
      window.open(localPreviewUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (/^https?:\/\//i.test(fileKey)) {
      window.open(fileKey, "_blank", "noopener,noreferrer");
      return;
    }

    const cdnUrl = buildCdnFileUrl(fileKey);
    if (cdnUrl) {
      window.open(cdnUrl, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const { downloadUrl } = await requestPresignedDownload(fileKey);
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message =
        error instanceof Error && error.message !== "Failed to fetch"
          ? error.message
          : "Download API is not deployed yet. Deploy backend or resubmit this file to preview it in this browser session.";

      toast.error(
        message
      );
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate(`/course/${courseId}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Course
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{course.code}</Badge>
                    <Badge variant="outline">{assignment.type}</Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">{assignment.title}</CardTitle>
                  <p className="text-sm text-gray-600">{course.name} • {course.instructor}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", course.color)}>
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Assignment Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{assignment.description}</p>
              
              {assignment.attachments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {assignment.attachments.map((attachment, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium">{attachment.name}</span>
                          </div>
                          <Download className="h-4 w-4 text-gray-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Submission History */}
          {hasSubmitted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignment.submissions.map((submission, index) => (
                  <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-900">Submitted Successfully</span>
                      </div>
                      <Badge className="bg-green-600">On Time</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4" />
                        <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
                      </div>
                      {submission.files.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 text-gray-700"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate">{file}</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => openSubmittedFile(submission.fileUrl)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                    {submission.score ? (
                      <div className="mt-3 p-3 bg-white rounded border border-green-300">
                        <p className="text-sm font-medium text-gray-700">Score</p>
                        <p className="text-2xl font-bold text-green-600">
                          {submission.score} / {assignment.points}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-white rounded border border-green-300">
                        <p className="text-sm text-gray-600">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submission Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasSubmitted ? (
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-900">Submitted</p>
                  <p className="text-sm text-green-700 mt-1">
                    {new Date(assignment.submissions[0].submittedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : isOverdue ? (
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-red-900">Overdue</p>
                  <p className="text-sm text-red-700 mt-1">{getDaysUntil(assignment.dueDate)}</p>
                </div>
              ) : (
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <Clock className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                  <p className="font-semibold text-orange-900">Not Submitted</p>
                  <p className="text-sm text-orange-700 mt-1">{getDaysUntil(assignment.dueDate)}</p>
                </div>
              )}

              <Separator />

              {/* Due Date */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Due Date</p>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {new Date(assignment.dueDate).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Points */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Points</p>
                <p className="text-2xl font-bold text-gray-900">{assignment.points}</p>
              </div>

              <Separator />

              {/* Late Policy */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Late Policy</p>
                <p className="text-sm text-gray-700">{assignment.latePolicy}</p>
              </div>

              <Separator />

              {/* Action Button */}
              {hasSubmitted ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/course/${courseId}/assignment/${assignmentId}/submit`)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Resubmit
                </Button>
              ) : (
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate(`/course/${courseId}/assignment/${assignmentId}/submit`)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Assignment
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Submission Type</span>
                <Badge variant="outline">{assignment.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available From</span>
                <span className="font-medium">Mar 10, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Attempts Allowed</span>
                <span className="font-medium">Unlimited</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
