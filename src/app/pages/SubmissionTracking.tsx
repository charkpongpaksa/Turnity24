import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
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
  ArrowLeft, 
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from "lucide-react";
import { mockCourses, mockAssignments, mockStudents, mockSubmissions } from "../data/mockData";
import { cn } from "../components/ui/utils";

export function SubmissionTracking() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "submitted" | "missing" | "late">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const course = mockCourses.find(c => c.id === courseId);
  const assignment = mockAssignments.find(a => a.id === assignmentId);

  if (!course || !assignment) {
    return <div className="p-6">Assignment not found</div>;
  }

  // Combine student and submission data
  const studentSubmissions = mockStudents.map(student => {
    const submission = mockSubmissions.find(
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

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate(`/instructor/course/${courseId}/assignment/${assignmentId}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Assignment
      </Button>

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
                              value={item.submission.score}
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
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
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
    </div>
  );
}