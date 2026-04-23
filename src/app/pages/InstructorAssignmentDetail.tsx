import { useParams, useNavigate } from "react-router";
import { useState } from "react";
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
} from "lucide-react";
import { mockCourses, mockAssignments } from "../data/mockData";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";


export function InstructorAssignmentDetail() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  
  const [showEditDeadlineModal, setShowEditDeadlineModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const [editAssignmentData, setEditAssignmentData] = useState<Partial<AssignmentFormData> | null>(null);

  const course = mockCourses.find(c => c.id === courseId);
  const assignment = mockAssignments.find(a => a.id === assignmentId);

  if (!course || !assignment) {
    return <div className="p-6">Assignment not found</div>;
  }

  // Initialize edit fields with current deadline
  const initializeEditFields = () => {
    const dueDate = new Date(assignment.dueDate);
    const dateStr = dueDate.toISOString().split('T')[0];
    const timeStr = dueDate.toTimeString().slice(0, 5);
    setEditDate(dateStr);
    setEditTime(timeStr);
  };

  const handleEditDeadlineClick = () => {
    initializeEditFields();
    setShowEditDeadlineModal(true);
  };

  const handleSaveDeadline = () => {
    if (!editDate || !editTime) {
      toast.error("Please select both date and time");
      return;
    }

    // In a real app, this would update the backend
    // For now, we'll just show a success message
    const newDeadline = new Date(`${editDate}T${editTime}`);
    
    toast.success("Deadline updated successfully!");
    toast.info(`New deadline: ${newDeadline.toLocaleString()}`);
    
    setShowEditDeadlineModal(false);
  };

  const handleEditAssignmentClick = () => {
    const dueDate = new Date(assignment.dueDate);
    setEditAssignmentData({
      title: assignment.title,
      description: assignment.description,
      points: assignment.points,
      latePolicy: assignment.latePolicy,
      dueDate: dueDate.toISOString().split('T')[0],
      dueTime: dueDate.toTimeString().slice(0, 5),
      type: (assignment.type as AssignmentFormData['type']) ?? 'file',
      attachments: (assignment.attachments ?? []).map((a, i) => ({
        id: `existing-${i}`,
        name: a.name,
        type: 'url' as const,
        url: a.url,
      })),
    });
    setShowEditAssignmentModal(true);
  };

  const handleSaveAssignment = (data: AssignmentFormData) => {
    // In a real app this would call the backend
    toast.success("Assignment updated successfully!");
    toast.info(`"${data.title}" saved with ${data.attachments.length} attachment(s)`);
    setShowEditAssignmentModal(false);
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
                    <Badge variant="outline">{assignment.type}</Badge>
                    <Badge className="bg-blue-600">Instructor View</Badge>
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
              
              {assignment.attachments && assignment.attachments.length > 0 && (
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
                <p className="text-sm text-gray-500 mt-1">{getDaysUntil(assignment.dueDate)}</p>
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
                <Badge variant="outline">{assignment.type}</Badge>
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
    </div>
  );
}