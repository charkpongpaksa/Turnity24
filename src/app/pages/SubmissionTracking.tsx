import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { PageBackButton } from "../components/PageBackButton";
import {
  getAssignmentById,
  getCourseById,
  listStudents,
  listSubmissions,
} from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";

export function SubmissionTracking() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "submitted" | "missing" | "late">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { data: course, loading: courseLoading } = useAsyncData(
    () => (courseId ? getCourseById(courseId) : Promise.resolve(null)),
    [courseId]
  );
  const { data: assignment, loading: assignmentLoading } = useAsyncData(
    () =>
      courseId && assignmentId
        ? getAssignmentById(courseId, assignmentId)
        : Promise.resolve(null),
    [courseId, assignmentId]
  );
  const { data: studentsData, loading: studentsLoading } = useAsyncData(
    () => listStudents(),
    []
  );
  const { data: submissionsData, loading: submissionsLoading } = useAsyncData(
    () => listSubmissions({ courseId, assignmentId }),
    [assignmentId, courseId]
  );
  const students = studentsData ?? [];
  const submissions = submissionsData ?? [];
  const [localSubmissions, setLocalSubmissions] = useState(submissions);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, string>>(
    Object.fromEntries(
      submissions
        .filter((submission) => submission.score !== null)
        .map((submission) => [submission.studentId, String(submission.score)])
    )
  );

  useEffect(() => {
    setLocalSubmissions(submissions);
    setGradeDrafts(
      Object.fromEntries(
        submissions
          .filter((submission) => submission.score !== null)
          .map((submission) => [submission.studentId, String(submission.score)])
      )
    );
  }, [submissions]);

  if (courseLoading || assignmentLoading || studentsLoading || submissionsLoading) {
    return <div className="p-6">Loading submissions...</div>;
  }

  if (!course || !assignment) {
    return <div className="p-6">Assignment not found</div>;
  }

  // Combine student and submission data
  const studentSubmissions = students.map(student => {
    const submission = localSubmissions.find(
      s => s.studentId === student.id && s.assignmentId === assignmentId
    );
    return {
      ...student,
      submission: submission || null,
    };
  });

  // Filter logic
  const filteredSubmissions = studentSubmissions.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === "all") return true;
    if (filter === "submitted") return item.submission?.status === "submitted";
    if (filter === "missing") return !item.submission || item.submission.status === "missing";
    if (filter === "late") return item.submission?.status === "late";
    
    return true;
  });

  const stats = {
    total: studentSubmissions.length,
    submitted: studentSubmissions.filter(s => s.submission?.status === "submitted").length,
    missing: studentSubmissions.filter(s => !s.submission || s.submission.status === "missing").length,
    late: studentSubmissions.filter(s => s.submission?.status === "late").length,
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === "missing") {
      return <Badge className="bg-red-500">Missing</Badge>;
    }
    if (status === "submitted") {
      return <Badge className="bg-green-500">Submitted</Badge>;
    }
    if (status === "late") {
      return <Badge className="bg-orange-500">Late</Badge>;
    }
    return null;
  };

  const averageScore = studentSubmissions
    .filter(s => s.submission?.score)
    .reduce((acc, s) => acc + (s.submission?.score || 0), 0) / 
    studentSubmissions.filter(s => s.submission?.score).length || 0;

  const selectedSubmission =
    studentSubmissions.find((item) => item.id === selectedStudentId) ?? null;

  const saveGrade = (studentId: string) => {
    const rawGrade = gradeDrafts[studentId];
    const numericGrade = Number(rawGrade);

    if (Number.isNaN(numericGrade) || numericGrade < 0 || numericGrade > assignment.points) {
      toast.error(`Enter a grade between 0 and ${assignment.points}`);
      return;
    }

    setLocalSubmissions((current) =>
      current.map((submission) =>
        submission.studentId === studentId && submission.assignmentId === assignmentId
          ? { ...submission, score: numericGrade }
          : submission
      )
    );
    toast.success("Grade saved");
  };

  const getSubmissionPreview = () => {
    if (!selectedSubmission?.submission) return null;

    if (assignment.type === "text") {
      return {
        title: "Text Submission",
        body: `${selectedSubmission.name} submitted a written response for "${assignment.title}". This is a mock preview for frontend testing.`,
      };
    }

    if (assignment.type === "link") {
      return {
        title: "Submitted Link",
        body: `https://projects.example.edu/${selectedSubmission.name.toLowerCase().replace(/\s+/g, "-")}/${assignment.id}`,
      };
    }

    return {
      title: "Submitted Files",
      body: `${selectedSubmission.name}_assignment_${assignment.id}.pdf\n${selectedSubmission.name}_appendix.zip`,
    };
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <PageBackButton
        to={`/instructor/course/${courseId}/assignment/${assignmentId}`}
        label="Back to Assignment"
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="outline">{course.code}</Badge>
          <Badge variant="outline">Instructor View</Badge>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{assignment.title}</h1>
        <p className="text-gray-600">Track and grade student submissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Submitted</p>
            <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Missing</p>
            <p className="text-2xl font-bold text-red-600">{stats.missing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Late</p>
            <p className="text-2xl font-bold text-orange-600">{stats.late}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Avg. Score</p>
            <p className="text-2xl font-bold text-blue-600">
              {averageScore > 0 ? averageScore.toFixed(1) : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search students by name or email..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="submitted">Submitted ({stats.submitted})</TabsTrigger>
                <TabsTrigger value="missing">Missing ({stats.missing})</TabsTrigger>
                <TabsTrigger value="late">Late ({stats.late})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Student Submissions</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submission Time</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No submissions found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={item.avatar} />
                            <AvatarFallback>{item.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.submission?.status)}
                      </TableCell>
                      <TableCell>
                        {item.submission?.submittedAt ? (
                          <div className="text-sm">
                            <p className="text-gray-900">
                              {new Date(item.submission.submittedAt).toLocaleDateString()}
                            </p>
                            <p className="text-gray-500">
                              {new Date(item.submission.submittedAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.submission?.score !== null && item.submission?.score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-20 h-8"
                              value={gradeDrafts[item.id] ?? String(item.submission.score)}
                              onChange={(event) =>
                                setGradeDrafts((current) => ({
                                  ...current,
                                  [item.id]: event.target.value,
                                }))
                              }
                              max={assignment.points}
                              min={0}
                            />
                            <span className="text-sm text-gray-500">/ {assignment.points}</span>
                          </div>
                        ) : item.submission?.status === "submitted" ? (
                          <Input
                            type="number"
                            className="w-20 h-8"
                            placeholder="Grade"
                            value={gradeDrafts[item.id] ?? ""}
                            onChange={(event) =>
                              setGradeDrafts((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                            max={assignment.points}
                            min={0}
                          />
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.submission?.status === "submitted" || item.submission?.status === "late" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStudentId(item.id)}
                            >
                              View
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => saveGrade(item.id)}
                            >
                              Grade
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" disabled>
                            No Submission
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {filteredSubmissions.length} of {stats.total} students
        </p>
        <div className="flex gap-2">
          <Button variant="outline">Send Reminder to Missing</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Grade All Submissions</Button>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedSubmission)}
        onOpenChange={(open) => {
          if (!open) setSelectedStudentId(null);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Submission Review</DialogTitle>
            <DialogDescription>
              View the submitted work for {selectedSubmission?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission?.submission ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Submission type</p>
                <p className="font-medium text-gray-900">{assignment.type}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="mb-2 text-sm font-medium text-gray-900">
                  {getSubmissionPreview()?.title}
                </p>
                <pre className="whitespace-pre-wrap text-sm text-gray-600">
                  {getSubmissionPreview()?.body}
                </pre>
              </div>
              <div className="text-sm text-gray-500">
                Submitted at{" "}
                {selectedSubmission.submission.submittedAt
                  ? new Date(selectedSubmission.submission.submittedAt).toLocaleString()
                  : "-"}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedStudentId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
