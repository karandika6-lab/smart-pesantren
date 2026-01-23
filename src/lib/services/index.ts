// Services Index - Export all services
// Smart Pesantren API Layer

// Core Services
export { studentsService } from './students';
export type { StudentWithRelations, StudentFilters } from './students';

export { teachersService } from './teachers';
export type { TeacherWithProfile, TeacherFilters } from './teachers';

export { classesService } from './classes';
export type { ClassWithRelations } from './classes';

export { usersService } from './users';
export type { UserWithDetails, UserFilters } from './users';

// Academic Services
export { subjectsService, schedulesService, academicYearService } from './academic';
export type { ScheduleWithRelations } from './academic';

export { gradesService } from './grades';
export type { GradeWithRelations, GradeFilters } from './grades';

export { hafalanService } from './hafalan';

export { hafalanTypesService } from './hafalan-types';
export type { HafalanType } from './hafalan-types';

// Attendance Services
export { attendanceService } from './attendance';

// Finance Services
export {
    financeService
} from './finance';

// Kesantrian Services
export { kesantrianService } from './kesantrian';
export { dormitoriesService } from './dormitories';
export type { DormitoryWithRelations } from './dormitories';
export { violationsService } from './violations';
export type { ViolationWithRelations } from './violations';
export { permissionsService } from './permissions';
export type { PermissionWithRelations } from './permissions';
export { settingsService } from './settings';
export { systemService } from './system';
