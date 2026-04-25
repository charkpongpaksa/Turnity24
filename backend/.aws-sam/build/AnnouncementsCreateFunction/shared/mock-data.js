const nowDate = new Date().toISOString().slice(0, 10);

export const mockCourses = [
  {
    id: "1",
    name: "Advanced Web Development",
    code: "CS401",
    instructor: "Dr. Sarah Johnson",
    progress: 75,
    color: "bg-blue-500",
    students: 4,
    nextDeadline: nowDate,
  },
  {
    id: "2",
    name: "Data Structures & Algorithms",
    code: "CS301",
    instructor: "Prof. Michael Chen",
    progress: 60,
    color: "bg-purple-500",
    students: 4,
    nextDeadline: nowDate,
  },
];

export const mockStudents = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice.j@university.edu",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob.smith@university.edu",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
  },
  {
    id: "3",
    name: "Carol Williams",
    email: "carol.w@university.edu",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
  {
    id: "4",
    name: "David Brown",
    email: "david.b@university.edu",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  },
];

export const mockCourseStudents = {
  "1": ["1", "2", "3", "4"],
  "2": ["2", "3", "4"],
};
