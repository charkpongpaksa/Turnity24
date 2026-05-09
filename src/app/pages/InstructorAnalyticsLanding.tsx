import { useEffect } from "react";
import { useNavigate } from "react-router";
import { listCourses } from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";

export function InstructorAnalyticsLanding() {
  const navigate = useNavigate();
  const { data: courses, loading } = useAsyncData(() => listCourses(), []);

  useEffect(() => {
    if (loading) return;

    if (courses && courses.length > 0) {
      navigate(`/instructor/course/${courses[0].id}/analytics`, { replace: true });
      return;
    }

    navigate("/instructor/courses", { replace: true });
  }, [courses, loading, navigate]);

  return <div className="p-6">Loading analytics...</div>;
}
