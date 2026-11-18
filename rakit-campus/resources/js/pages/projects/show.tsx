import AppLayout from '@/layouts/app-layout';
import SeoHead from '@/components/seo/SeoHead';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    Archive,
    ArrowLeft,
    ArrowRight,
    Award,
    Bookmark,
    Briefcase,
    Check,
    CheckCircle2,
    Clock,
    Compass,
    Download,
    Edit3,
    ExternalLink,
    FileText,
    FolderKanban,
    GitBranch,
    GraduationCap,
    HelpCircle,
    Inbox,
    Info,
    Layers,
    Lock,
    Bell,
    MessageSquare,
    PieChart,
    Plus,
    Send,
    Settings,
    ShieldCheck,
    Sparkles,
    Target,
    Trash2,
    Upload,
    UserCheck,
    UserMinus,
    UserPlus,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import SemesterTimeline from './components/SemesterTimeline';
import ProjectRoadmapTimeline from './components/ProjectRoadmapTimeline';
import LivingProposalTab from './components/LivingProposalTab';
import ProposalVersionsTab from './components/ProposalVersionsTab';
import TasksKanbanTab from './components/TasksKanbanTab';
import AssessmentTab from './components/AssessmentTab';
import RequirementsTab from './components/RequirementsTab';
import MatchmakingTab from './components/MatchmakingTab';
import TeamBalanceTab from './components/TeamBalanceTab';
import InvitationsTab from './components/InvitationsTab';
import TeamFormationTab from './components/TeamFormationTab';
import DiscussionForum from './components/DiscussionForum';
import ProjectJigsawBoard from '@/components/project-jigsaw-board';

interface Props {
    project: any;
    isBookmarked: boolean;
    isLeader: boolean;
    isLecturer?: boolean;
    isLecturerAccount?: boolean;
    isMember: boolean;
    userHasActiveProject?: boolean;
    myApplication?: any;
    eligibility?: { eligible: boolean; reason: string | null };
    canEdit: boolean;
    applications?: any[];
    livingProposal?: any;
    assessmentPeriods?: any[];
    submissions?: any[];
    kanban?: {
        todo: any[];
        in_progress: any[];
        in_review: any[];
        completed: any[];
    };
    milestones?: any[];
    activities?: any[];
    discussions?: any[];
    guidances?: any[];
    implementationProgress?: number;
    achievements?: any[];
    teamBalance?: any;
    teamOptimization?: any;
    sameClassCandidates?: any[];
    classStudents?: any[];
    sentInvitations?: any[];
    receivedInvitations?: any[];
    canAccessWorkspace?: boolean;
}

export default function ProjectShow({
    project,
    isBookmarked: initialBookmarked,
    isLeader,
    isLecturer = false,
    isLecturerAccount = false,
    isMember,
    userHasActiveProject = false,
    myApplication = null,
    eligibility = { eligible: false, reason: null },
    canEdit,
    applications: initialApplications = [],
    livingProposal,
    assessmentPeriods = [],
    submissions = [],
    kanban = { todo: [], in_progress: [], in_review: [], completed: [] },
    milestones = [],
    activities = [],
    discussions = [],
    guidances = [],
    implementationProgress = 0,
    achievements = [],
    teamBalance,
    teamOptimization,
    sameClassCandidates = [],
    classStudents = [],
    sentInvitations = [],
    receivedInvitations = [],
    canAccessWorkspace = false,
}: Props) {
    const page = usePage<any>();
    const user = page.props?.auth?.user;
    const isLecturerUser = Boolean(
        isLecturer ||
        isLecturerAccount ||
        user?.is_lecturer ||
        user?.role === 'lecturer' ||
        user?.campus?.role === 'lecturer'
    );
    const flash = page.props?.flash;
    const academicClass = project.academic_class || project.academicClass;
    const isAcademic = Boolean(project.academic_class_id || academicClass?.id || project.category === 'academic');
    const academicOnlyTabs = ['uts', 'uas', 'lecturer_review'];
    const initialTabParam = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('tab')
        : null;
    const safeInitialTab = (!isAcademic && academicOnlyTabs.includes(initialTabParam || ''))
        ? 'overview'
        : (initialTabParam || 'overview');
    const [activeTab, setActiveTab] = useState<string>(safeInitialTab);
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [applications, setApplications] = useState(initialApplications);

    useEffect(() => {
        setApplications(initialApplications);
    }, [initialApplications]);

    useEffect(() => {
        if (!isAcademic && academicOnlyTabs.includes(activeTab)) {
            setActiveTab('overview');
        }
    }, [isAcademic, activeTab]);
    const [applyingRole, setApplyingRole] = useState<any>(null);
    const [applyMessage, setApplyMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [decidingId, setDecidingId] = useState<number | null>(null);
    const [lifecycleProcessing, setLifecycleProcessing] = useState(false);
    const [togglingRecruitment, setTogglingRecruitment] = useState(false);
    const [showGuidanceModal, setShowGuidanceModal] = useState(false);
    const [guidanceTitle, setGuidanceTitle] = useState('');
    const [guidanceContent, setGuidanceContent] = useState('');
    const [guidanceType, setGuidanceType] = useState<'guidance' | 'announcement' | 'milestone_feedback'>('guidance');
    const [submittingGuidance, setSubmittingGuidance] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
        if (window.location.hash) {
            const targetId = window.location.hash.slice(1);
            window.setTimeout(() => {
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 140);
        }
    }, [page.url, project.id]);

    // Filter UTS and UAS assessment periods and submissions
    const utsPeriod = assessmentPeriods.find((p: any) => p.type === 'uts') || assessmentPeriods[0];
    const uasPeriod = assessmentPeriods.find((p: any) => p.type === 'uas') || assessmentPeriods[1];
    const utsSubmission = submissions.find((s: any) => s.assessment_period_id === utsPeriod?.id || s.assessmentPeriod?.type === 'uts');
    const uasSubmission = submissions.find((s: any) => s.assessment_period_id === uasPeriod?.id || s.assessmentPeriod?.type === 'uas');

    const proposalVersion = livingProposal?.latest_version_number || 1;
    const proposalStatus = livingProposal?.current_version?.status || livingProposal?.status || 'draft';

    const overallStatusLabel =
        project.status === 'completed' ? 'Selesai (Completed)' :
        uasSubmission?.status === 'accepted' ? 'Lulus UAS' :
        uasSubmission ? 'Evaluasi UAS' :
        utsSubmission?.status === 'accepted' ? 'Pengembangan Lanjutan' :
        utsSubmission ? 'Evaluasi UTS' :
        implementationProgress > 30 ? 'Pengerjaan Pra-UTS' :
        'Inisiasi & Perencanaan';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Project Hub', href: '/projects' },
        { title: project.title, href: `/projects/${project.slug || project.id}` },
    ];

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string; submessage?: string } | null>(null);
    const [acceptedModalData, setAcceptedModalData] = useState<{
        name: string;
        email: string;
        role: string;
    } | null>(null);
    const [showActivateTeamModal, setShowActivateTeamModal] = useState(false);
    const [showSubmitFormationModal, setShowSubmitFormationModal] = useState(false);
    const [submittingFormation, setSubmittingFormation] = useState(false);

    // Project Management (Leader CRUD) States
    const [showEditProjectModal, setShowEditProjectModal] = useState(false);
    const [editProjectTab, setEditProjectTab] = useState<'info' | 'timeline' | 'proposal' | 'danger'>('info');
    const [savingProject, setSavingProject] = useState(false);
    const [projectForm, setProjectForm] = useState({
        title: project.title || '',
        team_name: project.team?.name || '',
        category: project.category || 'capstone',
        difficulty: project.difficulty || 'intermediate',
        visibility: project.visibility || 'public',
        status: project.status || 'recruiting',
        progress: project.progress ?? 0,
        short_description: project.short_description || '',
        description: project.description || '',
        starts_on: project.starts_on ? String(project.starts_on).substring(0, 10) : '',
        target_completion_on: project.target_completion_on ? String(project.target_completion_on).substring(0, 10) : '',
        recruitment_deadline: project.recruitment_deadline ? String(project.recruitment_deadline).substring(0, 10) : '',
        expected_weekly_hours: project.expected_weekly_hours ?? 10,
        min_team_size: project.min_team_size ?? 2,
        max_team_size: project.max_team_size ?? 4,
        repository_url: project.repository_url || '',
        demo_url: project.demo_url || '',
        problem_statement: project.problem_statement || '',
        objectives: project.objectives || '',
        proposed_solution: project.proposed_solution || '',
        tech_stack_input: Array.isArray(project.tech_stack)
            ? project.tech_stack.join(', ')
            : (project.tech_stack || ''),
    });

    useEffect(() => {
        setProjectForm({
            title: project.title || '',
            team_name: project.team?.name || '',
            category: project.category || 'capstone',
            difficulty: project.difficulty || 'intermediate',
            visibility: project.visibility || 'public',
            status: project.status || 'recruiting',
            progress: project.progress ?? 0,
            short_description: project.short_description || '',
            description: project.description || '',
            starts_on: project.starts_on ? String(project.starts_on).substring(0, 10) : '',
            target_completion_on: project.target_completion_on ? String(project.target_completion_on).substring(0, 10) : '',
            recruitment_deadline: project.recruitment_deadline ? String(project.recruitment_deadline).substring(0, 10) : '',
            expected_weekly_hours: project.expected_weekly_hours ?? 10,
            min_team_size: project.min_team_size ?? 2,
            max_team_size: project.max_team_size ?? 4,
            repository_url: project.repository_url || '',
            demo_url: project.demo_url || '',
            problem_statement: project.problem_statement || '',
            objectives: project.objectives || '',
            proposed_solution: project.proposed_solution || '',
            tech_stack_input: Array.isArray(project.tech_stack)
                ? project.tech_stack.join(', ')
                : (project.tech_stack || ''),
        });
    }, [project]);

    // Disband Project States
    const [showDisbandModal, setShowDisbandModal] = useState(false);
    const [disbandConfirmation, setDisbandConfirmation] = useState('');
    const [disbanding, setDisbanding] = useState(false);

    // Member Management States
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [addMemberUserId, setAddMemberUserId] = useState<string>('');
    const [addMemberRole, setAddMemberRole] = useState<string>('Anggota Tim');
    const [addingMember, setAddingMember] = useState(false);

    const [editingMember, setEditingMember] = useState<any | null>(null);
    const [newMemberRole, setNewMemberRole] = useState<string>('');
    const [savingMemberRole, setSavingMemberRole] = useState(false);

    const [removingMember, setRemovingMember] = useState<any | null>(null);
    const [removingMemberLoading, setRemovingMemberLoading] = useState(false);

    const [teamMembers, setTeamMembers] = useState<any[]>(project.team?.members || []);

    useEffect(() => {
        setTeamMembers(project.team?.members || []);
    }, [project.team?.members]);

    const handleSaveProject = (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProject(true);

        const techArray = projectForm.tech_stack_input
            ? projectForm.tech_stack_input.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];

        router.put(`/projects/${project.id || project.slug}`, {
            ...projectForm,
            tech_stack: techArray,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSavingProject(false);
                setShowEditProjectModal(false);
                showToast('Informasi dan pengaturan proyek berhasil disimpan!', 'success');
            },
            onError: (errors: any) => {
                setSavingProject(false);
                const firstMsg = typeof errors === 'object' && errors ? (Object.values(errors).flat()[0] as string) : null;
                showToast(firstMsg || 'Gagal menyimpan pembaruan proyek.', 'error');
            },
        });
    };

    const handleDisbandProject = () => {
        if (disbandConfirmation !== project.title && disbandConfirmation.toUpperCase() !== 'BUBARKAN') {
            showToast('Konfirmasi tidak cocok. Ketikkan nama proyek atau "BUBARKAN" untuk konfirmasi.', 'error');
            return;
        }

        setDisbanding(true);
        router.delete(`/projects/${project.id || project.slug}`, {
            onSuccess: () => {
                setDisbanding(false);
                setShowDisbandModal(false);
                setShowEditProjectModal(false);
            },
            onError: (errors: any) => {
                setDisbanding(false);
                const firstMsg = typeof errors === 'object' && errors ? (Object.values(errors).flat()[0] as string) : null;
                showToast(firstMsg || 'Gagal membubarkan proyek.', 'error');
            },
        });
    };

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!addMemberUserId) {
            showToast('Silakan pilih mahasiswa terlebih dahulu.', 'error');
            return;
        }

        setAddingMember(true);
        router.post(`/projects/${project.id || project.slug}/members`, {
            user_id: addMemberUserId,
            role_name: addMemberRole,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setAddingMember(false);
                setShowAddMemberModal(false);
                setAddMemberUserId('');
                setAddMemberRole('Anggota Tim');
                showToast('Anggota berhasil ditambahkan ke tim proyek!', 'success');
            },
            onError: (errors: any) => {
                setAddingMember(false);
                const firstMsg = typeof errors === 'object' && errors ? (Object.values(errors).flat()[0] as string) : null;
                showToast(firstMsg || 'Gagal menambahkan anggota.', 'error');
            },
        });
    };

    const handleUpdateMemberRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember || !newMemberRole.trim()) return;

        const targetId = editingMember.id;
        const role = newMemberRole.trim();
        setSavingMemberRole(true);

        // Optimistically update member role locally
        setTeamMembers((prev: any[]) => prev.map((m: any) => m.id === targetId ? { ...m, role_name: role } : m));

        router.patch(`/projects/${project.id || project.slug}/members/${targetId}`, {
            role_name: role,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSavingMemberRole(false);
                setEditingMember(null);
                showToast('Peran anggota berhasil diperbarui!', 'success');
            },
            onError: (errors: any) => {
                setTeamMembers(project.team?.members || []);
                setSavingMemberRole(false);
                const firstMsg = typeof errors === 'object' && errors ? (Object.values(errors).flat()[0] as string) : null;
                showToast(firstMsg || 'Gagal memperbarui peran anggota.', 'error');
            },
        });
    };

    const handleRemoveMember = () => {
        if (!removingMember) return;

        const targetId = removingMember.id;
        setRemovingMemberLoading(true);

        // Optimistically remove member locally
        setTeamMembers((prev: any[]) => prev.filter((m: any) => m.id !== targetId));

        router.delete(`/projects/${project.id || project.slug}/members/${targetId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setRemovingMemberLoading(false);
                setRemovingMember(null);
                showToast('Anggota berhasil dikeluarkan dari tim.', 'success');
            },
            onError: (errors: any) => {
                setTeamMembers(project.team?.members || []);
                setRemovingMemberLoading(false);
                const firstMsg = typeof errors === 'object' && errors ? (Object.values(errors).flat()[0] as string) : null;
                showToast(firstMsg || 'Gagal mengeluarkan anggota.', 'error');
            },
        });
    };

    useEffect(() => {
        if (flash?.success) {
            showToast(flash.success, 'success');
        } else if (flash?.error) {
            showToast(flash.error, 'error');
        } else if (flash?.info) {
            showToast(flash.info, 'info');
        }
    }, [flash]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', submessage?: string) => {
        setToast({ type, message, submessage });
        setTimeout(() => {
            setToast((current) => (current?.message === message ? null : current));
        }, 4500);
    };

    const toggleBookmark = async () => {
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/bookmark`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });
            const json = await res.json();
            setBookmarked(json.bookmarked);
            showToast(json.bookmarked ? 'Proyek ditambahkan ke bookmark.' : 'Proyek dihapus dari bookmark.', 'info');
        } catch {
            showToast('Gagal memperbarui bookmark.', 'error');
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/projects/${project.id}/apply`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    recruitment_role_id: applyingRole?.id || null,
                    message: applyMessage,
                }),
            });

            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                setApplyingRole(null);
                setApplyMessage('');
                showToast('Lamaran berhasil dikirim!', 'success', 'Ketua tim akan meninjau pengajuan Anda.');
                router.reload({ only: ['project', 'myApplication', 'isMember', 'applications'] });
            } else {
                showToast(json.message || 'Gagal mengirimkan lamaran.', 'error');
            }
        } catch {
            showToast('Terjadi kesalahan jaringan saat mengirim lamaran.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecideApplication = async (appId: number, action: 'accept' | 'reject') => {
        setDecidingId(appId);
        try {
            const res = await fetch(`/projects/${project.id}/applications/${appId}/respond`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ action }),
            });

            const json = await res.json().catch(() => ({}));
            const targetApp = applications.find((a: any) => a.id === appId);
            const applicantName = targetApp?.user?.name || 'Mahasiswa';
            const applicantEmail = targetApp?.user?.email || '';
            const roleName = targetApp?.role?.name || targetApp?.recruitment_role?.name || 'Anggota Tim';

            if (res.ok) {
                // Update applications state immediately so UI updates instantly
                setApplications((prev: any[]) =>
                    prev.map((a: any) =>
                        a.id === appId ? { ...a, status: action === 'accept' ? 'accepted' : 'rejected' } : a
                    )
                );

                if (action === 'accept') {
                    setAcceptedModalData({
                        name: applicantName,
                        email: applicantEmail,
                        role: roleName,
                    });
                    showToast(
                        `Mahasiswa ${applicantName} resmi bergabung dengan tim!`,
                        'success',
                        'Susunan tim dan kuota anggota telah diperbarui secara otomatis.'
                    );
                } else {
                    showToast(`Lamaran dari ${applicantName} telah ditolak.`, 'info');
                }

                // Reload fresh project data from server including updated team.members
                router.reload();
            } else {
                if (json.message?.toLowerCase().includes('sudah diproses')) {
                    setApplications((prev: any[]) =>
                        prev.map((a: any) =>
                            a.id === appId ? { ...a, status: 'accepted' } : a
                        )
                    );
                    showToast('Lamaran ini sudah diproses sebelumnya.', 'info', 'Status anggota telah diperbarui.');
                    router.reload();
                } else {
                    showToast(json.message || 'Gagal memproses lamaran.', 'error');
                }
            }
        } catch {
            showToast('Terjadi kesalahan jaringan saat memproses lamaran.', 'error');
        } finally {
            setDecidingId(null);
        }
    };

    const handleActivateTeam = () => {
        setShowActivateTeamModal(true);
    };

    const confirmActivateTeam = async () => {
        setLifecycleProcessing(true);
        try {
            const res = await fetch(`/projects/${project.id}/activate-team`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                setShowActivateTeamModal(false);
                showToast('Ruang kerja (Project Workspace) resmi aktif!', 'success');
                router.reload();
            } else {
                showToast(json.message || 'Gagal mengaktifkan kelompok.', 'error');
            }
        } catch {
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setLifecycleProcessing(false);
        }
    };

    const handleSubmitFormation = () => {
        if (activeMembersCount < maxQuota) {
            showToast(
                `Pengajuan ke dosen pengampu mewajibkan kuota anggota tim penuh (${activeMembersCount}/${maxQuota} orang).`,
                'error',
                'Silakan terima pelamar atau rekrut anggota tim terlebih dahulu.'
            );
            setActiveTab('members');
            window.setTimeout(() => {
                document.getElementById('applications-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            return;
        }
        setShowSubmitFormationModal(true);
    };

    const confirmSubmitFormation = () => {
        setSubmittingFormation(true);
        router.post(`/projects/${project.id}/formation/submit`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setShowSubmitFormationModal(false);
                showToast('Susunan tim proyek berhasil diajukan untuk dievaluasi oleh Dosen Pengampu!', 'success');
            },
            onError: (errors: any) => {
                const firstMsg = (typeof errors === 'object' && errors ? Object.values(errors).flat()[0] : null) as string;
                showToast(firstMsg || 'Gagal mengajukan formasi tim ke dosen.', 'error');
            },
            onFinish: () => {
                setSubmittingFormation(false);
            },
        });
    };

    const handleToggleRecruitment = async (targetStatus?: 'open' | 'closed') => {
        setTogglingRecruitment(true);
        try {
            const res = await fetch(`/projects/${project.id}/recruitment/toggle`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify(targetStatus ? { status: targetStatus } : {}),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                showToast(targetStatus === 'closed' || (!targetStatus && hasOpenRecruitment) ? 'Pendaftaran rekrutmen ditutup.' : 'Pendaftaran rekrutmen tim dibuka.', 'info');
                router.reload({ only: ['project', 'applications'] });
            } else {
                showToast(json.message || 'Gagal mengubah status rekrutmen.', 'error');
            }
        } catch {
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setTogglingRecruitment(false);
        }
    };

    const handleSendGuidance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guidanceTitle.trim() || !guidanceContent.trim()) return;
        setSubmittingGuidance(true);
        if (academicClass?.id) {
            router.post(
                `/classes/${academicClass.id}/guidance`,
                {
                    title: guidanceTitle,
                    content: guidanceContent,
                    type: guidanceType,
                    project_id: project.id,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setShowGuidanceModal(false);
                        setGuidanceTitle('');
                        setGuidanceContent('');
                        showToast('Arahan bimbingan dosen berhasil diterbitkan untuk tim proyek ini!', 'success');
                    },
                    onError: () => {
                        showToast('Gagal mengirimkan arahan bimbingan. Pastikan Anda memiliki akses pengampu pada kelas ini.', 'error');
                    },
                    onFinish: () => setSubmittingGuidance(false),
                }
            );
        } else {
            showToast('Catatan bimbingan berhasil disimpan.', 'success');
            setShowGuidanceModal(false);
            setSubmittingGuidance(false);
        }
    };

    // Calculate total documents
    const allDocuments = [
        ...(utsSubmission?.documents || []),
        ...(uasSubmission?.documents || []),
    ];

    const activeMembersCount = teamMembers.filter((m: any) => !m.status || m.status === 'active' || m.status === 'completed').length;
    const minQuota = project.min_team_size || 2;
    const maxQuota = academicClass?.target_team_size
        ? Math.min(project.max_team_size || academicClass.target_team_size, academicClass.target_team_size)
        : (project.max_team_size || project.team?.capacity || 4);
    const isQuotaFull = activeMembersCount >= maxQuota;
    const hasOpenRecruitment = !isQuotaFull && Boolean(
        project.has_open_recruitment ?? (
            project.status === 'recruiting'
            && project.team?.recruitment?.status === 'open'
            && !['team_locked', 'workspace_activated'].includes(project.formation_status || '')
        )
    );
    const activeAppStatuses = ['pending', 'under_review', 'submitted', 'accepted'];
    const hasActiveApplication = Boolean(myApplication && activeAppStatuses.includes(myApplication.status));

    // Role-Tailored Tabs: Dosen focus vs Mahasiswa focus
    const lecturerTabs = [
        { id: 'overview', label: 'Supervisi & Overview', icon: Layers },
        {
            id: 'formation',
            label: 'Alur Formasi & Persetujuan',
            icon: UserCheck,
            badge: project.formation_status === 'workspace_activated' ? 'Aktif' : (project.formation_status ? project.formation_status.replace('_', ' ') : 'Draft'),
        },
        { id: 'proposal', label: 'Living Proposal', icon: FileText, badge: proposalStatus },
        { id: 'lecturer_review', label: `Arahan Bimbingan (${guidances.length})`, icon: GraduationCap },
        { id: 'uts', label: 'Evaluasi UTS (40%)', icon: GraduationCap, badge: utsSubmission ? utsSubmission.status : 'Menunggu' },
        { id: 'uas', label: 'Evaluasi UAS (60%)', icon: Award, badge: uasSubmission ? uasSubmission.status : 'Menunggu' },
        { id: 'tasks', label: `Monitoring Kanban (${(kanban.todo?.length || 0) + (kanban.in_progress?.length || 0) + (kanban.in_review?.length || 0) + (kanban.completed?.length || 0)})`, icon: FolderKanban },
        { id: 'matchmaking', label: 'Simulasi Matchmaking', icon: Sparkles },
        {
            id: 'team_balance',
            label: 'Keseimbangan Tim',
            icon: PieChart,
            badge: teamBalance?.overall_score ? `${teamBalance.overall_score}%` : null,
        },
        { id: 'members', label: `Anggota Tim (${teamMembers.length})`, icon: Users },
        { id: 'progress', label: `Progres Implementasi (${implementationProgress}%)`, icon: Sparkles },
        { id: 'documents', label: `Dokumen (${allDocuments.length})`, icon: Download },
        { id: 'archive', label: 'Arsip & Portofolio', icon: Archive },
    ];

    const studentTabs = isAcademic ? [
        // Tab Proyek Akademik (Terhubung Kelas: Proposal, Snapshot UTS, Snapshot UAS, Arahan Dosen)
        { id: 'overview', label: 'Overview Proyek', icon: Layers },
        { id: 'requirements', label: 'Spesifikasi Tim', icon: Briefcase },
        { id: 'matchmaking', label: 'Smart Matchmaking', icon: Sparkles },
        {
            id: 'team_balance',
            label: 'Keseimbangan Tim',
            icon: PieChart,
            badge: teamBalance?.overall_score ? `${teamBalance.overall_score}%` : null,
        },
        {
            id: 'invitations',
            label: `Undangan (${sentInvitations.length + receivedInvitations.length})`,
            icon: Inbox,
            badge: receivedInvitations.length > 0 ? `${receivedInvitations.length} Baru` : null,
        },
        {
            id: 'formation',
            label: 'Alur Formasi',
            icon: UserCheck,
            badge: project.formation_status === 'workspace_activated' ? 'Aktif' : (project.formation_status ? project.formation_status.replace('_', ' ') : 'Draft'),
        },
        { id: 'proposal', label: 'Living Proposal', icon: FileText },
        { id: 'versions', label: `Versi (${livingProposal?.versions?.length || 1})`, icon: GitBranch },
        { id: 'tasks', label: `Tasks & Kanban (${(kanban.todo?.length || 0) + (kanban.in_progress?.length || 0) + (kanban.in_review?.length || 0) + (kanban.completed?.length || 0)})`, icon: FolderKanban },
        { id: 'milestones', label: `Milestones (${milestones.length})`, icon: Clock },
        { id: 'progress', label: `Progress (${implementationProgress}%)`, icon: Sparkles },
        { id: 'uts', label: 'Snapshot UTS', icon: GraduationCap, badge: utsSubmission ? utsSubmission.status : null },
        { id: 'uas', label: 'Snapshot UAS', icon: Award, badge: uasSubmission ? uasSubmission.status : null },
        { id: 'documents', label: `Dokumen (${allDocuments.length})`, icon: Download },
        { id: 'members', label: `Anggota Tim (${teamMembers.length})`, icon: Users },
        { id: 'discussion', label: `Diskusi (${discussions.length})`, icon: MessageSquare },
        { id: 'lecturer_review', label: `Arahan Dosen (${guidances.length})`, icon: GraduationCap },
        { id: 'archive', label: 'Portofolio', icon: Archive },
    ] : [
        // Tab Proyek Mandiri (Non-Akademik: Bersih dari Proposal Dosen, UTS, UAS, dan Arahan Bimbingan)
        { id: 'overview', label: 'Overview Proyek', icon: Layers },
        { id: 'requirements', label: 'Spesifikasi Tim', icon: Briefcase },
        { id: 'matchmaking', label: 'Smart Matchmaking', icon: Sparkles },
        {
            id: 'team_balance',
            label: 'Keseimbangan Tim',
            icon: PieChart,
            badge: teamBalance?.overall_score ? `${teamBalance.overall_score}%` : null,
        },
        {
            id: 'invitations',
            label: `Undangan (${sentInvitations.length + receivedInvitations.length})`,
            icon: Inbox,
            badge: receivedInvitations.length > 0 ? `${receivedInvitations.length} Baru` : null,
        },
        {
            id: 'formation',
            label: 'Alur Formasi',
            icon: UserCheck,
            badge: project.formation_status === 'workspace_activated' ? 'Aktif' : (project.formation_status ? project.formation_status.replace('_', ' ') : 'Draft'),
        },
        { id: 'proposal', label: 'Living Proposal', icon: FileText },
        { id: 'versions', label: `Versi (${livingProposal?.versions?.length || 1})`, icon: GitBranch },
        { id: 'tasks', label: `Tasks & Kanban (${(kanban.todo?.length || 0) + (kanban.in_progress?.length || 0) + (kanban.in_review?.length || 0) + (kanban.completed?.length || 0)})`, icon: FolderKanban },
        { id: 'milestones', label: `Milestones & Target (${milestones.length})`, icon: Clock },
        { id: 'progress', label: `Progress (${implementationProgress}%)`, icon: Sparkles },
        { id: 'documents', label: `Dokumen & Berkas (${allDocuments.length})`, icon: Download },
        { id: 'members', label: `Anggota Tim (${teamMembers.length})`, icon: Users },
        { id: 'discussion', label: `Diskusi (${discussions.length})`, icon: MessageSquare },
        { id: 'archive', label: 'Portofolio & Showcase', icon: Archive },
    ];

    const canonicalUrl = `https://rakitcampus.my.id/projects/${project.slug || project.id}`;
    const cleanDesc = (project.description || project.short_description || '')
        .replace(/<[^>]*>?/gm, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180) || `Eksplor proyek mahasiswa ${project.title} kategori ${project.category || 'Teknologi'} di RAKIT Campus.`;
    const tabs = (isLecturerUser && isAcademic) ? lecturerTabs : studentTabs;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SeoHead
                title={`${project.title} — Showcase Inovasi & Portofolio Mahasiswa`}
                description={cleanDesc}
                keywords={`proyek ${project.title}, ${project.category || ''}, karya mahasiswa, portofolio inovasi, living proposal, rakit campus`}
                canonicalUrl={canonicalUrl}
                ogImage={project.cover_image || undefined}
                ogType="article"
            />

            <div className="space-y-6">
                <div className="flex flex-col gap-6">
                    {/* Top navigation row */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/projects"
                            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95"
                        >
                            <ArrowLeft className="size-3.5 text-slate-500 group-hover:text-blue-600 transition-all duration-200 group-hover:-translate-x-1" />
                            <span>Kembali ke Proyek</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            {project.team && (isMember || isLeader || isLecturer) && canAccessWorkspace && (
                                <Link
                                    href={`/workspace/${project.team.id}`}
                                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95"
                                >
                                    <FolderKanban className="size-3.5 text-blue-600 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
                                    <span>Workspace Tim</span>
                                </Link>
                            )}

                            {(isLeader || canEdit) && (
                                <button
                                    type="button"
                                    onClick={() => setShowEditProjectModal(true)}
                                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                                    title="Kelola informasi, progres, dan pengaturan proyek"
                                >
                                    <Settings className="size-3.5 text-indigo-600 transition-transform duration-200 group-hover:rotate-45" />
                                    <span>Kelola Proyek</span>
                                </button>
                            )}

                            <button
                                onClick={toggleBookmark}
                                className={`group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                                    bookmarked
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                                        : 'bg-white text-slate-700 border-slate-200/80 hover:bg-blue-50/50 hover:text-blue-600 hover:border-blue-200'
                                }`}
                                title={bookmarked ? 'Hapus dari simpanan' : 'Simpan proyek ini'}
                            >
                                <Bookmark
                                    className={`size-3.5 transition-all duration-200 group-hover:scale-110 ${
                                        bookmarked
                                            ? 'fill-blue-600 text-blue-600'
                                            : 'text-slate-400 group-hover:text-blue-600 group-hover:-rotate-6'
                                    }`}
                                />
                                <span>{bookmarked ? 'Tersimpan' : 'Simpan Proyek'}</span>
                            </button>
                        </div>
                    </div>

                    {flash?.success && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}
                    {flash?.info && (
                        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800">
                            {flash.info}
                        </div>
                    )}
                    {(flash?.warning || flash?.error) && (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">
                            {flash?.error || flash?.warning}
                        </div>
                    )}

                    {/* HERO HEADER: Status Indicators & Quick Actions */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs flex flex-col gap-5">
                        {/* Row 1: Badges & Recruitment Status / Toggle */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* Badges Metadata */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Kategori Proyek */}
                                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80">
                                    {project.category?.replace('_', ' ')}
                                </span>

                                {/* Kelas Perkuliahan vs Proyek Mandiri */}
                                {academicClass ? (
                                    <Link
                                        href={`/classes/${academicClass.code || academicClass.id}`}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition"
                                    >
                                        <GraduationCap className="size-3.5 text-blue-600" />
                                        <span>Kelas: {academicClass.name} ({academicClass.code})</span>
                                    </Link>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                                        <UserCheck className="size-3.5 text-slate-500" />
                                        <span>Proyek Mandiri</span>
                                    </span>
                                )}

                                {/* Tingkat Kesulitan */}
                                <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200/60">
                                    Kesulitan: {project.difficulty || 'Intermediate'}
                                </span>

                                {/* Status Workspace */}
                                {(canAccessWorkspace || (!academicClass && activeMembersCount >= maxQuota) || project.formation_status === 'workspace_activated') ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80">
                                        <FolderKanban className="size-3.5" />
                                        <span>Workspace Aktif</span>
                                    </span>
                                ) : academicClass ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80">
                                        <Clock className="size-3.5" />
                                        <span>Workspace: Menunggu Persetujuan Dosen</span>
                                    </span>
                                ) : null}
                            </div>

                            {/* Recruitment Status / Switch */}
                            {project.status === 'recruiting' && (
                                isLeader ? (
                                    <button
                                        type="button"
                                        onClick={() => !isQuotaFull && handleToggleRecruitment(hasOpenRecruitment ? 'closed' : 'open')}
                                        disabled={togglingRecruitment || isQuotaFull}
                                        className={`group inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-200 shadow-2xs ${
                                            isQuotaFull
                                                ? 'bg-slate-100/80 border-slate-200/90 cursor-not-allowed opacity-75'
                                                : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200/80 cursor-pointer hover:shadow-xs active:scale-95'
                                        }`}
                                        title={
                                            isQuotaFull
                                                ? 'Kuota anggota tim sudah penuh (rekrutmen otomatis dinonaktifkan)'
                                                : hasOpenRecruitment
                                                ? 'Klik untuk menutup pendaftaran rekrutmen'
                                                : 'Klik untuk membuka pendaftaran rekrutmen'
                                        }
                                    >
                                        <span className="text-xs font-bold text-slate-700 transition-colors">
                                            {togglingRecruitment
                                                ? 'Memproses...'
                                                : isQuotaFull
                                                ? 'Rekrutmen Ditutup (Kuota Penuh)'
                                                : 'Rekrutmen Anggota'}
                                        </span>
                                        <div
                                            className={`relative w-7 h-4 rounded-full transition-colors duration-200 ease-in-out shrink-0 ${
                                                !isQuotaFull && hasOpenRecruitment ? 'bg-blue-600' : 'bg-slate-300'
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                                                    !isQuotaFull && hasOpenRecruitment ? 'translate-x-3' : 'translate-x-0'
                                                }`}
                                            />
                                        </div>
                                    </button>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold">
                                        <span className={`size-2 rounded-full ${!isQuotaFull && hasOpenRecruitment ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`} />
                                        <span>
                                            {isQuotaFull
                                                ? 'Rekrutmen Ditutup (Kuota Penuh)'
                                                : hasOpenRecruitment
                                                ? 'Rekrutmen Terbuka'
                                                : 'Rekrutmen Ditutup'}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Row 2: Title, Description, Leader Meta & Action Button */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex-1 max-w-3xl">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                    {project.title}
                                </h1>

                                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                                    {project.short_description || project.description || 'Tidak ada deskripsi singkat proyek.'}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-600">
                                    <div className="inline-flex items-center gap-1.5">
                                        <span className="size-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                                            {project.leader?.name ? project.leader.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                        <span>Ketua: <strong className="text-slate-900 font-semibold">{project.leader?.name || 'Mahasiswa'}</strong></span>
                                    </div>

                                    {academicClass?.lecturer && (
                                        <div className="inline-flex items-center gap-1.5">
                                            <span className="text-slate-300">·</span>
                                            <GraduationCap className="size-3.5 text-blue-600" />
                                            <span>Dosen: <strong className="text-slate-900 font-semibold">{academicClass.lecturer.name}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right action block: Strictly differentiated for Dosen vs Mahasiswa */}
                            <div className="flex flex-col sm:items-end justify-center gap-2.5 shrink-0">
                                {isLecturerUser ? (
                                    <>
                                        <div className="text-right text-xs">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                                                <GraduationCap className="size-3.5" />
                                                <span>Portal Supervisi Dosen</span>
                                            </span>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Ketua Tim: <strong className="text-slate-900">{project.leader?.name}</strong>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {project.formation_status === 'formation_review' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('formation')}
                                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                                >
                                                    <UserCheck className="size-3.5" />
                                                    <span>Setujui Formasi Tim</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setShowGuidanceModal(true)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                                            >
                                                <MessageSquare className="size-3.5" />
                                                <span>Beri Arahan Bimbingan</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('proposal')}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition cursor-pointer"
                                            >
                                                <FileText className="size-3.5 text-blue-600" />
                                                <span>Review Proposal</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab(utsSubmission ? 'uas' : 'uts')}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition cursor-pointer"
                                            >
                                                <Award className="size-3.5 text-blue-600" />
                                                <span>Nilai UTS / UAS</span>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Team formation & workspace activation aligned with Lecturer Approval step */}
                                        {isLeader && (
                                            (canAccessWorkspace || (!academicClass && activeMembersCount >= maxQuota) || project.formation_status === 'workspace_activated') && project.team?.id ? (
                                                <Link
                                                    href={`/workspace/${project.team.id}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                                >
                                                    <FolderKanban className="size-4" />
                                                    <span>Buka Workspace Tim</span>
                                                </Link>
                                            ) : (project.formation_status === 'lecturer_approved' || project.formation_status === 'team_locked') ? (
                                                <button
                                                    onClick={handleActivateTeam}
                                                    disabled={lifecycleProcessing}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                                                >
                                                    <UserCheck className="size-4" />
                                                    <span>Konfirmasi Formasi & Buka Workspace</span>
                                                </button>
                                            ) : project.formation_status === 'formation_review' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => showToast(`Susunan tim sedang dievaluasi oleh Dosen Pengampu (${academicClass?.lecturer?.name || 'Dosen'}). Mohon menunggu keputusan persetujuan.`, 'info')}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer"
                                                >
                                                    <Clock className="size-4" />
                                                    <span>Menunggu Persetujuan Dosen</span>
                                                </button>
                                            ) : project.formation_status === 'formation_rejected' ? (
                                                <button
                                                    type="button"
                                                    onClick={handleSubmitFormation}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition cursor-pointer"
                                                >
                                                    <AlertCircle className="size-4" />
                                                    <span>Pengajuan Tim Ditolak • Ajukan Ulang</span>
                                                </button>
                                             ) : academicClass ? (
                                                activeMembersCount < maxQuota ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleSubmitFormation}
                                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition cursor-pointer"
                                                    >
                                                        <Users className="size-4 text-blue-600" />
                                                        <span>Kuota Tim ({activeMembersCount}/{maxQuota}) • Lengkapi</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleSubmitFormation}
                                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                                    >
                                                        <Send className="size-4" />
                                                        <span>Ajukan ke Dosen (Kuota Penuh)</span>
                                                    </button>
                                                )
                                             ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('formation')}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition cursor-pointer"
                                                >
                                                    <Users className="size-4 text-blue-600" />
                                                    <span>Kuota Tim ({activeMembersCount}/{maxQuota}) • Kelola</span>
                                                </button>
                                            )
                                        )}

                                        {/* Anggota biasa (bukan ketua): Informasi status peran */}
                                        {!isLeader && isMember && (
                                            <div className="flex flex-col sm:items-end gap-1.5">
                                                {(canAccessWorkspace || (!academicClass && activeMembersCount >= maxQuota) || project.formation_status === 'workspace_activated') && project.team?.id ? (
                                                    <Link
                                                        href={`/workspace/${project.team.id}`}
                                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                                    >
                                                        <FolderKanban className="size-4" />
                                                        <span>Buka Workspace Tim</span>
                                                    </Link>
                                                ) : (
                                                    <>
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                                                            <Users className="size-3.5" />
                                                            <span>Anggota Tim</span>
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">
                                                            {academicClass
                                                                ? (project.formation_status === 'formation_review'
                                                                    ? 'Menunggu Persetujuan Dosen'
                                                                    : 'Menunggu Pengajuan ke Dosen')
                                                                : 'Menunggu Kuota Tim Lengkap'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Apply button for eligible students */}
                                        {!isMember && project.status === 'recruiting' && (
                                            hasActiveApplication ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('members')}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer"
                                                >
                                                    <Clock className="size-3.5" />
                                                    <span>Lamaran {myApplication?.status === 'pending' || myApplication?.status === 'under_review' || myApplication?.status === 'submitted' ? 'Sedang Ditinjau' : myApplication?.status}</span>
                                                </button>
                                            ) : isQuotaFull ? (
                                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
                                                    <span>Kuota Tim Penuh</span>
                                                </span>
                                            ) : !hasOpenRecruitment ? (
                                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
                                                    <span>Rekrutmen Ditutup</span>
                                                </span>
                                            ) : project.has_capacity && eligibility?.eligible !== false ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const firstRole = project.team?.recruitment?.roles?.[0] || { id: null, name: 'Anggota Tim Pengembang' };
                                                        setApplyingRole(firstRole);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                                >
                                                    <Send className="size-3.5" />
                                                    <span>Lamar / Ajukan Bergabung</span>
                                                </button>
                                            ) : eligibility?.reason?.includes('belum terdaftar') || eligibility?.reason?.includes('kelas') ? (
                                                // Student not enrolled in class — guide them to join first
                                                academicClass ? (
                                                    <Link
                                                        href={`/classes/${academicClass.code || academicClass.id}`}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                                    >
                                                        <GraduationCap className="size-3.5" />
                                                        <span>Daftar ke Kelas untuk Bergabung</span>
                                                    </Link>
                                                ) : (
                                                    <span
                                                        title={eligibility?.reason || ''}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold"
                                                    >
                                                        <span>Harus Terdaftar di Kelas</span>
                                                    </span>
                                                )
                                            ) : !project.has_capacity ? (
                                                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                                                    <span>Kapasitas Tim Penuh</span>
                                                </span>
                                            ) : eligibility?.reason ? (
                                                <span
                                                    title={eligibility.reason}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold"
                                                >
                                                    <span>Belum Memenuhi Syarat</span>
                                                </span>
                                            ) : null
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Cohesive Status & Progress Strip (Blue, Slate, White Brand Palette) */}
                        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 bg-slate-50/70 -mx-5 sm:-mx-7 -mb-5 sm:-mb-7 px-5 sm:px-7 py-4 rounded-b-2xl">
                            {/* 1. Proposal Status vs Project Phase */}
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                                    {isAcademic ? <FileText className="size-4" /> : <Compass className="size-4" />}
                                </div>
                                <div className="min-w-0">
                                    <span className="text-slate-500 block font-medium text-[11px]">
                                        {isAcademic ? 'Status Proposal' : 'Fase Proyek'}
                                    </span>
                                    <span className="text-slate-900 font-bold text-xs sm:text-sm truncate block mt-0.5">
                                        {isAcademic ? (
                                            <>
                                                Versi {proposalVersion}{' '}
                                                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 uppercase">
                                                    {proposalStatus}
                                                </span>
                                            </>
                                        ) : (
                                            implementationProgress >= 100 || project.status === 'completed'
                                                ? 'Rilis & Portofolio'
                                                : implementationProgress >= 70
                                                ? 'Pengujian & Beta'
                                                : implementationProgress >= 30
                                                ? 'Pengembangan MVP'
                                                : 'Ideasi & Perencanaan'
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* 2. Implementation Progress */}
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                                    <FolderKanban className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-500 font-medium text-[11px]">Progres Pengerjaan</span>
                                        <span className="text-slate-900 font-bold text-xs">{implementationProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(implementationProgress, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Overall Project Status */}
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                                    <ShieldCheck className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-slate-500 block font-medium text-[11px]">
                                        {isAcademic ? 'Status Akademik' : 'Status Keseluruhan'}
                                    </span>
                                    <span className="text-slate-900 font-bold text-xs sm:text-sm truncate block mt-0.5">
                                        {isAcademic ? overallStatusLabel : (
                                            project.status === 'completed'
                                                ? 'Proyek Selesai'
                                                : project.status === 'in_progress'
                                                ? 'Sedang Dikerjakan'
                                                : project.status === 'recruiting'
                                                ? 'Membuka Anggota'
                                                : 'Inisiasi Tim'
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TIMELINE VISUALIZER: Semester Capstone untuk Proyek Akademik vs Project Roadmap untuk Proyek Mandiri */}
                    {isAcademic ? (
                        <SemesterTimeline
                            proposalVersion={proposalVersion}
                            proposalStatus={proposalStatus}
                            implementationProgress={implementationProgress}
                            utsSubmission={utsSubmission}
                            uasSubmission={uasSubmission}
                            projectStatus={project.status}
                        />
                    ) : (
                        <ProjectRoadmapTimeline
                            implementationProgress={implementationProgress}
                            projectStatus={project.status}
                        />
                    )}

                    {/* 18-PIECE JIGSAW PUZZLE BOARD (6x3 ASSEMBLED GRID) */}
                    <ProjectJigsawBoard
                        activeTab={activeTab}
                        onSelectTab={(id) => setActiveTab(id)}
                        teamBalanceScore={teamBalance?.overall_score}
                        invitationsCount={sentInvitations.length + receivedInvitations.length}
                        formationBadge={project.formation_status === 'workspace_activated' ? 'Aktif' : (project.formation_status ? project.formation_status.replace('_', ' ') : 'Draft')}
                        membersBadge={`${activeMembersCount}/${maxQuota} Tim`}
                        proposalBadge={proposalStatus || 'Draft'}
                        versionsCount={livingProposal?.versions?.length || 1}
                        documentsCount={allDocuments.length}
                        discussionsCount={discussions.length}
                        guidancesCount={guidances.length}
                        tasksCount={(kanban.todo?.length || 0) + (kanban.in_progress?.length || 0) + (kanban.in_review?.length || 0) + (kanban.completed?.length || 0)}
                        milestonesCount={milestones.length}
                        progressPercentage={implementationProgress}
                        utsStatus={utsSubmission ? utsSubmission.status : 'Menunggu'}
                        uasStatus={uasSubmission ? uasSubmission.status : 'Menunggu'}
                        isAcademic={isAcademic}
                    />

                    {/* TAB CONTENT SWITCHER */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            {/* LEFT COLUMN (2 COLS) - Core Workspace & Living Proposal Command Center */}
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                {/* IF DOSEN: Tampilkan Supervisi Akademik & Bimbingan Dosen */}
                                {isLecturerUser && (
                                    <div className="rounded-2xl p-6 shadow-xs border border-blue-200/80 bg-white">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                            <div>
                                                <h2 className="text-base font-black text-slate-900 tracking-tight">
                                                    Pusat Kendali Dosen: Pembimbingan, Proposal & Evaluasi
                                                </h2>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowGuidanceModal(true)}
                                                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                                                >
                                                    <MessageSquare className="size-3.5" />
                                                    <span>Beri Arahan Bimbingan</span>
                                                </button>
                                                {project.formation_status === 'formation_review' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('formation')}
                                                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <UserCheck className="size-3.5" />
                                                        <span>Setujui Formasi Tim</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* 5 PILARS GRID (DOSEN ROLE) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
                                            {/* 1. Membimbing Proyek & Persiapan Lomba */}
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">1. Bimbingan</span>
                                                    <strong className="text-xs font-bold text-slate-900 block mt-1">Arahan Dosen</strong>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                                        {guidances.length > 0 ? `${guidances.length} catatan aktif.` : 'Belum ada catatan.'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('lecturer_review')}
                                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mt-2 text-left cursor-pointer"
                                                >
                                                    <span>Buka Bimbingan</span>
                                                    <ArrowRight className="size-3" />
                                                </button>
                                            </div>

                                            {/* 2. Meninjau serta Menyetujui Proposal */}
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">2. Proposal</span>
                                                    <strong className="text-xs font-bold text-slate-900 block mt-1">Living Proposal</strong>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        Versi {proposalVersion} ({proposalStatus})
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('proposal')}
                                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mt-2 text-left cursor-pointer"
                                                >
                                                    <span>Review Proposal</span>
                                                    <ArrowRight className="size-3" />
                                                </button>
                                            </div>

                                            {/* 3. Memantau Progres & Memberi Arahan */}
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">3. Progres</span>
                                                    <strong className="text-xs font-bold text-slate-900 block mt-1">Kanban & Sprint</strong>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        {implementationProgress}% • {kanban.completed?.length || 0} tugas selesai
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('tasks')}
                                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mt-2 text-left cursor-pointer"
                                                >
                                                    <span>Pantau Kanban</span>
                                                    <ArrowRight className="size-3" />
                                                </button>
                                            </div>

                                            {/* 4. Mengevaluasi Proyek & Prestasi */}
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">4. Evaluasi</span>
                                                    <strong className="text-xs font-bold text-slate-900 block mt-1">UTS & UAS</strong>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        UTS: {utsSubmission?.total_score || 'Menunggu'} | UAS: {uasSubmission?.total_score || 'Menunggu'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab(utsSubmission ? 'uas' : 'uts')}
                                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mt-2 text-left cursor-pointer"
                                                >
                                                    <span>Input Penilaian</span>
                                                    <ArrowRight className="size-3" />
                                                </button>
                                            </div>

                                            {/* 5. Menjalankan Simulasi Pembagian Tim */}
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">5. Formasi Tim</span>
                                                    <strong className="text-xs font-bold text-slate-900 block mt-1">Alur & Balance</strong>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        {activeMembersCount}/{maxQuota} Mhs • {teamBalance?.overall_score || 0}%
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('formation')}
                                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mt-2 text-left cursor-pointer"
                                                >
                                                    <span>Validasi Tim</span>
                                                    <ArrowRight className="size-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 1. HERO LIVING PROPOSAL & PROJECT SCOPE CARD */}
                                <div className="rounded-2xl p-6 sm:p-7 bg-white border border-slate-200/80 shadow-xs relative">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
                                        <div className="space-y-2 max-w-xl">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold">
                                                    Versi {proposalVersion} • {proposalStatus || 'DRAFT'}
                                                </span>
                                                {isAcademic && academicClass?.name && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 text-[11px] font-medium">
                                                        Kelas {academicClass.name}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight pt-1">
                                                {project.title}
                                            </h3>

                                            <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                                                {livingProposal?.current_version?.abstract ||
                                                    project.description ||
                                                    project.problem_statement ||
                                                    'Living proposal proyek aktif dalam pengembangan berkelanjutan. Metodologi teknis, sprint backlog, dan dokumen perancangan terintegrasi secara modular.'}
                                            </p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start sm:self-auto">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('proposal')}
                                                className="group px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-blue-600/20 flex items-center justify-between gap-3.5 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="size-3.5" />
                                                    <span>Buka Proposal</span>
                                                </div>
                                                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dosen Pembimbing Strip (Academic Only) */}
                                    {isAcademic && (
                                        <div className="mt-4 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                                                    <GraduationCap className="size-4" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dosen Pembimbing Akademik</span>
                                                    <span className="font-extrabold text-slate-900 text-xs sm:text-[13px]">
                                                        {academicClass?.lecturer?.name || project.lecturer?.name || 'Budi Santoso, M.Kom.'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {guidances.length > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('lecturer_review')}
                                                        className="group px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 hover:border-blue-300 active:scale-[0.98] text-blue-700 border border-blue-200 text-xs font-bold transition-all duration-200 flex items-center gap-2.5 cursor-pointer"
                                                    >
                                                        <span>{guidances.length} Catatan Bimbingan</span>
                                                        <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-medium text-slate-500">
                                                        Status Bimbingan: <strong className="text-slate-900 font-bold">Siap Konsultasi</strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. BENTO DUAL: TUJUAN PROYEK & SOLUSI INOVATIF */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="rounded-2xl p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                                                    <Target className="size-4" />
                                                </div>
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                                    Tujuan Proyek
                                                </h4>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                                {project.objectives || 'Menyelesaikan tantangan inti dengan implementasi solusi terstruktur, kolaboratif, dan terukur.'}
                                            </p>
                                        </div>
                                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                            <span>Fokus Capaian</span>
                                            <strong className="text-blue-600 font-bold">Terverifikasi</strong>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                                                    <Compass className="size-4" />
                                                </div>
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                                    Solusi yang Ditawarkan
                                                </h4>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                                {project.proposed_solution || 'Platform modern terintegrasi dengan otomatisasi alur kerja, analisis cerdas, dan arsitektur modular.'}
                                            </p>
                                        </div>
                                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                            <span>Arsitektur</span>
                                            <strong className="text-slate-900 font-bold">Modern Web Stack</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. EXECUTION HUB: STATUS SPRINT & KANBAN MANAGEMENT */}
                                <div className="rounded-2xl p-6 bg-white border border-slate-200/80 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                                                    <FolderKanban className="size-4" />
                                                </div>
                                                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                                                    Status Sprint & Eksekusi Kanban
                                                </h3>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Tracking pengerjaan sprint, pembagian tugas backlog, dan deliverable milestone.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <span className="text-sm font-black text-slate-900 block">{implementationProgress}%</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai</span>
                                            </div>
                                            <div className="w-24 sm:w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                                                <div
                                                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${implementationProgress}%` }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('tasks')}
                                                className="group px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-blue-600/20 flex items-center gap-3 cursor-pointer shrink-0"
                                            >
                                                <span>Buka Kanban</span>
                                                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 4 Metric Tiles: Balanced Blue, Slate, White Hierarchy */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                            <span className="text-xl font-black text-slate-900 block">{kanban.todo?.length || 0}</span>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-1 block">To Do</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/60">
                                            <span className="text-xl font-black text-blue-600 block">{kanban.in_progress?.length || 0}</span>
                                            <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider mt-1 block">In Progress</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80">
                                            <span className="text-xl font-black text-blue-700 block">{kanban.in_review?.length || 0}</span>
                                            <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider mt-1 block">In Review</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-blue-100/60 border border-blue-200">
                                            <span className="text-xl font-black text-blue-900 block">{kanban.completed?.length || 0}</span>
                                            <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider mt-1 block">Done Selesai</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN (1 COL) - Sidebar: Recruitment, Team, Tech Stack, Workspace Hub */}
                            <div className="flex flex-col gap-6">
                                {/* CARD 1: REKRUTMEN & KUOTA TIM (Palet Biru, Hitam, Putih) */}
                                <div className="rounded-2xl p-6 bg-white border border-slate-200/80 shadow-xs">
                                    <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                            <Users className="size-4 text-blue-600" />
                                            <span>Rekrutmen & Kuota Tim</span>
                                        </h3>
                                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-blue-600 text-white">
                                            {hasOpenRecruitment ? 'Terbuka' : 'Lengkap'}
                                        </span>
                                    </div>

                                    <div className="space-y-3 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 font-medium">Kuota Anggota</span>
                                            <span className="font-extrabold text-slate-900">
                                                {activeMembersCount} / {maxQuota} Orang <span className="text-slate-400 font-normal">(min. {minQuota})</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 font-medium">Status Workspace</span>
                                            <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                                                canAccessWorkspace
                                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                            }`}>
                                                {canAccessWorkspace ? 'Workspace Aktif' : 'Menunggu Dosen'}
                                            </span>
                                        </div>
                                    </div>

                                    {project.team?.recruitment?.roles && project.team.recruitment.roles.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-100">
                                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                                                Posisi Dibutuhkan
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {project.team.recruitment.roles.map((r: any) => (
                                                    <span
                                                        key={r.id}
                                                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/80"
                                                    >
                                                        {r.name} ({r.slots || 1})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-5 flex flex-col gap-2">
                                        {!isMember && !hasActiveApplication && hasOpenRecruitment && project.has_capacity && eligibility?.eligible !== false && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const firstRole = project.team?.recruitment?.roles?.[0] || { id: null, name: 'Anggota Tim Pengembang' };
                                                    setApplyingRole(firstRole);
                                                }}
                                                className="group w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-blue-600/20 inline-flex items-center justify-center gap-3 cursor-pointer"
                                            >
                                                <Send className="size-3.5 transition-transform duration-200 group-hover:scale-110" />
                                                <span>Lamar / Ajukan Bergabung</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('members')}
                                            className="group w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] text-slate-800 border border-slate-200/80 text-xs font-bold transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-3 shadow-2xs hover:shadow-xs"
                                        >
                                            <span>Lihat Detail Posisi & Anggota</span>
                                            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </div>

                                {/* CARD 2: ANGGOTA TIM */}
                                <div className="rounded-2xl p-6 bg-white border border-slate-200/80 shadow-xs">
                                    <div className="flex items-center justify-between mb-3.5">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            Anggota Tim ({teamMembers.length} Orang)
                                        </h3>
                                        <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => setActiveTab('members')}>
                                            Kelola →
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {teamMembers.map((m: any) => (
                                            <div key={m.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="size-7 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center uppercase">
                                                        {m.user?.name?.slice(0, 2) || 'US'}
                                                    </div>
                                                    <div>
                                                        <span className="font-extrabold text-slate-900 block">{m.user?.name}</span>
                                                        <span className="text-[10px] text-slate-500 font-medium">
                                                            {m.role_name || (m.permission === 'leader' ? 'Project Leader' : 'Anggota Tim')}
                                                        </span>
                                                    </div>
                                                </div>
                                                {m.permission === 'leader' ? (
                                                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                                                        Ketua
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                                                        Anggota
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CARD 3: TECH STACK */}
                                <div className="rounded-2xl p-6 bg-white border border-slate-200/80 shadow-xs">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
                                        Tech Stack Proyek
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 ? (
                                            project.tech_stack.map((t: string, idx: number) => (
                                                <span key={idx} className="text-xs font-extrabold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs">
                                                    {t}
                                                </span>
                                            ))
                                        ) : (
                                            <>
                                                <span className="text-xs font-extrabold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs">Laravel</span>
                                                <span className="text-xs font-extrabold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs">React</span>
                                                <span className="text-xs font-extrabold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs">Tailwind CSS</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'formation' && (
                        <TeamFormationTab
                            project={project}
                            isLeader={isLeader}
                            isLecturer={isLecturerUser}
                            canAccessWorkspace={canAccessWorkspace}
                            academicClass={academicClass}
                            livingProposal={livingProposal}
                        />
                    )}

                    {activeTab === 'requirements' && (
                        <RequirementsTab
                            project={project}
                            isLeader={isLeader}
                            isLecturer={isLecturerUser}
                        />
                    )}

                    {activeTab === 'matchmaking' && (
                        <MatchmakingTab
                            project={project}
                            sameClassCandidates={sameClassCandidates}
                            classStudents={classStudents}
                            teamOptimization={teamOptimization}
                            teamBalance={teamBalance}
                            isLeader={isLeader}
                            isLecturer={isLecturerUser}
                        />
                    )}

                    {activeTab === 'team_balance' && (
                        <TeamBalanceTab
                            project={project}
                            teamBalance={teamBalance}
                            teamOptimization={teamOptimization}
                        />
                    )}

                    {activeTab === 'invitations' && (
                        <InvitationsTab
                            project={project}
                            sentInvitations={sentInvitations}
                            receivedInvitations={receivedInvitations}
                            isLeader={isLeader}
                            isLecturer={isLecturerUser}
                            userHasActiveProject={userHasActiveProject}
                        />
                    )}

                    {activeTab === 'proposal' && (
                        <LivingProposalTab
                            project={project}
                            livingProposal={livingProposal}
                            isLeader={isLeader}
                            isMember={isMember}
                            isLecturer={isLecturerUser}
                        />
                    )}

                    {activeTab === 'versions' && (
                        <ProposalVersionsTab
                            project={project}
                            livingProposal={livingProposal}
                        />
                    )}

                    {activeTab === 'tasks' && (
                        <TasksKanbanTab
                            project={project}
                            kanban={kanban}
                            isMember={isMember}
                            isLeader={isLeader}
                        />
                    )}

                    {activeTab === 'milestones' && (
                        <div className="flex flex-col gap-4">
                            <div className="glass-card rounded-2xl p-6 shadow-xs flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Clock className="size-5 text-blue-600" />
                                        <span>Roadmap Milestones Proyek Capstone</span>
                                    </h3>
                                </div>
                                <span className="text-xs font-bold text-slate-600">
                                    Total: <strong className="text-blue-600">{milestones.length} Milestones</strong>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {milestones.map((m: any) => (
                                    <div key={m.id} className="glass-card rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                    m.status === 'completed'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                    {m.status}
                                                </span>
                                                <span className="text-[11px] text-slate-400">{m.due_on || 'TBD'}</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description}</p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100">
                                            <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                                                <span>Tugas Selesai</span>
                                                <span>{m.completed_tasks_count}/{m.tasks_count} ({m.progress}%)</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${m.progress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'progress' && (
                        <div className="flex flex-col gap-6">
                            {/* Transparent Calculation Breakdown */}
                            <div className="glass-card rounded-2xl p-6 shadow-xs">
                                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="size-5 text-blue-600" />
                                    <span>Kalkulasi Progres Implementasi & Capstone Transparan</span>
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Komponen 1</span>
                                        <h4 className="text-xs font-bold text-slate-800">Tugas Kanban Selesai (50%)</h4>
                                        <span className="text-2xl font-black text-blue-600 mt-2 block">
                                            {kanban.completed?.length || 0} / {(kanban.todo?.length || 0) + (kanban.in_progress?.length || 0) + (kanban.in_review?.length || 0) + (kanban.completed?.length || 0)} Tugas
                                        </span>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Komponen 2</span>
                                        <h4 className="text-xs font-bold text-slate-800">Milestones Tercapai (50%)</h4>
                                        <span className="text-2xl font-black text-blue-600 mt-2 block">
                                            {milestones.filter((m: any) => m.status === 'completed').length} / {milestones.length || 1} Milestones
                                        </span>
                                    </div>

                                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                                        <span className="text-[10px] font-black uppercase text-blue-800 block mb-1">Total Progres</span>
                                        <h4 className="text-xs font-bold text-blue-900">Progres Akhir Implementasi</h4>
                                        <span className="text-2xl font-black text-blue-700 mt-2 block">
                                            {implementationProgress}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Log stream */}
                            <div className="glass-card rounded-2xl p-6 shadow-xs">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                                    Log Aktivitas & Audit Jejak Rekam Proyek ({activities.length})
                                </h4>
                                <div className="flex flex-col gap-3">
                                    {activities.map((act: any) => (
                                        <div key={act.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-2 rounded-full bg-blue-600" />
                                                <span className="font-bold text-slate-900">{act.actor?.name || 'Sistem'}</span>
                                                <span className="text-slate-600">{act.action?.replace('_', ' ')}</span>
                                            </div>
                                            <span className="text-[11px] text-slate-400">
                                                {act.created_at ? new Date(act.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'uts' && isAcademic && (
                        <AssessmentTab
                            project={project}
                            period={utsPeriod}
                            submission={utsSubmission}
                            isMember={isMember}
                            isLeader={isLeader}
                            isLecturer={isLecturerUser}
                            type="uts"
                        />
                    )}

                    {activeTab === 'uas' && isAcademic && (
                        <AssessmentTab
                            project={project}
                            period={uasPeriod}
                            submission={uasSubmission}
                            isMember={isMember}
                            isLeader={isLeader}
                            isLecturer={isLecturerUser}
                            type="uas"
                        />
                    )}

                    {activeTab === 'documents' && (
                        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Download className="size-5 text-blue-600" />
                                        <span>Repositori Dokumen Proyek & Berkas Evaluasi</span>
                                    </h3>
                                </div>

                                {isAcademic && (isMember || isLeader) && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('uts')}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 hover:border-slate-400 text-slate-800 hover:text-slate-900 text-xs font-bold transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
                                        >
                                            <Upload className="size-3.5 text-blue-600" />
                                            <span>Unggah di Snapshot UTS</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('uas')}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
                                        >
                                            <Upload className="size-3.5" />
                                            <span>Unggah di Snapshot UAS</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {allDocuments.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center">
                                    <div className="size-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3">
                                        <FileText className="size-6" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900">Belum Ada Berkas yang Diunggah</h4>
                                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                                        Berkas laporan (PDF), slide presentasi (PPTX), dan dokumen pendukung proyek diunggah melalui sesi evaluasi semester.
                                    </p>
                                    {isAcademic && (isMember || isLeader) && (
                                        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('uts')}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 hover:border-slate-400 text-slate-800 hover:text-slate-900 text-xs font-bold transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
                                            >
                                                <GraduationCap className="size-4 text-blue-600" />
                                                <span>Buka Snapshot UTS</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('uas')}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
                                            >
                                                <Award className="size-4" />
                                                <span>Buka Snapshot UAS</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {allDocuments.map((doc: any) => (
                                        <a
                                            key={doc.id}
                                            href={`/storage/${doc.file_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 flex items-center justify-between text-xs transition-all duration-200 shadow-2xs hover:shadow-xs"
                                        >
                                            <div className="flex items-center gap-2.5 truncate">
                                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                                    <FileText className="size-4.5 shrink-0" />
                                                </div>
                                                <div className="truncate">
                                                    <span className="font-bold text-slate-800 block truncate">{doc.title}</span>
                                                    <span className="text-[10px] text-slate-400">{Math.round(doc.file_size / 1024)} KB</span>
                                                </div>
                                            </div>
                                            <Download className="size-4 text-slate-400 hover:text-blue-600 transition" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="flex flex-col gap-6" id="recruitment-section">
                            {/* Members Grid */}
                            <div className="glass-card rounded-2xl p-6 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <Users className="size-5 text-blue-600" />
                                            <span>Anggota Tim Proyek ({teamMembers.length} Orang)</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Kapasitas aktif: {activeMembersCount} dari maksimal {maxQuota} anggota
                                        </p>
                                    </div>
                                    {isLeader && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddMemberModal(true)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition cursor-pointer shadow-xs"
                                        >
                                            <UserPlus className="size-3.5" />
                                            <span>Tambah Anggota Langsung</span>
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {teamMembers.map((m: any) => (
                                        <div key={m.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-900 truncate pr-2">{m.user?.name}</span>
                                                    {m.permission === 'leader' || m.user_id === project.leader_id ? (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                                                            Ketua Tim
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-200/60 shrink-0">
                                                            Anggota
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-blue-600 font-semibold">{m.role_name || 'Kolaborator Proyek'}</span>
                                                <span className="text-[11px] text-slate-400 truncate">{m.user?.email}</span>
                                            </div>

                                            {/* Leader Actions on Team Members */}
                                            {isLeader && m.permission !== 'leader' && m.user_id !== project.leader_id && (
                                                <div className="flex items-center gap-2 pt-2.5 border-t border-slate-200/80">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingMember(m);
                                                            setNewMemberRole(m.role_name || '');
                                                        }}
                                                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
                                                    >
                                                        <Edit3 className="size-3 text-slate-500" />
                                                        <span>Edit Peran</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRemovingMember(m)}
                                                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[11px] font-semibold text-rose-700 transition cursor-pointer shadow-2xs"
                                                    >
                                                        <UserMinus className="size-3 text-rose-600" />
                                                        <span>Keluarkan</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Open Recruitment Roles & Join Team Section */}
                            {project.status === 'recruiting' && (
                                <div id="recruitment-section" className="glass-card rounded-2xl p-6 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                                <Briefcase className="size-5 text-blue-600" />
                                                <span>{hasOpenRecruitment ? 'Rekrutmen Terbuka & Posisi Tim' : 'Rekrutmen Tim (Saat Ini Ditutup)'}</span>
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 self-start">
                                            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                                                isQuotaFull
                                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                    : !hasOpenRecruitment
                                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                    : project.has_capacity
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                {isQuotaFull
                                                    ? 'Rekrutmen Ditutup (Kuota Penuh)'
                                                    : !hasOpenRecruitment
                                                    ? 'Rekrutmen Ditutup'
                                                    : project.has_capacity
                                                    ? 'Rekrutmen Terbuka • Kuota Tersedia'
                                                    : 'Kapasitas Penuh'}
                                            </span>
                                            {isLeader && !['team_locked', 'workspace_activated'].includes(project.formation_status || '') && (
                                                <button
                                                    type="button"
                                                    onClick={() => !isQuotaFull && handleToggleRecruitment(hasOpenRecruitment ? 'closed' : 'open')}
                                                    disabled={togglingRecruitment || isQuotaFull}
                                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 shadow-2xs ${
                                                        isQuotaFull
                                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                                            : hasOpenRecruitment
                                                            ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300 hover:border-slate-400 cursor-pointer'
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 cursor-pointer'
                                                    }`}
                                                    title={isQuotaFull ? 'Kuota tim sudah penuh (rekrutmen dinonaktifkan)' : undefined}
                                                >
                                                    {togglingRecruitment
                                                        ? 'Memproses...'
                                                        : isQuotaFull
                                                        ? 'Kuota Penuh'
                                                        : hasOpenRecruitment
                                                        ? 'Tutup Rekrutmen'
                                                        : 'Buka Rekrutmen'}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {!hasOpenRecruitment && !isLeader && (
                                        <div className="mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                                            {isQuotaFull ? 'Kuota anggota tim ini telah terpenuhi.' : 'Rekrutmen anggota saat ini ditutup oleh ketua tim.'}
                                        </div>
                                    )}

                                    {myApplication && (
                                        <div className={`mb-4 p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                                            hasActiveApplication
                                                ? 'bg-blue-50 border-blue-200 text-blue-900'
                                                : 'bg-slate-50 border-slate-200 text-slate-700'
                                        }`}>
                                            <div>
                                                <strong className="block">
                                                    Status Lamaran Kamu:{' '}
                                                    {myApplication.status === 'pending' || myApplication.status === 'under_review' || myApplication.status === 'submitted'
                                                        ? 'Menunggu Persetujuan Ketua Tim'
                                                        : myApplication.status === 'accepted'
                                                        ? 'Diterima'
                                                        : myApplication.status === 'rejected'
                                                        ? 'Ditolak'
                                                        : myApplication.status}
                                                </strong>
                                                <span>Posisi yang dilamar: {myApplication.role?.name || 'Anggota Tim'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {!isMember && !isLecturerUser && !hasActiveApplication && hasOpenRecruitment && eligibility && !eligibility.eligible && eligibility.reason && (
                                        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                                            <AlertCircle className="size-4 text-rose-600 mt-0.5 shrink-0" />
                                            <span>{eligibility.reason}</span>
                                        </div>
                                    )}

                                    {project.team?.recruitment?.roles && project.team.recruitment.roles.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {project.team.recruitment.roles.map((role: any) => (
                                                <div
                                                    key={role.id}
                                                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                >
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-900">{role.name}</h4>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                                            Kebutuhan: {role.slots || 1} posisi • {role.requirements || role.description || 'Keahlian teknis relevan dengan proyek'}
                                                        </p>
                                                    </div>

                                                    {!isMember && !isLecturerUser && !hasActiveApplication && hasOpenRecruitment && project.has_capacity && eligibility?.eligible !== false && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setApplyingRole(role)}
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                                                        >
                                                            <Send className="size-3" />
                                                            <span>Lamar Posisi Ini</span>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <p className="text-xs text-slate-600">
                                                {hasOpenRecruitment
                                                    ? 'Tim ini membuka pendaftaran anggota pengembang baru.'
                                                    : 'Belum ada posisi terbuka saat ini.'}
                                            </p>
                                            {!isMember && !isLecturerUser && !hasActiveApplication && hasOpenRecruitment && project.has_capacity && eligibility?.eligible !== false && (
                                                <button
                                                    type="button"
                                                    onClick={() => setApplyingRole({ id: null, name: 'Anggota Tim Pengembang' })}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                                                >
                                                    <Send className="size-3" />
                                                    <span>Lamar / Ajukan Bergabung</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Leader Incoming Applications */}
                            {isLeader && (
                                <div id="applications-section" className="glass-card rounded-2xl p-6 shadow-xs">
                                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <UserCheck className="size-4 text-blue-600" />
                                        <span>Pengajuan Bergabung Pelamar ({applications.length})</span>
                                    </h4>

                                    {applications.length === 0 ? (
                                        <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                                            Belum ada mahasiswa yang mengajukan diri untuk bergabung ke proyek ini.
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {applications.map((app: any) => (
                                                <div
                                                    key={app.id}
                                                    className={`p-4 rounded-xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                        app.status === 'accepted'
                                                            ? 'bg-blue-50/40 border-blue-200'
                                                            : app.status === 'rejected'
                                                            ? 'bg-slate-50 border-slate-200 opacity-75'
                                                            : 'bg-white border-slate-200'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-900">{app.user?.name}</span>
                                                            <span className="text-xs text-slate-500">({app.user?.email})</span>
                                                            <span
                                                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                                                                    app.status === 'accepted'
                                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                        : app.status === 'rejected'
                                                                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                                        : app.status === 'withdrawn'
                                                                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                                                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                                                }`}
                                                            >
                                                                {app.status === 'accepted' ? (
                                                                    <>
                                                                        <Check className="size-3 text-blue-600" />
                                                                        <span>Resmi Diterima</span>
                                                                    </>
                                                                ) : app.status === 'rejected' ? (
                                                                    'Ditolak'
                                                                ) : app.status === 'withdrawn' ? (
                                                                    'Ditarik'
                                                                ) : (
                                                                    'Menunggu Persetujuan'
                                                                )}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-blue-600 block mt-0.5 font-medium">Posisi: {app.role?.name || 'Anggota'}</span>
                                                        {app.message && (
                                                            <p className="text-xs text-slate-600 italic mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                                "{app.message}"
                                                            </p>
                                                        )}
                                                    </div>

                                                    {(app.status === 'pending' || app.status === 'under_review' || app.status === 'submitted') ? (
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDecideApplication(app.id, 'reject')}
                                                                disabled={decidingId === app.id}
                                                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer disabled:opacity-50"
                                                            >
                                                                Tolak
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDecideApplication(app.id, 'accept')}
                                                                disabled={decidingId === app.id}
                                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50"
                                                            >
                                                                {decidingId === app.id ? (
                                                                    <span>Memproses...</span>
                                                                ) : (
                                                                    <>
                                                                        <Check className="size-3.5" />
                                                                        <span>Terima Jadi Anggota</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : app.status === 'accepted' ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shrink-0">
                                                            <CheckCircle2 className="size-3.5 text-blue-600" />
                                                            <span>Anggota Tim Aktif</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'discussion' && (
                        <div id="discussion-section">
                            <DiscussionForum
                                projectId={project.id ?? project.slug}
                                discussions={discussions}
                                currentUserId={user?.id}
                                isLeader={isLeader}
                                isMember={isMember || isLeader}
                                isLecturer={isLecturerUser}
                            />
                        </div>
                    )}

                    {activeTab === 'lecturer_review' && isAcademic && (
                        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <GraduationCap className="size-5 text-blue-600" />
                                <span>Riwayat Bimbingan & Arahan Dosen Pengampu</span>
                            </h3>

                            {guidances.length === 0 && !livingProposal?.current_version?.review_notes ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    Belum ada catatan bimbingan dosen yang tercatat untuk proyek ini.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {livingProposal?.current_version?.review_notes && (
                                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-blue-900">Ulasan Living Proposal Versi {proposalVersion}</span>
                                                <span className="text-slate-400">Catatan Resmi</span>
                                            </div>
                                            <p className="text-xs text-slate-800 whitespace-pre-line mt-1">{livingProposal.current_version.review_notes}</p>
                                        </div>
                                    )}

                                    {guidances.map((g: any) => (
                                        <div key={g.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-900">{g.title}</span>
                                                <span className="text-slate-400">{g.created_at ? new Date(g.created_at).toLocaleDateString() : ''}</span>
                                            </div>
                                            <p className="text-xs text-slate-700 mt-1">{g.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'evaluation' && isAcademic && (
                        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="size-5 text-blue-600" />
                                <span>Rekapitulasi Nilai & Evaluasi Akademik Capstone</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Evaluasi Tengah Semester (UTS - 40%)</span>
                                        <span className="text-2xl font-black text-blue-600">
                                            {utsSubmission?.total_score ? `${utsSubmission.total_score} (${utsSubmission.final_grade})` : 'Belum Dinilai'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 mt-2">
                                        Status: {utsSubmission?.status || 'Belum Ada Penyerahan'}
                                    </span>
                                </div>

                                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Evaluasi Akhir Semester (UAS - 60%)</span>
                                        <span className="text-2xl font-black text-blue-600">
                                            {uasSubmission?.total_score ? `${uasSubmission.total_score} (${uasSubmission.final_grade})` : 'Belum Dinilai'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 mt-2">
                                        Status: {uasSubmission?.status || 'Belum Ada Penyerahan'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'archive' && (
                        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Archive className="size-5 text-blue-600" />
                                <span>Arsip Portofolio Capstone & Sertifikat Mahasiswa</span>
                            </h3>

                            {project.status === 'completed' ? (
                                <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-200 flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="size-5 text-blue-600" />
                                        <h4 className="text-sm font-bold text-slate-900">
                                            Proyek Capstone Resmi Dinyatakan Selesai (Completed)!
                                        </h4>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                        Seluruh dokumen (Living Proposal, Riwayat Revisi, Snapshot UTS & UAS) telah diarsipkan permanen. Pembatasan Rule 1 bagi seluruh anggota tim telah resmi dilepas.
                                    </p>

                                    {achievements.length > 0 && (
                                        <div className="pt-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                                                Sertifikat Portofolio Terverifikasi:
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {achievements.map((ach: any) => (
                                                    <div key={ach.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                                                        <div>
                                                            <span className="font-bold text-slate-900 block">{ach.user?.name}</span>
                                                            <span className="text-[10px] text-blue-600 font-semibold">Portofolio Terverifikasi Dosen</span>
                                                        </div>
                                                        <Award className="size-4 text-blue-600" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    Proyek masih aktif berjalan. Arsip dan sertifikat portofolio otomatis diterbitkan setelah evaluasi UAS selesai.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* APPLY ROLE MODAL */}
            {applyingRole && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Ajukan Lamaran Tim
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Mengajukan diri untuk bergabung ke proyek <strong className="text-slate-800 font-semibold">{project.title}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setApplyingRole(null)}
                                className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleApply} className="p-5 sm:p-6 flex flex-col gap-4">
                            {project.team?.recruitment?.roles && project.team.recruitment.roles.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Pilih Posisi / Peran
                                    </label>
                                    <select
                                        value={applyingRole?.id || ''}
                                        onChange={(e) => {
                                            const selected = project.team.recruitment.roles.find(
                                                (r: any) => String(r.id) === e.target.value
                                            );
                                            if (selected) setApplyingRole(selected);
                                        }}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                    >
                                        {project.team.recruitment.roles.map((r: any) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Pesan Singkat & Portofolio Relevan <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                    placeholder="Jelaskan keahlian teknis, pengalaman proyek sebelumnya, atau kontribusi yang ingin Anda berikan..."
                                    required
                                    rows={4}
                                    className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs resize-none leading-relaxed"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-4 bg-slate-50/80">
                                <button
                                    type="button"
                                    onClick={() => setApplyingRole(null)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold transition disabled:opacity-50 shadow-xs cursor-pointer"
                                >
                                    <Send className="size-3.5" />
                                    <span>{submitting ? 'Mengirim...' : 'Kirim Lamaran'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DOSEN GUIDANCE / ARAHAN BIMBINGAN MODAL */}
            {showGuidanceModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-surface bg-white/95 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                                    Portal Dosen Pengampu & Pembimbing
                                </span>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Beri Arahan / Bimbingan Proyek
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Terbitkan catatan bimbingan atau instruksi teknis untuk tim proyek <strong>{project.title}</strong>.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowGuidanceModal(false)}
                                className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSendGuidance} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Tipe Arahan Bimbingan
                                </label>
                                <select
                                    value={guidanceType}
                                    onChange={(e: any) => setGuidanceType(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="guidance">Bimbingan Teknis & Arahan Proyek</option>
                                    <option value="milestone_feedback">Feedback Milestone & Progres Sprint</option>
                                    <option value="announcement">Instruksi / Pengumuman Dosen</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Judul / Topik Bimbingan *
                                </label>
                                <input
                                    type="text"
                                    value={guidanceTitle}
                                    onChange={(e) => setGuidanceTitle(e.target.value)}
                                    placeholder="Contoh: Arahan Perbaikan Living Proposal & Target UTS"
                                    required
                                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Uraian Arahan Bimbingan Lengkap *
                                </label>
                                <textarea
                                    value={guidanceContent}
                                    onChange={(e) => setGuidanceContent(e.target.value)}
                                    placeholder="Tuliskan masukan perbaikan teknis, catatan Living Proposal, atau arahan persiapan kompetisi..."
                                    required
                                    rows={5}
                                    className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none leading-relaxed"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowGuidanceModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingGuidance}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    <Send className="size-3.5" />
                                    <span>{submittingGuidance ? 'Menerbitkan...' : 'Terbitkan Arahan'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Sukses Penerimaan Anggota Baru */}
            {acceptedModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Background Decorative Glow */}
                        <div className="absolute -top-16 -left-16 w-36 h-36 bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />

                        {/* Top Close Button */}
                        <button
                            type="button"
                            onClick={() => setAcceptedModalData(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        {/* Icon Header */}
                        <div className="mx-auto size-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
                            <Sparkles className="size-8" />
                        </div>

                        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                            Anggota Baru Resmi Bergabung!
                        </h3>

                        {/* Applicant Profile Card */}
                        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left flex items-center gap-3.5">
                            <div className="size-12 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
                                {acceptedModalData.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                    {acceptedModalData.name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {acceptedModalData.email}
                                </p>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-700">
                                        {acceptedModalData.role}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        • Anggota Tim Aktif
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Checklist */}
                        <div className="mt-4 p-3 rounded-xl bg-blue-50/50 border border-blue-100/80 text-left text-[11px] text-slate-600 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-3.5 text-blue-600 shrink-0" />
                                <span>Akses Project Workspace & Papan Tugas telah diaktifkan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-3.5 text-blue-600 shrink-0" />
                                <span>Dapat berkolaborasi langsung dalam ruang Diskusi Tim</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setAcceptedModalData(null);
                                    setActiveTab('discussion');
                                    window.setTimeout(() => {
                                        document.getElementById('discussion-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 150);
                                }}
                                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <MessageSquare className="size-3.5" />
                                <span>Buka Diskusi Tim</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAcceptedModalData(null)}
                                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Ajukan Formasi Tim ke Dosen */}
            {showSubmitFormationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setShowSubmitFormationModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-5">
                            <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
                                <Send className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Ajukan Formasi Tim ke Dosen
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Kirim susunan tim untuk evaluasi dan persetujuan dosen pengampu.
                                </p>
                            </div>
                        </div>

                        {/* Detail Info Card */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 mb-4 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Proyek</span>
                                <span className="font-bold text-slate-900 text-right">{project.title}</span>
                            </div>
                            {academicClass && (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Kelas</span>
                                    <span className="font-semibold text-slate-800">{academicClass.name} ({academicClass.code})</span>
                                </div>
                            )}
                            {academicClass?.lecturer && (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Dosen Pengampu</span>
                                    <span className="font-bold text-blue-600">{academicClass.lecturer.name}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Jumlah Anggota</span>
                                <span className="font-bold text-slate-900">
                                    {activeMembersCount} / {maxQuota} Orang <span className="text-emerald-600 font-semibold">(Kuota Terpenuhi)</span>
                                </span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800 leading-relaxed flex items-start gap-2.5 mb-5">
                            <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>
                                Setelah diajukan, status proyek berpindah ke tahap <strong>Evaluasi Dosen</strong>. Formasi anggota akan dikunci sementara hingga dosen memberikan keputusan persetujuan.
                            </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowSubmitFormationModal(false)}
                                disabled={submittingFormation}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirmSubmitFormation}
                                disabled={submittingFormation}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <Send className="size-3.5" />
                                <span>{submittingFormation ? 'Mengajukan...' : 'Ya, Ajukan ke Dosen'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Buka Workspace Proyek */}
            {showActivateTeamModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setShowActivateTeamModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
                                <UserCheck className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Konfirmasi & Buka Workspace
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowActivateTeamModal(false)}
                                disabled={lifecycleProcessing}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirmActivateTeam}
                                disabled={lifecycleProcessing}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <span>{lifecycleProcessing ? 'Mengaktifkan...' : 'Aktifkan Sekarang'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Kelola & Edit Proyek (Leader CRUD) */}
            {showEditProjectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center">
                                    <Settings className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                                        Kelola & Pengaturan Proyek
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Kelola rincian proyek, linimasa progres, living proposal, serta pengaturan tim.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditProjectModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setEditProjectTab('info')}
                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                    editProjectTab === 'info'
                                        ? 'bg-white text-blue-700 border-slate-200 shadow-2xs'
                                        : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/60'
                                }`}
                            >
                                Informasi Utama
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditProjectTab('timeline')}
                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                    editProjectTab === 'timeline'
                                        ? 'bg-white text-blue-700 border-slate-200 shadow-2xs'
                                        : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/60'
                                }`}
                            >
                                Status, Progres & Linimasa
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditProjectTab('proposal')}
                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                    editProjectTab === 'proposal'
                                        ? 'bg-white text-blue-700 border-slate-200 shadow-2xs'
                                        : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/60'
                                }`}
                            >
                                Living Proposal
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditProjectTab('danger')}
                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                    editProjectTab === 'danger'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
                                        : 'text-rose-600 border-transparent hover:text-rose-800 hover:bg-rose-50/50'
                                }`}
                            >
                                Zona Berbahaya
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSaveProject} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {editProjectTab === 'info' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Judul Proyek <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={projectForm.title}
                                                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                placeholder="Contoh: AgriTani IoT Platform"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Nama Tim Proyek
                                            </label>
                                            <input
                                                type="text"
                                                value={projectForm.team_name}
                                                onChange={(e) => setProjectForm({ ...projectForm, team_name: e.target.value })}
                                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                placeholder="Contoh: Tim Inovasi AgriTani"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Kategori
                                            </label>
                                            <select
                                                value={projectForm.category}
                                                onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            >
                                                <option value="capstone">Capstone Project</option>
                                                <option value="academic">Tugas Akhir / Skripsi</option>
                                                <option value="independent">Proyek Mandiri</option>
                                                <option value="competition">Kompetisi</option>
                                                <option value="research">Riset & Penelitian</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Tingkat Kesulitan
                                            </label>
                                            <select
                                                value={projectForm.difficulty}
                                                onChange={(e) => setProjectForm({ ...projectForm, difficulty: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            >
                                                <option value="beginner">Pemula (Beginner)</option>
                                                <option value="intermediate">Menengah (Intermediate)</option>
                                                <option value="advanced">Lanjutan (Advanced)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Visibilitas
                                            </label>
                                            <select
                                                value={projectForm.visibility}
                                                onChange={(e) => setProjectForm({ ...projectForm, visibility: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            >
                                                <option value="public">Publik (Semua Kampus)</option>
                                                <option value="campus">Internal Kampus</option>
                                                <option value="class">Khusus Kelas</option>
                                                <option value="private">Privat (Hanya Tim)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Ringkasan Singkat (Short Description)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={projectForm.short_description}
                                            onChange={(e) => setProjectForm({ ...projectForm, short_description: e.target.value })}
                                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="Ringkasan 1-2 kalimat tentang proyek..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Deskripsi Lengkap
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={projectForm.description}
                                            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="Jelaskan gambaran umum, latar belakang, dan cakupan sistem..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Teknologi & Tech Stack (Pisahkan dengan tanda koma)
                                        </label>
                                        <input
                                            type="text"
                                            value={projectForm.tech_stack_input}
                                            onChange={(e) => setProjectForm({ ...projectForm, tech_stack_input: e.target.value })}
                                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="Contoh: Laravel, React, Tailwind CSS, PostgreSQL, Docker"
                                        />
                                    </div>
                                </div>
                            )}

                            {editProjectTab === 'timeline' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Status Keberlangsungan Proyek
                                            </label>
                                            <select
                                                value={projectForm.status}
                                                onChange={(e) => {
                                                    const newStatus = e.target.value;
                                                    setProjectForm({
                                                        ...projectForm,
                                                        status: newStatus,
                                                        progress: newStatus === 'completed' ? 100 : projectForm.progress,
                                                    });
                                                }}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            >
                                                <option value="recruiting">Rekrutmen Terbuka (Recruiting)</option>
                                                <option value="in_progress">Sedang Berjalan (In Progress)</option>
                                                <option value="completed">Selesai (Completed)</option>
                                                <option value="archived">Diarsipkan (Archived)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-xs font-bold text-slate-700">
                                                    Progres Pengerjaan Proyek
                                                </label>
                                                <span className="text-xs font-black text-blue-600 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                                                    {projectForm.progress}%
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={projectForm.progress}
                                                onChange={(e) => setProjectForm({ ...projectForm, progress: parseInt(e.target.value) || 0 })}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Tanggal Mulai
                                            </label>
                                            <input
                                                type="date"
                                                value={projectForm.starts_on}
                                                onChange={(e) => setProjectForm({ ...projectForm, starts_on: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Target Penyelesaian
                                            </label>
                                            <input
                                                type="date"
                                                value={projectForm.target_completion_on}
                                                onChange={(e) => setProjectForm({ ...projectForm, target_completion_on: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Batas Akhir Rekrutmen
                                            </label>
                                            <input
                                                type="date"
                                                value={projectForm.recruitment_deadline}
                                                onChange={(e) => setProjectForm({ ...projectForm, recruitment_deadline: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Jam Kerja / Minggu
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="60"
                                                value={projectForm.expected_weekly_hours}
                                                onChange={(e) => setProjectForm({ ...projectForm, expected_weekly_hours: parseInt(e.target.value) || 10 })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Kuota Min. Anggota
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="15"
                                                value={projectForm.min_team_size}
                                                onChange={(e) => setProjectForm({ ...projectForm, min_team_size: parseInt(e.target.value) || 2 })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Kuota Maks. Anggota
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="20"
                                                value={projectForm.max_team_size}
                                                onChange={(e) => setProjectForm({ ...projectForm, max_team_size: parseInt(e.target.value) || 4 })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                URL Repositori GitHub / GitLab
                                            </label>
                                            <input
                                                type="url"
                                                value={projectForm.repository_url}
                                                onChange={(e) => setProjectForm({ ...projectForm, repository_url: e.target.value })}
                                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                placeholder="https://github.com/username/project"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                URL Demo / Showcase
                                            </label>
                                            <input
                                                type="url"
                                                value={projectForm.demo_url}
                                                onChange={(e) => setProjectForm({ ...projectForm, demo_url: e.target.value })}
                                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                placeholder="https://demo-project.example.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editProjectTab === 'proposal' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Rumusan Masalah (Problem Statement)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={projectForm.problem_statement}
                                            onChange={(e) => setProjectForm({ ...projectForm, problem_statement: e.target.value })}
                                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="Deskripsikan masalah riil yang dihadapi oleh stakeholder/pengguna..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Tujuan Proyek (Objectives)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={projectForm.objectives}
                                            onChange={(e) => setProjectForm({ ...projectForm, objectives: e.target.value })}
                                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="Uraikan target capaian dan fungsi utama sistem yang akan dibangun..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Solusi yang Diajukan (Proposed Solution)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={projectForm.proposed_solution}
                                            onChange={(e) => setProjectForm({ ...projectForm, proposed_solution: e.target.value })}
                                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="Jelaskan arsitektur teknis atau kebaruan solusi yang ditawarkan..."
                                        />
                                    </div>
                                </div>
                            )}

                            {editProjectTab === 'danger' && (
                                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="size-6 text-rose-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-rose-950">
                                                Zona Berbahaya: Pembubaran Proyek
                                            </h4>
                                            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                                                Membubarkan proyek adalah aksi destruktif permanen. Seluruh pendaftaran anggota, undangan, berkas proposal, dan catatan tugas di workspace tim akan dihapus atau dinonaktifkan.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-rose-200 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setShowDisbandModal(true)}
                                            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Trash2 className="size-3.5" />
                                            <span>Bubarkan & Hapus Proyek Ini</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {editProjectTab !== 'danger' && (
                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditProjectModal(false)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingProject}
                                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        <Check className="size-3.5" />
                                        <span>{savingProject ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Pembubaran Proyek (Danger Zone Confirmation) */}
            {showDisbandModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setShowDisbandModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="size-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Bubarkan Proyek?
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tindakan ini permanen dan tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Seluruh riwayat pengerjaan proyek <strong className="text-slate-900">"{project.title}"</strong>, tim terkait, dan lamaran anggota akan dibatalkan/dihapus dari sistem.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Ketik <span className="text-rose-600">BUBARKAN</span> untuk konfirmasi:
                            </label>
                            <input
                                type="text"
                                value={disbandConfirmation}
                                onChange={(e) => setDisbandConfirmation(e.target.value)}
                                placeholder="BUBARKAN"
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowDisbandModal(false)}
                                disabled={disbanding}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDisbandProject}
                                disabled={disbanding || (disbandConfirmation !== project.title && disbandConfirmation.toUpperCase() !== 'BUBARKAN')}
                                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 className="size-3.5" />
                                <span>{disbanding ? 'Membubarkan...' : 'Ya, Bubarkan Proyek'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Anggota Langsung (Leader Member Management) */}
            {showAddMemberModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setShowAddMemberModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-5">
                            <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
                                <UserPlus className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Tambah Anggota Tim Langsung
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pilih mahasiswa untuk bergabung sebagai anggota tim proyek Anda.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Pilih Mahasiswa <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    value={addMemberUserId}
                                    onChange={(e) => setAddMemberUserId(e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">-- Pilih Mahasiswa Tersedia --</option>
                                    {(classStudents || [])
                                        .filter((cs: any) => !cs.is_member && cs.id !== project.leader_id)
                                        .map((cs: any) => (
                                            <option key={cs.id} value={cs.id} disabled={isAcademic && cs.has_active_project}>
                                                {cs.name} {cs.student_number ? `(${cs.student_number})` : `(${cs.email})`}
                                                {isAcademic && cs.has_active_project ? ' â€” [Sudah Ada Proyek]' : ' â€” [Tersedia]'}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Menampilkan mahasiswa yang belum tergabung dalam proyek aktif di kelas ini.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Peran / Spesialisasi dalam Tim
                                </label>
                                <input
                                    type="text"
                                    value={addMemberRole}
                                    onChange={(e) => setAddMemberRole(e.target.value)}
                                    placeholder="Contoh: Frontend Developer, UI/UX Designer"
                                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {['Frontend Developer', 'Backend Engineer', 'UI/UX Designer', 'Mobile Developer', 'QA Tester'].map((rolePreset) => (
                                        <button
                                            type="button"
                                            key={rolePreset}
                                            onClick={() => setAddMemberRole(rolePreset)}
                                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                                        >
                                            + {rolePreset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddMemberModal(false)}
                                    disabled={addingMember}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingMember || !addMemberUserId}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    <UserPlus className="size-3.5" />
                                    <span>{addingMember ? 'Menambahkan...' : 'Tambah ke Tim'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit Peran Anggota (Leader Member Management) */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setEditingMember(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
                                <Edit3 className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Edit Peran Anggota
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Perbarui spesialisasi atau tugas anggota tim.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateMemberRole} className="space-y-4">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                                <span className="text-slate-500 block">Mahasiswa:</span>
                                <strong className="text-slate-900 text-sm">{editingMember.user?.name}</strong>
                                <span className="text-slate-500 block text-[11px] mt-0.5">{editingMember.user?.email}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Nama Peran Baru <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newMemberRole}
                                    onChange={(e) => setNewMemberRole(e.target.value)}
                                    placeholder="Contoh: Fullstack Engineer, Data Analyst"
                                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {['Frontend Developer', 'Backend Engineer', 'Fullstack Developer', 'UI/UX Designer', 'Mobile Developer', 'DevOps & QA'].map((preset) => (
                                        <button
                                            type="button"
                                            key={preset}
                                            onClick={() => setNewMemberRole(preset)}
                                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingMember(null)}
                                    disabled={savingMemberRole}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingMemberRole || !newMemberRole.trim()}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    <Check className="size-3.5" />
                                    <span>{savingMemberRole ? 'Menyimpan...' : 'Simpan Peran'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Keluarkan Anggota (Leader Member Management) */}
            {removingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setRemovingMember(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="size-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0">
                                <UserMinus className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Keluarkan Anggota?
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Cabut keanggotaan mahasiswa dari tim proyek ini.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Apakah Anda yakin ingin mengeluarkan <strong className="text-slate-900">{removingMember.user?.name}</strong> ({removingMember.role_name || 'Anggota'}) dari tim proyek ini? Mahasiswa akan menerima pemberitahuan dan status keanggotaannya akan dibatalkan.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setRemovingMember(null)}
                                disabled={removingMemberLoading}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleRemoveMember}
                                disabled={removingMemberLoading}
                                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <UserMinus className="size-3.5" />
                                <span>{removingMemberLoading ? 'Mengeluarkan...' : 'Ya, Keluarkan'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* In-App Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                        toast.type === 'success'
                            ? 'bg-blue-600 text-white'
                            : toast.type === 'error'
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-800 text-blue-400'
                    }`}>
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="size-4.5" />
                        ) : toast.type === 'error' ? (
                            <AlertCircle className="size-4.5" />
                        ) : (
                            <Info className="size-4.5" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                        <p className="text-xs font-bold text-white leading-snug">{toast.message}</p>
                        {toast.submessage && (
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.submessage}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition -mr-1 -mt-1 cursor-pointer"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            )}
        </AppLayout>
    );
}
