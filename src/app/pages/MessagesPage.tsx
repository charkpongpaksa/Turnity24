import { useState } from "react";
import { useLocation } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Send, Search, MessageSquare } from "lucide-react";
import { mockCourses } from "../data/mockData";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isInstructor: boolean;
}

export function MessagesPage() {
  const location = useLocation();
  const isInstructorView = location.pathname.includes("/instructor");
  
  const [selectedCourse, setSelectedCourse] = useState<string>(mockCourses[0].id);
  const [messageText, setMessageText] = useState("");
  
  // Mock messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "instructor-1",
      senderName: "Dr. Sarah Johnson",
      senderAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
      content: "Hello! Welcome to the course. Feel free to ask any questions about the assignments.",
      timestamp: new Date(Date.now() - 3600000 * 24),
      isInstructor: true,
    },
    {
      id: "2",
      senderId: "student-1",
      senderName: "John Doe",
      senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      content: "Thank you! I have a question about the React assignment deadline.",
      timestamp: new Date(Date.now() - 3600000 * 20),
      isInstructor: false,
    },
    {
      id: "3",
      senderId: "instructor-1",
      senderName: "Dr. Sarah Johnson",
      senderAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
      content: "The deadline is next Friday at 11:59 PM. You can submit your work anytime before that. Let me know if you need any clarification on the requirements.",
      timestamp: new Date(Date.now() - 3600000 * 19),
      isInstructor: true,
    },
  ]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: isInstructorView ? "instructor-1" : "student-1",
      senderName: isInstructorView ? "Dr. Sarah Johnson" : "John Doe",
      senderAvatar: isInstructorView 
        ? "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop"
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      content: messageText,
      timestamp: new Date(),
      isInstructor: isInstructorView,
    };

    setMessages([...messages, newMessage]);
    setMessageText("");
  };

  const selectedCourseData = mockCourses.find(c => c.id === selectedCourse);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages 💬</h1>
        <p className="text-gray-600 mt-1">
          {isInstructorView 
            ? "Communicate with your students" 
            : "Message your instructors"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Course List Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Courses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {mockCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course.id)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedCourse === course.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${course.color}`}>
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {course.code}
                        </p>
                        <p className="text-xs text-gray-600 truncate">{course.instructor}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-200px)] flex flex-col">
            {/* Header */}
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedCourseData?.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {isInstructorView 
                      ? `${selectedCourseData?.students} students` 
                      : selectedCourseData?.instructor}
                  </p>
                </div>
                <Badge variant="outline">{selectedCourseData?.code}</Badge>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => {
                const isOwnMessage = isInstructorView ? message.isInstructor : !message.isInstructor;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={message.senderAvatar} />
                      <AvatarFallback>
                        {message.senderName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm font-medium ${isOwnMessage ? "text-right" : "text-left"}`}>
                          {message.senderName}
                        </p>
                        {message.isInstructor && (
                          <Badge className="bg-blue-600 text-xs">Instructor</Badge>
                        )}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-3 max-w-[70%] ${
                          isOwnMessage
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Textarea
                  placeholder={isInstructorView 
                    ? "Type your message to students..." 
                    : "Type your message to instructor..."}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 h-auto px-6"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
