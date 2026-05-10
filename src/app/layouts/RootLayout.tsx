import { Link, Outlet, useNavigate, useLocation } from "react-router";
import { 
  Home, 
  BookOpen, 
  Bell, 
  Search, 
  GraduationCap,
  Menu,
  X,
  FileText,
  User,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Card, CardContent } from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "../components/ui/utils";
import { listAssignments, listCourses, listNotifications } from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import { useAuth } from "@/features/auth/AuthProvider";
import { toast } from "sonner";

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const { session, logout, currentRole, canSwitchViews, switchActiveRole } = useAuth();
  const { data: notificationsData } = useAsyncData(() => listNotifications(), []);
  const { data: coursesData } = useAsyncData(() => listCourses(), []);
  const { data: assignmentsData } = useAsyncData(() => listAssignments(), []);
  const notifications = notificationsData ?? [];
  const courses = coursesData ?? [];
  const assignments = assignmentsData ?? [];
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const isInstructorView = currentRole === "instructor";

  const studentNavItems = [
    { icon: Home, label: "Dashboard", path: "/student", key: "student-dashboard" },
    { icon: BookOpen, label: "My Courses", path: "/courses", key: "student-courses" },
  ];

  const instructorNavItems = [
    { icon: Home, label: "Dashboard", path: "/instructor", key: "instructor-dashboard" },
    { icon: BookOpen, label: "My Courses", path: "/instructor/courses", key: "instructor-courses" },
    { icon: BarChart3, label: "Analytics", path: "/instructor/analytics", key: "instructor-analytics" },
  ];

  const navItems = isInstructorView ? instructorNavItems : studentNavItems;
  const trimmedSearchQuery = searchQuery.trim();

  const searchSuggestions = useMemo(() => {
    if (!trimmedSearchQuery) {
      return [];
    }

    const query = trimmedSearchQuery.toLowerCase();

    const courseSuggestions = courses
      .filter(
        (course) =>
          course.name.toLowerCase().includes(query) ||
          course.code.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query)
      )
      .slice(0, 4)
      .map((course) => ({
        id: `course-${course.id}`,
        type: "course" as const,
        title: course.code,
        subtitle: course.name,
        path: isInstructorView ? `/instructor/course/${course.id}` : `/course/${course.id}`,
      }));

    const assignmentSuggestions = assignments
      .filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(query) ||
          assignment.description.toLowerCase().includes(query)
      )
      .slice(0, 4)
      .map((assignment) => ({
        id: `assignment-${assignment.id}`,
        type: "assignment" as const,
        title: assignment.title,
        subtitle:
          courses.find((course) => course.id === assignment.courseId)?.code ?? "Assignment",
        path: isInstructorView
          ? `/instructor/course/${assignment.courseId}/assignment/${assignment.id}`
          : `/course/${assignment.courseId}/assignment/${assignment.id}`,
      }));

    return [...courseSuggestions, ...assignmentSuggestions].slice(0, 6);
  }, [assignments, courses, isInstructorView, trimmedSearchQuery]);

  useEffect(() => {
    setShowSearchSuggestions(false);
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
      setSidebarOpen(false);
      navigate("/login", { replace: true });
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = trimmedSearchQuery;
    setShowSearchSuggestions(false);
    navigate(
      trimmedQuery
        ? `${isInstructorView ? "/instructor/search" : "/search"}?q=${encodeURIComponent(trimmedQuery)}`
        : isInstructorView
          ? "/instructor/search"
          : "/search"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => navigate(isInstructorView ? "/instructor" : "/student")}
            >
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <h1 className="font-bold text-lg text-gray-900">24/7</h1>
                <p className="text-xs text-gray-500 -mt-1">Turnityforservice</p>
              </div>
            </button>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form className="relative w-full" onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search courses, assignments..." 
                className="pl-10 bg-gray-50"
                value={searchQuery}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSearchQuery(nextValue);
                  setShowSearchSuggestions(Boolean(nextValue.trim()));
                }}
                onFocus={() => {
                  if (trimmedSearchQuery) {
                    setShowSearchSuggestions(true);
                  }
                }}
                onBlur={() => {
                  window.setTimeout(() => setShowSearchSuggestions(false), 120);
                }}
              />
              {showSearchSuggestions && searchSuggestions.length > 0 ? (
                <Card className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 border shadow-lg">
                  <CardContent className="p-2">
                    <div className="mb-2 px-2 pt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Suggestions
                    </div>
                    <div className="space-y-1">
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setShowSearchSuggestions(false);
                            setSearchQuery(suggestion.title);
                            navigate(suggestion.path);
                          }}
                        >
                          <div className="mt-0.5 text-gray-500">
                            {suggestion.type === "course" ? (
                              <BookOpen className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {suggestion.title}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {suggestion.subtitle}
                            </p>
                          </div>
                        </button>
                      ))}
                      <button
                        type="submit"
                        className="w-full rounded-lg border-t px-3 py-2 text-left text-sm text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        Search for "{trimmedSearchQuery}"
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </form>
          </div>

          <div className="flex items-center gap-3">
            {canSwitchViews ? (
              <div className="hidden md:flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                <Button
                  variant={currentRole === "instructor" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    switchActiveRole("instructor");
                    navigate("/instructor");
                  }}
                >
                  Instructor View
                </Button>
                <Button
                  variant={currentRole === "student" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    switchActiveRole("student");
                    navigate("/student");
                  }}
                >
                  Student View
                </Button>
              </div>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() =>
                navigate(isInstructorView ? "/instructor/notifications" : "/notifications")
              }
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  className="pointer-events-none absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs bg-red-500"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {session?.user.nameEn
                        .split(" ")
                        .filter(Boolean)
                        .map((name) => name[0])
                        .join("")
                        .slice(0, 2) ?? "TU"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">
                    {session?.user.nameEn ?? "TU User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{session?.user.email}</DropdownMenuItem>
                <DropdownMenuItem>{session?.user.role}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isLoggingOut}
                  onClick={() => setLogoutDialogOpen(true)}
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r border-gray-200 w-64 fixed lg:sticky top-[57px] h-[calc(100vh-57px)] z-40 transition-transform lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  asChild
                  key={item.key}
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                >
                  <Link to={item.path} onClick={() => setSidebarOpen(false)}>
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full"
              disabled={isLoggingOut}
              onClick={() => setLogoutDialogOpen(true)}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <Outlet />
        </main>
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of Turnity? You will need to sign in again with your TU account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoggingOut}
              onClick={async (event) => {
                event.preventDefault();
                await handleLogout();
                setLogoutDialogOpen(false);
              }}
            >
              {isLoggingOut ? "Logging out..." : "Yes, log out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
