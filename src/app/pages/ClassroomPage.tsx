import { useParams, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
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
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { PageBackButton } from "../components/PageBackButton";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  addDiscussionComment,
  addStudentToCourse as addStudentToCourseRequest,
  createAnnouncement,
  createAssignment,
  createDiscussion,
  deleteDiscussion as deleteDiscussionRequest,
  getCourseById,
  listAnnouncements,
  listAssignments,
  listCourseStudents,
  listDiscussions,
  listStudents,
  removeStudentFromCourse as removeStudentFromCourseRequest,
  toggleDiscussionLike as toggleDiscussionLikeRequest,
  updateAnnouncement,
  updateCourse,
  updateDiscussion,
} from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import type { Discussion, DiscussionComment } from "@/lib/types/models";

type LocalDiscussion = Discussion & {
  authorId: string;
  authorRole: "student" | "instructor";
  likedBy: string[];
  comments: DiscussionComment[];
};

function hydrateDiscussion(discussion: Discussion): LocalDiscussion {
  return {
    ...discussion,
    authorId:
      discussion.authorId ??
      `author-${discussion.author.replace(/\s+/g, "-").toLowerCase()}`,
    authorRole: discussion.authorRole ?? "student",
    likedBy: discussion.likedBy ?? [],
    comments: discussion.comments ?? [],
  };
}

export function ClassroomPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const isInstructorView = location.pathname.includes("/instructor");

  // Modal states
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditAnnouncementModal, setShowEditAnnouncementModal] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [editingDiscussionId, setEditingDiscussionId] = useState<string | null>(null);
  const [editingDiscussionContent, setEditingDiscussionContent] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  // Form states for Announcement
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementPinned, setAnnouncementPinned] = useState(false);

  // AssignmentFormModal uses its own internal state — no extra state needed here

  // Form states for Discussion
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionContent, setDiscussionContent] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseInstructor, setCourseInstructor] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const { data: course, loading: courseLoading } = useAsyncData(
    () => (courseId ? getCourseById(courseId) : Promise.resolve(null)),
    [courseId]
  );
  const { data: announcementsData, loading: announcementsLoading } = useAsyncData(
    () => listAnnouncements(courseId),
    [courseId]
  );
  const { data: assignmentsData, loading: assignmentsLoading } = useAsyncData(
    () => listAssignments(courseId),
    [courseId]
  );
  const { data: discussionsData, loading: discussionsLoading } = useAsyncData(
    () => listDiscussions(courseId),
    [courseId]
  );
  const { data: studentsData, loading: studentsLoading } = useAsyncData(
    () => listStudents(),
    []
  );
  const { data: enrolledStudentsData, loading: enrolledStudentsLoading } = useAsyncData(
    () => (courseId ? listCourseStudents(courseId) : Promise.resolve([])),
    [courseId]
  );
  const [localAnnouncements, setLocalAnnouncements] = useState(announcementsData ?? []);
  const [localAssignments, setLocalAssignments] = useState(assignmentsData ?? []);
  const [localDiscussions, setLocalDiscussions] = useState<LocalDiscussion[]>([]);
  const [localCourse, setLocalCourse] = useState(course);
  const students = studentsData ?? [];
  const [enrolledStudents, setEnrolledStudents] = useState(enrolledStudentsData ?? []);

  useEffect(() => {
    setLocalAnnouncements(announcementsData ?? []);
  }, [announcementsData]);

  useEffect(() => {
    setLocalAssignments(assignmentsData ?? []);
  }, [assignmentsData]);

  useEffect(() => {
    setLocalDiscussions((discussionsData ?? []).map(hydrateDiscussion));
  }, [discussionsData]);

  useEffect(() => {
    setLocalCourse(course);
  }, [course]);

  useEffect(() => {
    if (!localCourse) return;
    setCourseName(localCourse.name);
    setCourseCode(localCourse.code);
    setCourseInstructor(localCourse.instructor);
  }, [localCourse]);

  useEffect(() => {
    setEnrolledStudents(enrolledStudentsData ?? []);
  }, [enrolledStudentsData]);

  if (courseLoading || announcementsLoading || assignmentsLoading || discussionsLoading || studentsLoading || enrolledStudentsLoading) {
    return <div className="p-6">Loading course...</div>;
  }

  if (!localCourse) {
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
  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!courseId) return;

    const newAnnouncement = await createAnnouncement(courseId, {
      title: announcementTitle,
      content: announcementContent,
      author: courseInstructor,
      pinned: announcementPinned,
    });
    setLocalAnnouncements([newAnnouncement, ...localAnnouncements]);
    setShowAnnouncementModal(false);
    
    // Reset form
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementPinned(false);
    
    toast.success("Announcement created successfully!");
  };

  const handleCreateAssignment = async (data: AssignmentFormData) => {
    if (!courseId) return;

    const newAssignment = await createAssignment(courseId, {
      title: data.title,
      description: data.description,
      points: data.points,
      type: data.type,
      dueDate: new Date(`${data.dueDate}T${data.dueTime}`).toISOString(),
      latePolicy: data.latePolicy,
      status: "not_submitted",
      attachments: data.attachments.map((att) => ({
        name: att.name,
        url: att.url ?? "",
      })),
    });
    setLocalAssignments((current) => [...current, newAssignment]);
    toast.success("Assignment created successfully!");
  };

  const handleCreateDiscussion = async () => {
    if (!discussionTitle.trim() || !discussionContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!courseId) return;

    const newDiscussion = await createDiscussion(courseId, {
      title: discussionTitle,
      content: discussionContent,
      author: session?.user.nameEn ?? (isInstructorView ? courseInstructor : "Student Name"),
      authorAvatar:
        session?.user.role === "instructor"
          ? "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop"
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      authorId: session?.user.id ?? "guest",
      authorRole: session?.user.role ?? "student",
    });
    setLocalDiscussions((current) => [hydrateDiscussion(newDiscussion), ...current]);
    setShowDiscussionModal(false);
    
    // Reset form
    setDiscussionTitle("");
    setDiscussionContent("");
    
    toast.success("Discussion created successfully!");
  };

  const saveCourseDetails = async () => {
    if (!courseId) return;

    const updatedCourse = await updateCourse(courseId, {
      name: courseName,
      code: courseCode,
      instructor: courseInstructor,
    });
    if (!updatedCourse) {
      toast.error("Unable to update course details");
      return;
    }

    setLocalCourse(updatedCourse);
    toast.success("Course details updated");
    setShowEditCourseModal(false);
  };

  const availableStudents = students.filter(
    (student) => !enrolledStudents.some((enrolled) => enrolled.id === student.id)
  );

  const addStudentToCourse = async () => {
    if (!courseId) return;

    const student = availableStudents.find((item) => item.id === selectedStudentId);
    if (!student) {
      toast.error("Please select a student to add");
      return;
    }

    const updatedStudents = await addStudentToCourseRequest(courseId, selectedStudentId);
    setEnrolledStudents(updatedStudents);
    setLocalCourse((current) =>
      current ? { ...current, students: updatedStudents.length } : current
    );
    setSelectedStudentId("");
    setShowAddStudentModal(false);
    toast.success(`${student.name} added to the course`);
  };

  const removeStudentFromCourse = async (studentId: string) => {
    if (!courseId) return;

    const updatedStudents = await removeStudentFromCourseRequest(courseId, studentId);
    setEnrolledStudents(updatedStudents);
    setLocalCourse((current) =>
      current ? { ...current, students: updatedStudents.length } : current
    );
    toast.success("Student removed from the course");
  };

  const openEditAnnouncement = (announcementId: string) => {
    const announcement = localAnnouncements.find((item) => item.id === announcementId);
    if (!announcement) return;

    setSelectedAnnouncementId(announcementId);
    setAnnouncementTitle(announcement.title);
    setAnnouncementContent(announcement.content);
    setAnnouncementPinned(announcement.pinned);
    setShowEditAnnouncementModal(true);
  };

  const saveEditedAnnouncement = async () => {
    if (!selectedAnnouncementId) return;
    if (!courseId) return;

    const updatedAnnouncement = await updateAnnouncement(courseId, selectedAnnouncementId, {
      title: announcementTitle,
      content: announcementContent,
      pinned: announcementPinned,
    });
    if (!updatedAnnouncement) {
      toast.error("Unable to update the announcement");
      return;
    }

    setLocalAnnouncements((current) =>
      current.map((announcement) =>
        announcement.id === selectedAnnouncementId ? updatedAnnouncement : announcement
      )
    );
    toast.success("Announcement updated");
    setShowEditAnnouncementModal(false);
    setSelectedAnnouncementId(null);
  };

  const discussions = localDiscussions;

  const toggleDiscussionLike = async (discussionId: string) => {
    if (!courseId) return;
    const currentUserId = session?.user.id ?? "guest";
    const updatedDiscussion = await toggleDiscussionLikeRequest(
      courseId,
      discussionId,
      currentUserId
    );
    if (!updatedDiscussion) return;

    setLocalDiscussions((current) =>
      current.map((discussion) =>
        discussion.id === discussionId
          ? hydrateDiscussion(updatedDiscussion)
          : discussion
      )
    );
  };

  const openEditDiscussion = (discussionId: string) => {
    const discussion = discussions.find((item) => item.id === discussionId);
    if (!discussion) return;

    setEditingDiscussionId(discussionId);
    setEditingDiscussionContent(discussion.content);
  };

  const saveEditedDiscussion = async () => {
    if (!editingDiscussionId) return;
    if (!courseId) return;

    const updatedDiscussion = await updateDiscussion(courseId, editingDiscussionId, {
      content: editingDiscussionContent,
    });
    if (!updatedDiscussion) {
      toast.error("Unable to update the discussion");
      return;
    }

    setLocalDiscussions((current) =>
      current.map((discussion) =>
        discussion.id === editingDiscussionId
          ? hydrateDiscussion(updatedDiscussion)
          : discussion
      )
    );
    toast.success("Discussion updated");
    setEditingDiscussionId(null);
    setEditingDiscussionContent("");
  };

  const deleteDiscussion = async (discussionId: string) => {
    if (!courseId) return;

    const deleted = await deleteDiscussionRequest(courseId, discussionId);
    if (!deleted) {
      toast.error("Unable to delete the discussion");
      return;
    }

    setLocalDiscussions((current) => current.filter((discussion) => discussion.id !== discussionId));
    toast.success("Discussion deleted");
  };

  const addCommentToDiscussion = async (discussionId: string) => {
    const content = commentDrafts[discussionId]?.trim();
    if (!content) {
      toast.error("Please write a comment");
      return;
    }

    if (!courseId) return;

    const updatedDiscussion = await addDiscussionComment(courseId, discussionId, {
      authorId: session?.user.id ?? "guest",
      authorName: session?.user.nameEn ?? "Course member",
      authorRole: session?.user.role ?? "student",
      content,
    });
    if (!updatedDiscussion) {
      toast.error("Unable to add the comment");
      return;
    }

    setLocalDiscussions((current) =>
      current.map((discussion) =>
        discussion.id === discussionId
          ? hydrateDiscussion(updatedDiscussion)
          : discussion
      )
    );
    setCommentDrafts((current) => ({ ...current, [discussionId]: "" }));
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageBackButton
        to={isInstructorView ? "/instructor/courses" : "/courses"}
        label="Back to Courses"
      />

      {/* Course Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
          <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center", localCourse.color)}>
            <span className="text-white text-2xl font-bold">{courseCode.slice(0, 2)}</span>
          </div>
          <div>
            <Badge variant="outline" className="mb-2">{courseCode}</Badge>
            <h1 className="text-3xl font-bold text-gray-900">{courseName}</h1>
            <p className="text-gray-600">{courseInstructor}</p>
          </div>
        </div>
          {isInstructorView ? (
            <Button variant="outline" onClick={() => setShowEditCourseModal(true)}>
              Edit Course
            </Button>
          ) : null}
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
                    <div className="flex items-center gap-3">
                      <span>{new Date(announcement.timestamp).toLocaleString()}</span>
                      {isInstructorView ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditAnnouncement(announcement.id)}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </div>
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
            {discussions.map((discussion) => (
              <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={discussion.authorAvatar} />
                      <AvatarFallback>{discussion.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="mb-1 flex items-start justify-between gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">{discussion.title}</h3>
                        <div className="flex items-center gap-2">
                          {discussion.authorRole === "student" &&
                          discussion.authorId === session?.user.id ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDiscussion(discussion.id)}
                            >
                              Edit
                            </Button>
                          ) : null}
                          {session?.user.role === "instructor" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteDiscussion(discussion.id)}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{discussion.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{discussion.author}</span>
                        <span>•</span>
                        <span>{new Date(discussion.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <Button variant="ghost" size="sm" className="text-gray-600">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {discussion.comments.length} comments
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600"
                          onClick={() => toggleDiscussionLike(discussion.id)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {discussion.likes} likes
                        </Button>
                      </div>
                      <div className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4">
                        {discussion.comments.length === 0 ? (
                          <p className="text-sm text-gray-500">No comments yet.</p>
                        ) : (
                          discussion.comments.map((comment: DiscussionComment) => (
                            <div key={comment.id} className="rounded-lg bg-white p-3">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>
                                  {comment.authorName} · {comment.authorRole}
                                </span>
                                <span>{new Date(comment.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="mt-2 text-sm text-gray-700">{comment.content}</p>
                            </div>
                          ))
                        )}
                        <div className="flex gap-2">
                          <Textarea
                            value={commentDrafts[discussion.id] ?? ""}
                            onChange={(event) =>
                              setCommentDrafts((current) => ({
                                ...current,
                                [discussion.id]: event.target.value,
                              }))
                            }
                            placeholder="Write a comment..."
                            className="min-h-[80px]"
                          />
                          <Button onClick={() => addCommentToDiscussion(discussion.id)}>
                            Comment
                          </Button>
                        </div>
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">{enrolledStudents.length} students</span>
              </div>
              {isInstructorView ? (
                <Button onClick={() => setShowAddStudentModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              ) : null}
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
                  <p className="font-semibold text-gray-900">{courseInstructor}</p>
                  <p className="text-sm text-gray-600">instructor@university.edu</p>
                </div>
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
                {enrolledStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    {isInstructorView ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeStudentFromCourse(student.id)}
                      >
                        Remove
                      </Button>
                    ) : null}
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

      <Dialog open={showEditAnnouncementModal} onOpenChange={setShowEditAnnouncementModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the selected announcement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-announcement-title">Title</Label>
              <Input
                id="edit-announcement-title"
                value={announcementTitle}
                onChange={(event) => setAnnouncementTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-announcement-content">Content</Label>
              <Textarea
                id="edit-announcement-content"
                value={announcementContent}
                onChange={(event) => setAnnouncementContent(event.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex items-center justify-between space-y-0">
              <Label htmlFor="edit-announcement-pinned">Pin to top</Label>
              <Switch
                id="edit-announcement-pinned"
                checked={announcementPinned}
                onCheckedChange={(checked) => setAnnouncementPinned(checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAnnouncementModal(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveEditedAnnouncement}>
              Save Announcement
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

      <Dialog open={showEditCourseModal} onOpenChange={setShowEditCourseModal}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update this course for the instructor workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-course-name">Course name</Label>
              <Input
                id="edit-course-name"
                value={courseName}
                onChange={(event) => setCourseName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course-code">Course code</Label>
              <Input
                id="edit-course-code"
                value={courseCode}
                onChange={(event) => setCourseCode(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course-instructor">Instructor name</Label>
              <Input
                id="edit-course-instructor"
                value={courseInstructor}
                onChange={(event) => setCourseInstructor(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCourseModal(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveCourseDetails}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddStudentModal} onOpenChange={setShowAddStudentModal}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Add Student to Course</DialogTitle>
            <DialogDescription>
              Choose a student to enroll in this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {availableStudents.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                All available students are already in this course.
              </div>
            ) : (
              availableStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    selectedStudentId === student.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback>{student.name.split(" ").map((name) => name[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudentModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedStudentId}
              onClick={addStudentToCourse}
            >
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingDiscussionId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDiscussionId(null);
            setEditingDiscussionContent("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit Discussion</DialogTitle>
            <DialogDescription>
              Update your discussion message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-discussion-content">Content</Label>
            <Textarea
              id="edit-discussion-content"
              value={editingDiscussionContent}
              onChange={(event) => setEditingDiscussionContent(event.target.value)}
              className="min-h-[140px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingDiscussionId(null);
                setEditingDiscussionContent("");
              }}
            >
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveEditedDiscussion}>
              Save Discussion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
