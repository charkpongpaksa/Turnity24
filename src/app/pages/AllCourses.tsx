import { useNavigate, useLocation } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { BookOpen, Calendar, Users } from "lucide-react";
import { mockCourses } from "../data/mockData";
import { cn } from "../components/ui/utils";

export function AllCourses() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isInstructorView = location.pathname.includes("/instructor");

  const handleCourseClick = (courseId: string) => {
    if (isInstructorView) {
      navigate(`/instructor/course/${courseId}`);
    } else {
      navigate(`/course/${courseId}`);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isInstructorView ? "My Courses" : "All Courses"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isInstructorView 
            ? "Manage your courses and assignments" 
            : "Browse and access your enrolled courses"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCourses.map((course) => (
          <Card 
            key={course.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleCourseClick(course.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center", course.color)}>
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <Badge variant="outline">{course.code}</Badge>
              </div>
              <CardTitle className="mt-4 text-lg">{course.name}</CardTitle>
              <CardDescription>{course.instructor}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!isInstructorView && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </>
                )}
                <div className="flex items-center justify-between text-sm pt-2">
                  {isInstructorView ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{course.students} students</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Next: {new Date(course.nextDeadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
