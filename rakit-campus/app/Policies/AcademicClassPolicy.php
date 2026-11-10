<?php

namespace App\Policies;

use App\Models\AcademicClass;
use App\Models\User;

class AcademicClassPolicy
{
    /**
     * Hanya dosen dengan keanggotaan kampus aktif yang boleh membuka kelas.
     */
    public function create(User $user): bool
    {
        $campusId = $user->campusId();

        return $campusId !== null && $user->isLecturer($campusId);
    }

    public function view(User $user, AcademicClass $academicClass): bool
    {
        if ($user->isPlatformAdmin() || $user->isCampusAdminOf($academicClass->campus_id)) {
            return true;
        }

        if ($this->teaches($user, $academicClass)) {
            return true;
        }

        return $academicClass->hasStudent($user) && $user->isStudent($academicClass->campus_id);
    }

    /**
     * Mengelola peserta, bimbingan, dan alokasi hanya untuk dosen pengampu kelas ini.
     */
    public function manage(User $user, AcademicClass $academicClass): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        return $this->teaches($user, $academicClass);
    }

    public function teaches(User $user, AcademicClass $academicClass): bool
    {
        return $academicClass->isLecturer($user) && $user->isLecturer($academicClass->campus_id);
    }
}
