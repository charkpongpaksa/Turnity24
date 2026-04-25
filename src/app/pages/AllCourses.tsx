import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { BookOpen, Calendar, Pencil, Plus, Users } from "lucide-react";
import { cn } from "../components/ui/utils";
import {
  createCourse,
  listCourses,
  updateCourse,
} from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import { PageBackButton } from "../components/PageBackButton";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";

export function AllCourses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const {
    data: coursesData,
    loading,
    error,
  } = useAsyncData(() => listCourses(), []);
  const courses = coursesData ?? [];
  const [localCourses, setLocalCourses] = useState(courses);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editInstructor, setEditInstructor] = useState("");
  
  const isInstructorView = location.pathname.includes("/instructor");

  useEffect(() => {
    setLocalCourses(courses);
  }, [courses]);

  const handleCourseClick = (courseId: string) => {
    if (isInstructorView) {
      navigate(`/instructor/course/${courseId}`);
    } else {
      navigate(`/course/${courseId}`);
    }
  };

  const selectedCourse =
    localCourses.find((course) => course.id === selectedCourseId) ?? null;

  const openEditDialog = (courseId: string) => {
    const course = localCourses.find((item) => item.id === courseId);
    if (!course) return;

    setSelectedCourseId(courseId);
    setEditName(course.name);
    setEditCode(course.code);
    setEditInstructor(course.instructor);
  };

  const saveCourseChanges = async () => {
    if (!selectedCourseId) return;

    const updatedCourse = await updateCourse(selectedCourseId, {
      name: editName,
      code: editCode,
      instructor: editInstructor,
    });
    if (!updatedCourse) {
      toast.error("Unable to update the course");
      return;
    }

    setLocalCourses((current) =>
      current.map((course) =>
        course.id === selectedCourseId ? updatedCourse : course
      )
    );
    toast.success("Course details updated");
    setSelectedCourseId(null);
  };

  const handleCreateCourse = async () => {
    if (!editName.trim() || !editCode.trim() || !editInstructor.trim()) {
      toast.error("Please fill in all course fields");
      return;
    }

    const createdCourse = await createCourse({
      name: editName,
      code: editCode,
      instructor: editInstructor,
    });
    setLocalCourses((current) => [createdCourse, ...current]);
    toast.success("Course created");
    setShowCreateCourseModal(false);
    setEditName("");
    setEditCode("");
    setEditInstructor("");
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageBackButton
        to={isInstructorView ? "/instructor" : "/student"}
        label="Back to Dashboard"
      />
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isInstructorView ? "My Courses" : "All Courses"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isInstructorView 
                ? "Manage your courses and assignments" 
                : "Browse and access your enrolled courses"}
            </p>
          </div>
          {isInstructorView ? (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setEditName("");
                setEditCode("");
                setEditInstructor(session?.user.nameEn ?? "");
                setShowCreateCourseModal(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? <p className="mb-4 text-sm text-gray-600">Loading courses...</p> : null}
      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="font-medium text-red-700">Unable to load courses.</p>
            <p className="mt-1 text-sm text-red-600">{error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {localCourses.map((course) => (
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
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{course.students} students</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditDialog(course.id);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Course
                      </Button>
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

      <Dialog
        open={Boolean(selectedCourse)}
        onOpenChange={(open) => {
          if (!open) setSelectedCourseId(null);
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update the course information used in the instructor dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-name">Course name</Label>
              <Input
                id="course-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-code">Course code</Label>
              <Input
                id="course-code"
                value={editCode}
                onChange={(event) => setEditCode(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-instructor">Instructor</Label>
              <Input
                id="course-instructor"
                value={editInstructor}
                onChange={(event) => setEditInstructor(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCourseId(null)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveCourseChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateCourseModal} onOpenChange={setShowCreateCourseModal}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Create Course</DialogTitle>
            <DialogDescription>
              Add a new course to the instructor workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-course-name">Course name</Label>
              <Input
                id="new-course-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-course-code">Course code</Label>
              <Input
                id="new-course-code"
                value={editCode}
                onChange={(event) => setEditCode(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-course-instructor">Instructor</Label>
              <Input
                id="new-course-instructor"
                value={editInstructor}
                onChange={(event) => setEditInstructor(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCourseModal(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateCourse}>
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
