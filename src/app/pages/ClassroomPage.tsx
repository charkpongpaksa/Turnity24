import { useParams, useNavigate, useLocation } from "react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { AssignmentFormModal, type AssignmentFormData } from "../components/ui/assignment-form-modal";
import { 
  Clock, 
  Pin, 
  Calendar, 
  Users,
  ArrowRight,
  MessageSquare,
  ThumbsUp,
  Plus,
  FileText,
  X
} from "lucide-react";
import { mockCourses, mockAssignments, mockAnnouncements, mockDiscussions, mockStudents } from "../data/mockData";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

export function ClassroomPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isInstructorView = location.pathname.includes("/instructor");

  // Modal states
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);

  // Form states for Announcement
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementPinned, setAnnouncementPinned] = useState(false);

  // AssignmentFormModal uses its own internal state — no extra state needed here

  // Form states for Discussion
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionContent, setDiscussionContent] = useState("");

  const course = mockCourses.find(c => c.id === courseId);
  const [localAnnouncements, setLocalAnnouncements] = useState(mockAnnouncements.filter(a => a.courseId === courseId));
  const [localAssignments, setLocalAssignments] = useState(mockAssignments.filter(a => a.courseId === courseId));
  const [localDiscussions, setLocalDiscussions] = useState(mockDiscussions.filter(d => d.courseId === courseId));

  if (!course) {
    return <div className="p-6">Course not found</div>;
  }

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

  const getDaysUntil = (dueDate: string) => {
    const daysUntil = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    return `Due in ${daysUntil} days`;
  };

  const getUrgencyColor = (dueDate: string) => {
    const daysUntil = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return "text-red-600 bg-red-50";
    if (daysUntil <= 2) return "text-orange-600 bg-orange-50";
    return "text-gray-600 bg-gray-50";
  };

  // Handler functions
  const handleCreateAnnouncement = () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const newAnnouncement = {
      id: `ann-${Date.now()}`,
      courseId: courseId ?? "",
      title: announcementTitle,
      content: announcementContent,
      author: course.instructor,
      timestamp: new Date().toISOString(),
      pinned: announcementPinned
    };
    setLocalAnnouncements([newAnnouncement, ...localAnnouncements]);
    setShowAnnouncementModal(false);
    
    // Reset form
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementPinned(false);
    
    toast.success("Announcement created successfully!");
  };

  const handleCreateAssignment = (data: AssignmentFormData) => {
    const newAssignment = {
      id: `ass-${Date.now()}`,
      courseId: courseId ?? "",
      title: data.title,
      description: data.description,
      points: data.points,
      type: data.type,
      dueDate: new Date(`${data.dueDate}T${data.dueTime}`).toISOString(),
      latePolicy: data.latePolicy,
      status: "not_submitted" as const,
      attachments: data.attachments.map(att => ({ name: att.name, url: att.url ?? "" })),
      submissions: [] as never[],
    };
    setLocalAssignments([...localAssignments, newAssignment]);
    toast.success("Assignment created successfully!");
  };

  const handleCreateDiscussion = () => {
    if (!discussionTitle.trim() || !discussionContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const newDiscussion = {
      id: `dis-${Date.now()}`,
      courseId: courseId ?? "",
      title: discussionTitle,
      content: discussionContent,
      author: isInstructorView ? course.instructor : "Student Name",
      authorAvatar: isInstructorView 
        ? "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop"
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      timestamp: new Date().toISOString(),
      replies: 0,
      likes: 0
    };
    setLocalDiscussions([newDiscussion, ...localDiscussions]);
    setShowDiscussionModal(false);
    
    // Reset form
    setDiscussionTitle("");
    setDiscussionContent("");
    
    toast.success("Discussion created successfully!");
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Course Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center", course.color)}>
            <span className="text-white text-2xl font-bold">{course.code.slice(0, 2)}</span>
          </div>
          <div>
            <Badge variant="outline" className="mb-2">{course.code}</Badge>
            <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
            <p className="text-gray-600">{course.instructor}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="announcements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Course Announcements</h2>
            {isInstructorView && (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAnnouncementModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {localAnnouncements.map((announcement) => (
              <Card key={announcement.id} className={cn(announcement.pinned && "border-blue-300 bg-blue-50/50")}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {announcement.pinned && (
                        <Pin className="h-4 w-4 text-blue-600" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    </div>
                    {announcement.pinned && (
                      <Badge className="bg-blue-600">Pinned</Badge>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4">{announcement.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{announcement.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span>{announcement.author}</span>
                    </div>
                    <span>{new Date(announcement.timestamp).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Course Assignments</h2>
            {isInstructorView && (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAssignmentModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {localAssignments.map((assignment) => (
              <Card 
                key={assignment.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (isInstructorView) {
                    navigate(`/instructor/course/${courseId}/assignment/${assignment.id}`);
                  } else {
                    navigate(`/course/${courseId}/assignment/${assignment.id}`);
                  }
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        {getStatusBadge(assignment.status)}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{assignment.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className={cn(
                          "flex items-center gap-1 px-3 py-1 rounded-full",
                          getUrgencyColor(assignment.dueDate)
                        )}>
                          <Clock className="h-4 w-4" />
                          <span>{getDaysUntil(assignment.dueDate)}</span>
                        </div>
                        <span className="text-gray-600">{assignment.points} points</span>
                        <Badge variant="outline">{assignment.type}</Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Discussion Tab */}
        <TabsContent value="discussion" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Class Discussion</h2>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowDiscussionModal(true)}>New Discussion</Button>
          </div>

          <div className="space-y-4">
            {localDiscussions.map((discussion) => (
              <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={discussion.authorAvatar} />
                      <AvatarFallback>{discussion.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{discussion.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{discussion.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{discussion.author}</span>
                        <span>•</span>
                        <span>{new Date(discussion.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <Button variant="ghost" size="sm" className="text-gray-600">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {discussion.replies} replies
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {discussion.likes} likes
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Course Members</h2>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600">{course.students} students</span>
            </div>
          </div>

          {/* Instructor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop" />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{course.instructor}</p>
                  <p className="text-sm text-gray-600">instructor@university.edu</p>
                </div>
                <Button variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  navigate("/messages");
                }}>Message</Button>
              </div>
            </CardContent>
          </Card>

          {/* Students */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Announcement Modal */}
      <Dialog open={showAnnouncementModal} onOpenChange={setShowAnnouncementModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              Add a new announcement to your course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Announcement Title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Announcement Content"
                className="min-h-[120px]"
              />
            </div>
            <div className="flex items-center justify-between space-y-0">
              <Label htmlFor="pinned">Pin to top</Label>
              <Switch
                id="pinned"
                checked={announcementPinned}
                onCheckedChange={(checked) => setAnnouncementPinned(checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateAnnouncement}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Modal — upgraded to AssignmentFormModal */}
      <AssignmentFormModal
        open={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSave={handleCreateAssignment}
        mode="create"
        courseId={courseId}
      />

      {/* Discussion Modal */}
      <Dialog open={showDiscussionModal} onOpenChange={setShowDiscussionModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Discussion</DialogTitle>
            <DialogDescription>
              Add a new discussion to your course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={discussionTitle}
                onChange={(e) => setDiscussionTitle(e.target.value)}
                placeholder="Discussion Title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={discussionContent}
                onChange={(e) => setDiscussionContent(e.target.value)}
                placeholder="Discussion Content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateDiscussion}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}