import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { AssignmentFormModal, type AssignmentFormData } from "../components/ui/assignment-form-modal";
import { 
  Clock, 
  FileText, 
  Download, 
  ArrowLeft,
  Calendar,
  Users,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { deleteAssignment, getAssignmentById, getCourseById, updateAssignment } from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import type { Assignment } from "@/lib/types/models";


export function InstructorAssignmentDetail() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  
  const [showEditDeadlineModal, setShowEditDeadlineModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const [editAssignmentData, setEditAssignmentData] = useState<Partial<AssignmentFormData> | null>(null);
  const [localAssignment, setLocalAssignment] = useState<Assignment | null>(null);

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

  useEffect(() => {
    setLocalAssignment(assignment);
  }, [assignment]);

  if (courseLoading || assignmentLoading) {
    return <div className="p-6">Loading assignment...</div>;
  }

  if (!course || !assignment) {
    return <div className="p-6">Assignment not found</div>;
  }

  const currentAssignment = localAssignment ?? assignment;

  // Initialize edit fields with current deadline
  const initializeEditFields = () => {
    const dueDate = new Date(currentAssignment.dueDate);
    const dateStr = dueDate.toISOString().split('T')[0];
    const timeStr = dueDate.toTimeString().slice(0, 5);
    setEditDate(dateStr);
    setEditTime(timeStr);
  };

  const handleEditDeadlineClick = () => {
    initializeEditFields();
    setShowEditDeadlineModal(true);
  };

  const handleSaveDeadline = async () => {
    if (!editDate || !editTime) {
      toast.error("Please select both date and time");
      return;
    }

    const newDeadline = new Date(`${editDate}T${editTime}`);
    if (!courseId || !assignmentId) return;

    const updated = await updateAssignment(courseId, assignmentId, {
      dueDate: newDeadline.toISOString(),
    });
    if (!updated) {
      toast.error("Unable to update deadline");
      return;
    }

    setLocalAssignment(updated);
    toast.success("Deadline updated successfully!");
    toast.info(`New deadline: ${newDeadline.toLocaleString()}`);
    
    setShowEditDeadlineModal(false);
  };

  const handleEditAssignmentClick = () => {
    const dueDate = new Date(currentAssignment.dueDate);
    setEditAssignmentData({
      title: currentAssignment.title,
      description: currentAssignment.description,
      points: currentAssignment.points,
      latePolicy: currentAssignment.latePolicy,
      dueDate: dueDate.toISOString().split('T')[0],
      dueTime: dueDate.toTimeString().slice(0, 5),
      type: (currentAssignment.type as AssignmentFormData['type']) ?? 'file',
      attachments: (currentAssignment.attachments ?? []).map((a, i) => ({
        id: `existing-${i}`,
        name: a.name,
        type: 'url' as const,
        url: a.url,
      })),
    });
    setShowEditAssignmentModal(true);
  };

  const handleSaveAssignment = async (data: AssignmentFormData) => {
    if (!courseId || !assignmentId) return;

    const updated = await updateAssignment(courseId, assignmentId, {
      title: data.title,
      description: data.description,
      points: data.points,
      type: data.type,
      dueDate: new Date(`${data.dueDate}T${data.dueTime}`).toISOString(),
      latePolicy: data.latePolicy,
      attachments: data.attachments.map((attachment) => ({
        name: attachment.name,
        url: attachment.url ?? "",
      })),
    });
    if (!updated) {
      toast.error("Unable to update assignment");
      return;
    }

    setLocalAssignment(updated);
    toast.success("Assignment updated successfully!");
    setShowEditAssignmentModal(false);
  };

  const handleDeleteAssignment = async () => {
    if (!courseId || !assignmentId) return;

    setDeletingAssignment(true);
    try {
      const deleted = await deleteAssignment(courseId, assignmentId);
      if (!deleted) {
        toast.error("Unable to delete assignment");
        return;
      }

      toast.success("Assignment deleted");
      setShowDeleteDialog(false);
      navigate(`/instructor/course/${courseId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete assignment");
    } finally {
      setDeletingAssignment(false);
    }
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
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate(`/instructor/course/${courseId}`)}
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
                    <Badge variant="outline">{currentAssignment.type}</Badge>
                    <Badge className="bg-blue-600">Instructor View</Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">{currentAssignment.title}</CardTitle>
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
              <p className="text-gray-700 leading-relaxed">{currentAssignment.description}</p>
              
              {currentAssignment.attachments && currentAssignment.attachments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {currentAssignment.attachments.map((attachment, index) => (
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Due Date */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Due Date</p>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {new Date(currentAssignment.dueDate).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{getDaysUntil(currentAssignment.dueDate)}</p>
              </div>

              <Separator />

              {/* Points */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Points</p>
                <p className="text-2xl font-bold text-gray-900">{currentAssignment.points}</p>
              </div>

              <Separator />

              {/* Late Policy */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Late Policy</p>
                <p className="text-sm text-gray-700">{currentAssignment.latePolicy}</p>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate(`/instructor/course/${courseId}/assignment/${assignmentId}/tracking`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Submissions
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleEditAssignmentClick}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Assignment
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleEditDeadlineClick}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Edit Deadline
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Assignment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Course Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Total Students</span>
                </div>
                <span className="font-semibold text-gray-900">{course.students}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Submission Type</span>
                <Badge variant="outline">{currentAssignment.type}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Deadline Modal */}
      <Dialog open={showEditDeadlineModal} onOpenChange={setShowEditDeadlineModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Assignment Deadline</DialogTitle>
            <DialogDescription>
              Update the due date and time for this assignment. Changes will be reflected across all views.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Due Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">Due Time</Label>
              <Input
                id="edit-time"
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
              />
            </div>
            {editDate && editTime && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">New deadline:</p>
                <p className="font-medium text-gray-900">
                  {new Date(`${editDate}T${editTime}`).toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDeadlineModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveDeadline}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Modal — upgraded to AssignmentFormModal */}
      {editAssignmentData && (
        <AssignmentFormModal
          open={showEditAssignmentModal}
          onClose={() => setShowEditAssignmentModal(false)}
          onSave={handleSaveAssignment}
          initialData={editAssignmentData}
          mode="edit"
        />
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              This will remove "{currentAssignment.title}" from this course. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingAssignment}
              onClick={handleDeleteAssignment}
            >
              {deletingAssignment ? "Deleting..." : "Delete Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
