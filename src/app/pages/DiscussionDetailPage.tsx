import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { MessageSquare, ThumbsUp, Trash2, Calendar, User } from "lucide-react";
import { PageBackButton } from "../components/PageBackButton";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";
import { getDiscussionDetail, addDiscussionComment, toggleDiscussionLike, deleteDiscussion } from "@/lib/data/repository";
import { Discussion, DiscussionComment } from "@/lib/types/models";

export function DiscussionDetailPage() {
  const { courseId, discussionId } = useParams();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadDiscussion() {
      if (!courseId || !discussionId) return;
      try {
        const data = await getDiscussionDetail(courseId, discussionId);
        setDiscussion(data);
      } catch (error) {
        toast.error("Failed to load discussion");
      } finally {
        setLoading(false);
      }
    }
    loadDiscussion();
  }, [courseId, discussionId]);

  const handleToggleLike = async () => {
    if (!courseId || !discussionId || !session) return;
    try {
      const updated = await toggleDiscussionLike(courseId, discussionId, session.user.id);
      setDiscussion(updated);
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !courseId || !discussionId || !session) return;
    setSubmitting(true);
    try {
      const updated = await addDiscussionComment(courseId, discussionId, {
        authorId: session.user.id,
        authorName: session.user.nameEn,
        authorRole: session.activeRole,
        content: commentText
      });
      setDiscussion(updated);
      setCommentText("");
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading discussion...</div>;
  if (!discussion) return <div className="p-6">Discussion not found</div>;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <PageBackButton 
        to={session?.activeRole === "instructor" ? `/instructor/course/${courseId}` : `/course/${courseId}`} 
        label="Back to Classroom" 
      />
      
      <Card className="mb-8 overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border-2 border-white">
              <AvatarImage src={discussion.authorAvatar} />
              <AvatarFallback>{discussion.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{discussion.title}</h1>
                <Badge variant={discussion.authorRole === "instructor" ? "default" : "secondary"}>
                  {discussion.authorRole}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {discussion.author}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(discussion.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{discussion.content}</p>
          
          <div className="flex items-center gap-4 mt-8 pt-6 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToggleLike}
              className={discussion.likedBy?.includes(session?.user.id || "") ? "text-blue-600 bg-blue-50 border-blue-200" : ""}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              {discussion.likes || 0} Likes
            </Button>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <MessageSquare className="h-4 w-4" />
              {discussion.comments?.length || 0} Comments
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Comments
        </h2>

        {/* Comment Form */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <Textarea 
              placeholder="What are your thoughts?" 
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="min-h-[100px] border-none shadow-none focus-visible:ring-0 resize-none px-0"
            />
            <div className="flex justify-end border-t pt-3">
              <Button 
                onClick={handleAddComment} 
                disabled={submitting || !commentText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comment List */}
        <div className="space-y-4">
          {(discussion.comments || []).map((comment: DiscussionComment) => (
            <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{comment.authorName}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 uppercase">{comment.authorRole}</Badge>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
          {(!discussion.comments || discussion.comments.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-10" />
              <p>No comments yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
