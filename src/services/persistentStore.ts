import type { Program, Youth } from "@/data/mockData";
import type { AttendanceRecord } from "@/data/attendanceRecords";
import { STORAGE_KEYS } from "@/data/attendanceRecords";
import { getActiveChurchId, isSupabaseConfigured, supabaseRequest } from "@/lib/supabaseRest";

interface YouthRow {
  id: string;
  church_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: Youth["gender"];
  address: string;
  education_status: Youth["educationStatus"];
  occupation?: string | null;
  join_date: string;
  status: Youth["status"];
  engagement_score: number;
  engagement_status: Youth["engagementStatus"];
  small_group?: string | null;
  mentor?: string | null;
  leadership_level: Youth["leadershipLevel"];
  discipleship_status: Youth["discipleshipStatus"];
  attendance_rate: number;
  last_attendance?: string | null;
  notes?: string | null;
  ministry_areas: string[];
  age_group: Youth["ageGroup"];
}

interface AttendanceRow {
  id: string;
  church_id: string;
  youth_id: string;
  youth_name: string;
  program_id: string;
  program_name: string;
  date: string;
  attendance_status: AttendanceRecord["attendanceStatus"];
  engagement_level: AttendanceRecord["engagementLevel"];
  participated_in_activity: boolean;
  activity_notes?: string | null;
  follow_up_notes?: string | null;
  recorded_at: string;
}

interface ProgramRow {
  id: string;
  church_id: string;
  name: string;
  description: string;
  category: Program["category"];
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  participant_count: number;
  max_capacity?: number | null;
  leader: string;
  schedule: string;
  schedule_type: Program["scheduleType"];
  average_attendance: number;
  engagement_score: number;
  member_breakdown: Program["memberBreakdown"];
}

function requireActiveChurchId() {
  const churchId = getActiveChurchId();
  if (!churchId) {
    throw new Error("No active church selected for this account.");
  }
  return churchId;
}

function toYouth(row: YouthRow): Youth {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    address: row.address,
    educationStatus: row.education_status,
    occupation: row.occupation ?? undefined,
    joinDate: row.join_date,
    status: row.status,
    engagementScore: row.engagement_score,
    engagementStatus: row.engagement_status,
    smallGroup: row.small_group ?? undefined,
    mentor: row.mentor ?? undefined,
    leadershipLevel: row.leadership_level,
    discipleshipStatus: row.discipleship_status,
    attendanceRate: row.attendance_rate,
    lastAttendance: row.last_attendance ?? undefined,
    notes: row.notes ?? undefined,
    ministryAreas: row.ministry_areas ?? [],
    ageGroup: row.age_group,
  };
}

function fromYouth(youth: Youth): YouthRow {
  return {
    id: youth.id,
    church_id: requireActiveChurchId(),
    first_name: youth.firstName,
    last_name: youth.lastName,
    email: youth.email,
    phone: youth.phone,
    date_of_birth: youth.dateOfBirth,
    gender: youth.gender,
    address: youth.address,
    education_status: youth.educationStatus,
    occupation: youth.occupation ?? null,
    join_date: youth.joinDate,
    status: youth.status,
    engagement_score: youth.engagementScore,
    engagement_status: youth.engagementStatus,
    small_group: youth.smallGroup ?? null,
    mentor: youth.mentor ?? null,
    leadership_level: youth.leadershipLevel,
    discipleship_status: youth.discipleshipStatus,
    attendance_rate: youth.attendanceRate,
    last_attendance: youth.lastAttendance ?? null,
    notes: youth.notes ?? null,
    ministry_areas: youth.ministryAreas ?? [],
    age_group: youth.ageGroup,
  };
}

function toAttendance(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    youthId: row.youth_id,
    youthName: row.youth_name,
    programId: row.program_id,
    programName: row.program_name,
    date: row.date,
    attendanceStatus: row.attendance_status,
    engagementLevel: row.engagement_level,
    participatedInActivity: row.participated_in_activity,
    activityNotes: row.activity_notes ?? undefined,
    followUpNotes: row.follow_up_notes ?? undefined,
    recordedAt: row.recorded_at,
  };
}

function fromAttendance(record: AttendanceRecord): AttendanceRow {
  return {
    id: record.id,
    church_id: requireActiveChurchId(),
    youth_id: record.youthId,
    youth_name: record.youthName,
    program_id: record.programId,
    program_name: record.programName,
    date: record.date,
    attendance_status: record.attendanceStatus,
    engagement_level: record.engagementLevel,
    participated_in_activity: record.participatedInActivity,
    activity_notes: record.activityNotes ?? null,
    follow_up_notes: record.followUpNotes ?? null,
    recorded_at: record.recordedAt,
  };
}

function toProgram(row: ProgramRow): Program {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    isActive: row.is_active,
    participantCount: row.participant_count,
    maxCapacity: row.max_capacity ?? undefined,
    leader: row.leader,
    schedule: row.schedule,
    scheduleType: row.schedule_type,
    averageAttendance: row.average_attendance,
    engagementScore: row.engagement_score,
    memberBreakdown: row.member_breakdown ?? { students: 0, employed: 0, unemployed: 0 },
  };
}

function fromProgram(program: Program): ProgramRow {
  return {
    id: program.id,
    church_id: requireActiveChurchId(),
    name: program.name,
    description: program.description,
    category: program.category,
    start_date: program.startDate,
    end_date: program.endDate ?? null,
    is_active: program.isActive,
    participant_count: program.participantCount,
    max_capacity: program.maxCapacity ?? null,
    leader: program.leader,
    schedule: program.schedule,
    schedule_type: program.scheduleType,
    average_attendance: program.averageAttendance,
    engagement_score: program.engagementScore,
    member_breakdown: program.memberBreakdown,
  };
}

async function replaceDeletedRows(table: string, nextIds: string[]) {
  const churchId = requireActiveChurchId();
  const existing = await supabaseRequest<Array<{ id: string }>>(
    `${table}?select=id&church_id=eq.${encodeURIComponent(churchId)}`
  );
  const removed = existing.map((row) => row.id).filter((id) => !nextIds.includes(id));

  await Promise.all(
    removed.map((id) => supabaseRequest(`${table}?id=eq.${encodeURIComponent(id)}&church_id=eq.${encodeURIComponent(churchId)}`, { method: "DELETE" }))
  );
}

async function loadYouths(): Promise<Youth[]> {
  const churchId = requireActiveChurchId();
  const rows = await supabaseRequest<YouthRow[]>(
    `youths?select=*&church_id=eq.${encodeURIComponent(churchId)}&order=created_at.desc`
  );
  return rows.map(toYouth);
}

async function syncYouths(youths: Youth[]) {
  // Never sync an empty array — it could wipe all tenant data during
  // an initial render before Supabase has hydrated the local state.
  if (youths.length === 0) return;

  await supabaseRequest("youths?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(youths.map(fromYouth)),
  });
  await replaceDeletedRows(
    "youths",
    youths.map((youth) => youth.id)
  );
}

async function loadAttendance(): Promise<AttendanceRecord[]> {
  const churchId = requireActiveChurchId();
  const rows = await supabaseRequest<AttendanceRow[]>(
    `attendance_records?select=*&church_id=eq.${encodeURIComponent(churchId)}&order=recorded_at.desc`
  );
  return rows.map(toAttendance);
}

async function syncAttendance(records: AttendanceRecord[]) {
  if (records.length === 0) return;

  await supabaseRequest("attendance_records?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(records.map(fromAttendance)),
  });
  await replaceDeletedRows(
    "attendance_records",
    records.map((record) => record.id)
  );
}

async function loadPrograms(): Promise<Program[]> {
  const churchId = requireActiveChurchId();
  const rows = await supabaseRequest<ProgramRow[]>(
    `programs?select=*&church_id=eq.${encodeURIComponent(churchId)}&order=created_at.desc`
  );
  return rows.map(toProgram);
}

async function syncPrograms(programs: Program[]) {
  if (programs.length === 0) return;

  await supabaseRequest("programs?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(programs.map(fromProgram)),
  });
  await replaceDeletedRows(
    "programs",
    programs.map((program) => program.id)
  );
}

export async function loadPersistentValue<T>(key: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured || !getActiveChurchId()) return fallback;

  if (key === STORAGE_KEYS.YOUTHS) {
    return (await loadYouths()) as T;
  }

  if (key === STORAGE_KEYS.ATTENDANCE_RECORDS) {
    return (await loadAttendance()) as T;
  }

  if (key === STORAGE_KEYS.PROGRAMS) {
    return (await loadPrograms()) as T;
  }

  return fallback;
}

export async function syncPersistentValue<T>(key: string, value: T) {
  if (!isSupabaseConfigured || !getActiveChurchId()) return;

  if (key === STORAGE_KEYS.YOUTHS) {
    await syncYouths(value as Youth[]);
  }

  if (key === STORAGE_KEYS.ATTENDANCE_RECORDS) {
    await syncAttendance(value as AttendanceRecord[]);
  }

  if (key === STORAGE_KEYS.PROGRAMS) {
    await syncPrograms(value as Program[]);
  }
}
