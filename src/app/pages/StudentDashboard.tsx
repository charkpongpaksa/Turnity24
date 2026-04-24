import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  BookOpen,
  TrendingUp,
  Pin,
  ArrowRight
} from "lucide-react";
import { cn } from "../components/ui/utils";
import {
  listAnnouncements,
  listAssignments,
  listCourses,
} from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import { useAuth } from "@/features/auth/AuthProvider";

export function StudentDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: coursesData, loading: coursesLoading } = useAsyncData(
    () => listCourses(),
    []
  );
  const { data: assignmentsData, loading: assignmentsLoading } = useAsyncData(
    () => listAssignments(),
    []
  );
  const { data: announcementsData, loading: announcementsLoading } = useAsyncData(
    () => listAnnouncements(),
    []
  );
  const courses = coursesData ?? [];
  const assignments = assignmentsData ?? [];
  const announcements = announcementsData ?? [];
  const isLoading = coursesLoading || assignmentsLoading || announcementsLoading;

  const upcomingAssignments = assignments
    .map(a => ({
      ...a,
      course: courses.find(c => c.id === a.courseId),
    }))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const recentAnnouncements = announcements.slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-green-500">Submitted</Badge>;
      case "late":
        return <Badge className="bg-orange-500">Late</Badge>;
      case "not_submitted":
        return <Badge variant="outline">Not Submitted</Badge>;
      default:
        return null;
    }
  };

  const getUrgencyColor = (dueDate: string) => {
    const daysUntil = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return "text-red-600";
    if (daysUntil <= 2) return "text-orange-600";
    return "text-gray-600";
  };

  const getDaysUntil = (dueDate: string) => {
    const daysUntil = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    return `Due in ${daysUntil} days`;
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.nameEn?.split(" ")[0] ?? "Student"}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your courses today.</p>
      </div>

      {isLoading ? (
        <Card className="mb-6">
          <CardContent className="p-6 text-sm text-gray-600">
            Loading dashboard data...
          </CardContent>
        </Card>
      ) : null}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold mt-1">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold mt-1">
                  {assignments.filter(a => a.status === "not_submitted").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold mt-1">
                  {assignments.filter(a => a.status === "submitted").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Courses and Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
              <Button 
                variant="link" 
                className="text-blue-600"
                onClick={() => navigate("/courses")}
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <Card 
                  key={course.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", course.color)}>
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline">{course.code}</Badge>
                    </div>
                    <CardTitle className="mt-4 text-lg">{course.name}</CardTitle>
                    <CardDescription>{course.instructor}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                        <Calendar className="h-4 w-4" />
                        <span>Next: {new Date(course.nextDeadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Deadlines</h2>
              <Button
                variant="link"
                className="text-blue-600"
                onClick={() => navigate("/deadlines")}
              >
                View All
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {upcomingAssignments.map((assignment, index) => (
                  <div
                    key={assignment.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                      index !== upcomingAssignments.length - 1 && "border-b border-gray-200"
                    )}
                    onClick={() => navigate(`/course/${assignment.courseId}/assignment/${assignment.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                          {getStatusBadge(assignment.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{assignment.course?.name}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className={cn("flex items-center gap-1", getUrgencyColor(assignment.dueDate))}>
                            <Clock className="h-4 w-4" />
                            <span>{getDaysUntil(assignment.dueDate)}</span>
                          </div>
                          <span className="text-gray-500">{assignment.points} points</span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 mt-1" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Announcements and Quick Actions */}
        <div className="space-y-6">
          {/* Recent Announcements */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Announcements</h2>
            <div className="space-y-4">
              {recentAnnouncements.map((announcement) => (
                <Card 
                  key={announcement.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/course/${announcement.courseId}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 flex-1">{announcement.title}</h3>
                      {announcement.pinned && <Pin className="h-4 w-4 text-blue-600 ml-2" />}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{announcement.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{announcement.author}</span>
                      <span>{new Date(announcement.timestamp).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Submission Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Submitted</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {assignments.filter(a => a.status === "submitted").length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <span className="text-lg font-bold text-orange-600">
                  {assignments.filter(a => a.status === "not_submitted").length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">Late</span>
                </div>
                <span className="text-lg font-bold text-red-600">
                  {assignments.filter(a => a.status === "late").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
