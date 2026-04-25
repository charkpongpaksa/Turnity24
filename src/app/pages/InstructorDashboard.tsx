import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Users, 
  BookOpen, 
  Clock,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "../components/ui/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { listAssignments, listCourses, listSubmissions } from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";

export function InstructorDashboard() {
  const navigate = useNavigate();
  const { data: coursesData, loading: coursesLoading } = useAsyncData(() => listCourses(), []);
  const { data: assignmentsData, loading: assignmentsLoading } = useAsyncData(
    () => listAssignments(),
    []
  );
  const { data: submissionsData, loading: submissionsLoading } = useAsyncData(
    () => listSubmissions(),
    []
  );
  const courses = coursesData ?? [];
  const assignments = assignmentsData ?? [];
  const submissions = submissionsData ?? [];

  const totalStudents = courses.reduce((acc, course) => acc + course.students, 0);
  const totalAssignments = assignments.length;
  
  const submissionStats = {
    submitted: submissions.filter(s => s.status === "submitted").length,
    missing: submissions.filter(s => s.status === "missing").length,
    late: submissions.filter(s => s.status === "late").length,
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard 🎓</h1>
        <p className="text-gray-600 mt-1">Manage your courses and track student progress.</p>
      </div>

      {coursesLoading || assignmentsLoading || submissionsLoading ? (
        <p className="mb-4 text-sm text-gray-600">Loading instructor dashboard...</p>
      ) : null}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold mt-1">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold mt-1">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assignments</p>
                <p className="text-2xl font-bold mt-1">{totalAssignments}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
              <Button 
                variant="link" 
                className="text-blue-600"
                onClick={() => navigate("/instructor/courses")}
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <Card 
                  key={course.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/instructor/course/${course.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", course.color)}>
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline">{course.code}</Badge>
                    </div>
                    <CardTitle className="mt-4 text-lg">{course.name}</CardTitle>
                    <CardDescription>Instructor View</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Students
                        </span>
                        <span className="font-medium">{course.students}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Assignments
                        </span>
                        <span className="font-medium">
                          {assignments.filter(a => a.courseId === course.id).length}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/instructor/course/${course.id}`);
                        }}
                      >
                        Manage Course
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Submission Tracking Table */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Tracking</CardTitle>
              <CardDescription>Track student assignment submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Missing</TableHead>
                    <TableHead>Late</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.slice(0, 5).map((assignment) => {
                    const course = courses.find(c => c.id === assignment.courseId);
                    const totalStudents = course?.students || 0;
                    const submitted = Math.floor(Math.random() * totalStudents * 0.7) + Math.floor(totalStudents * 0.2);
                    const missing = Math.floor(Math.random() * (totalStudents - submitted) * 0.5);
                    const late = totalStudents - submitted - missing;
                    
                    return (
                      <TableRow 
                        key={assignment.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/instructor/course/${assignment.courseId}/assignment/${assignment.id}/tracking`)}
                      >
                        <TableCell className="font-medium">{assignment.title}</TableCell>
                        <TableCell>{course?.name}</TableCell>
                        <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">{submitted}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-red-500">{missing}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-500">{late}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Submission Status */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Status</CardTitle>
              <CardDescription>Overall submission statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Submitted</span>
                </div>
                <span className="text-lg font-bold text-green-600">{submissionStats.submitted}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium">Late</span>
                </div>
                <span className="text-lg font-bold text-orange-600">{submissionStats.late}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">Missing</span>
                </div>
                <span className="text-lg font-bold text-red-600">{submissionStats.missing}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
