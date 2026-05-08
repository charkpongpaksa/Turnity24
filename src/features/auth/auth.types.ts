export type AppRole = "student" | "instructor";

export type TuApiAccountType = "student" | "employee";

export type TuStudentProfile = {
  status: boolean;
  message: string;
  type: "student";
  username: string;
  tu_status: string;
  statusid: string;
  displayname_th: string;
  displayname_en: string;
  email: string;
  department: string;
  faculty: string;
};

export type TuEmployeeProfile = {
  status: boolean;
  message: string;
  type: "employee";
  username: string;
  displayname_th: string;
  displayname_en: string;
  StatusWork: string;
  StatusEmp: string;
  email: string;
  department: string;
  organization: string;
};

export type TuApiProfile = TuStudentProfile | TuEmployeeProfile;

export type LoginFormInput = {
  username: string;
  password: string;
};

export type AuthUser = {
  id: string;
  username: string;
  nameTh: string;
  nameEn: string;
  email: string;
  role: AppRole;
  tuType: TuApiAccountType;
  department: string;
  facultyOrOrganization: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  user: AuthUser;
  activeRole: AppRole;
};
