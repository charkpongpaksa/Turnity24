import { useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { PageBackButton } from "../components/PageBackButton";
import { cn } from "../components/ui/utils";
import { listNotifications } from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import { useAuth } from "@/features/auth/AuthProvider";

export function NotificationsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: notificationsData, loading } = useAsyncData(() => listNotifications(), []);
  const [readIds, setReadIds] = useState<string[]>([]);
  const notifications = notificationsData ?? [];
  const isInstructor = session?.user.role === "instructor";

  const mergedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        read: notification.read || readIds.includes(notification.id),
      })),
    [notifications, readIds]
  );

  const unreadCount = mergedNotifications.filter((notification) => !notification.read).length;

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6">
      <PageBackButton
        to={isInstructor ? "/instructor" : "/student"}
        label="Back to Dashboard"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          <p className="mt-1 text-gray-600">
            Review updates, reminders, and grading activity.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setReadIds(mergedNotifications.map((notification) => notification.id))}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-50 p-3 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unread notifications</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            Loading notifications...
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {mergedNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={cn(
              "cursor-pointer transition-shadow hover:shadow-md",
              !notification.read && "border-blue-200 bg-blue-50/40"
            )}
            onClick={() => {
              setReadIds((current) =>
                current.includes(notification.id) ? current : [...current, notification.id]
              );
              navigate(notification.link);
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{notification.title}</CardTitle>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.read ? <Badge>Unread</Badge> : null}
                  {notification.urgent ? <Badge variant="destructive">Urgent</Badge> : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(notification.timestamp).toLocaleString()}</span>
              <span className="uppercase tracking-wide">{notification.type}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
