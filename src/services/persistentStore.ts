import type { Youth } from "@/data/mockData";
import type { AttendanceRecord } from "@/data/attendanceRecords";
import { STORAGE_KEYS } from "@/data/attendanceRecords";
import { isSupabaseConfigured, supabaseRequest } from "@/lib/supabaseRest";

interface YouthRow {
  id: string;
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

async function replaceDeletedRows(table: string, nextIds: string[]) {
  const existing = await supabaseRequest<Array<{ id: string }>>(`${table}?select=id`);
  const removed = existing.map((row) => row.id).filter((id) => !nextIds.includes(id));

  await Promise.all(
    removed.map((id) => supabaseRequest(`${table}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }))
  );
}

async function loadYouths(fallback: Youth[]): Promise<Youth[]> {
  const rows = await supabaseRequest<YouthRow[]>("youths?select=*&order=created_at.desc");
  if (rows.length > 0) return rows.map(toYouth);

  if (fallback.length > 0) {
    await syncYouths(fallback);
    return fallback;
  }

  return [];
}

async function syncYouths(youths: Youth[]) {
  if (youths.length > 0) {
    await supabaseRequest("youths?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(youths.map(fromYouth)),
    });
  }
  await replaceDeletedRows(
    "youths",
    youths.map((youth) => youth.id)
  );
}

async function loadAttendance(fallback: AttendanceRecord[]): Promise<AttendanceRecord[]> {
  const rows = await supabaseRequest<AttendanceRow[]>("attendance_records?select=*&order=recorded_at.desc");
  if (rows.length > 0) return rows.map(toAttendance);

  if (fallback.length > 0) {
    await syncAttendance(fallback);
    return fallback;
  }

  return [];
}

async function syncAttendance(records: AttendanceRecord[]) {
  if (records.length > 0) {
    await supabaseRequest("attendance_records?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(records.map(fromAttendance)),
    });
  }
  await replaceDeletedRows(
    "attendance_records",
    records.map((record) => record.id)
  );
}

export async function loadPersistentValue<T>(key: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured) return fallback;

  if (key === STORAGE_KEYS.YOUTHS) {
    return (await loadYouths(fallback as Youth[])) as T;
  }

  if (key === STORAGE_KEYS.ATTENDANCE_RECORDS) {
    return (await loadAttendance(fallback as AttendanceRecord[])) as T;
  }

  return fallback;
}

export async function syncPersistentValue<T>(key: string, value: T) {
  if (!isSupabaseConfigured) return;

  if (key === STORAGE_KEYS.YOUTHS) {
    await syncYouths(value as Youth[]);
  }

  if (key === STORAGE_KEYS.ATTENDANCE_RECORDS) {
    await syncAttendance(value as AttendanceRecord[]);
  }
}
