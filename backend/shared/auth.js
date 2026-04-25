function isInstructorUsername(username) {
  const normalized = String(username).trim().toLowerCase();
  return (
    normalized.startsWith("emp") ||
    normalized.startsWith("teacher") ||
    normalized.startsWith("lec") ||
    normalized.includes("staff")
  );
}

export function createMockTuProfile(username) {
  if (isInstructorUsername(username)) {
    return {
      status: true,
      message: "Success",
      type: "employee",
      username,
      displayname_th: "อาจารย์ ทดสอบ",
      displayname_en: "Lecturer Demo",
      StatusWork: "1",
      StatusEmp: "ปกติ",
      email: `${username}@tu.ac.th`,
      department: "Computer Science",
      organization: "Thammasat University",
    };
  }

  return {
    status: true,
    message: "Success",
    type: "student",
    username,
    tu_status: "ปกติ",
    statusid: "10",
    displayname_th: "นักศึกษา ทดสอบ",
    displayname_en: "Student Demo",
    email: `${username}@dome.tu.ac.th`,
    department: "Computer Science",
    faculty: "Faculty of Science and Technology",
  };
}

export async function verifyWithTuApi({ username, password }) {
  if (!username || !password) {
    throw new Error("Username and password are required.");
  }

  const tuApiKey = process.env.TU_API_APPLICATION_KEY;
  const baseUrl = process.env.TU_API_BASE_URL;

  if (!tuApiKey || !baseUrl) {
    return createMockTuProfile(username);
  }

  const response = await fetch(`${baseUrl}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Application-Key": tuApiKey,
    },
    body: JSON.stringify({
      UserName: username,
      PassWord: password,
    }),
  });

  if (!response.ok) {
    throw new Error(`TU API request failed with status ${response.status}`);
  }

  const profile = await response.json();
  if (!profile?.status) {
    throw new Error(profile?.message ?? "TU authentication failed");
  }

  return profile;
}
