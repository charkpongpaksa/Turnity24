import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  BarChart3, 
  TrendingUp, 
  Target,
  FileText
} from "lucide-react";
import { PageBackButton } from "../components/PageBackButton";
import { getCourseAnalytics, getAssignmentAnalytics, listAssignments, getCourseById } from "@/lib/data/repository";
import { Assignment, Course } from "@/lib/types/models";
import { toast } from "sonner";

export function AnalyticsDashboard() {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courseStats, setCourseStats] = useState<any>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignmentStats, setAssignmentStats] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!courseId) return;
      try {
        const [courseData, assignmentsData, stats] = await Promise.all([
          getCourseById(courseId),
          listAssignments(courseId),
          getCourseAnalytics(courseId)
        ]);
        setCourse(courseData);
        setAssignments(assignmentsData);
        setCourseStats(stats);
        
        if (assignmentsData.length > 0) {
          setSelectedAssignmentId(assignmentsData[0].id);
        }
      } catch (error) {
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [courseId]);

  useEffect(() => {
    async function loadAssignmentStats() {
      if (!courseId || !selectedAssignmentId) return;
      try {
        const stats = await getAssignmentAnalytics(courseId, selectedAssignmentId);
        setAssignmentStats(stats);
      } catch (error) {
        console.error("Failed to load assignment stats", error);
      }
    }
    loadAssignmentStats();
  }, [courseId, selectedAssignmentId]);

  if (loading) return <div className="p-6">Loading analytics...</div>;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageBackButton to={`/instructor/course/${courseId}`} label="Back to Course" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Course Analytics</h1>
        <p className="text-gray-600 mt-1">{course?.name} ({course?.code})</p>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Students" 
          value={courseStats?.studentCount ?? 0} 
          icon={<Users className="h-5 w-5 text-blue-600" />} 
          description="Enrolled in course"
        />
        <StatCard 
          title="Assignments" 
          value={courseStats?.assignmentCount ?? 0} 
          icon={<FileText className="h-5 w-5 text-purple-600" />} 
          description="Active assignments"
        />
        <StatCard 
          title="Completion Rate" 
          value={`${courseStats?.completionRate ?? 0}%`} 
          icon={<TrendingUp className="h-5 w-5 text-green-600" />} 
          description="Overall submission rate"
        />
        <StatCard 
          title="Avg. Score" 
          value={courseStats?.averageScore ?? 0} 
          icon={<Target className="h-5 w-5 text-orange-600" />} 
          description="Across all graded work"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Assignments</CardTitle>
            <CardDescription>Select an assignment to view detailed stats</CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {assignments.map(assignment => (
                <button
                  key={assignment.id}
                  onClick={() => setSelectedAssignmentId(assignment.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-md transition-colors flex items-center justify-between",
                    selectedAssignmentId === assignment.id 
                      ? "bg-blue-50 border-l-4 border-blue-600" 
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className="truncate pr-4">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      selectedAssignmentId === assignment.id ? "text-blue-700" : "text-gray-900"
                    )}>
                      {assignment.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(assignment.dueDate).toLocaleDateString()}</p>
                  </div>
                  {selectedAssignmentId === assignment.id && (
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg">
                {assignments.find(a => a.id === selectedAssignmentId)?.title || "Assignment Detail"}
              </CardTitle>
              <CardDescription>Performance breakdown and submission metrics</CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {assignmentStats?.submissionCount ?? 0} Submissions
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Submission Progress</span>
                    <span className="font-semibold">{assignmentStats?.completionRate ?? 0}%</span>
                  </div>
                  <Progress value={assignmentStats?.completionRate ?? 0} className="h-2 bg-blue-100" />
                  <p className="text-xs text-gray-400 mt-2">
                    {assignmentStats?.submissionCount ?? 0} of {courseStats?.studentCount ?? 0} students submitted
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Highest Score</p>
                    <p className="text-xl font-bold text-green-600">{assignmentStats?.highestScore ?? 0}</p>
                  </div>
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Lowest Score</p>
                    <p className="text-xl font-bold text-red-600">{assignmentStats?.lowestScore ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                <p className="text-sm font-medium text-blue-700 mb-1">Average Class Score</p>
                <p className="text-5xl font-black text-blue-600">{assignmentStats?.averageScore ?? 0}</p>
                <div className="flex items-center gap-1 mt-4 text-xs text-blue-500 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  {assignmentStats?.gradedCount ?? 0} graded so far
                </div>
              </div>
            </div>
            
            <div className="pt-4 mt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Submission Trends</h4>
              <p className="text-sm text-gray-500">
                {assignmentStats
                  ? `Current completion is ${assignmentStats.completionRate ?? 0}% with ${assignmentStats.gradedCount ?? 0} graded submissions and an average score of ${assignmentStats.averageScore ?? 0}.`
                  : "Assignment analytics will appear here once submission data is available."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description }: { title: string, value: any, icon: React.ReactNode, description: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {icon}
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
