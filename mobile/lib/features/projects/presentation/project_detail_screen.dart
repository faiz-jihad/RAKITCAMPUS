import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../presentation/project_controller.dart';
import '../models/project_model.dart';

class ProjectDetailScreen extends ConsumerWidget {
  final String projectId;

  const ProjectDetailScreen({super.key, required this.projectId});

  void _showApplyModal(BuildContext context, WidgetRef ref, ProjectModel project, RecruitmentRoleModel role) {
    final coverLetterController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 24,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Lamar Posisi: ${role.roleName}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Kirimkan motivasi atau pengalaman relevan Anda untuk proyek "${project.title}".',
                  style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: coverLetterController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Tuliskan perkenalan singkat, portofolio relevan, dan alasan Anda tertarik...',
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          if (coverLetterController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Tuliskan pesan lamaran Anda.')),
                            );
                            return;
                          }

                          setModalState(() => isSubmitting = true);
                          try {
                            final repo = ref.read(projectRepositoryProvider);
                            await repo.applyToProject(
                              projectId: project.id,
                              roleId: role.id,
                              coverLetter: coverLetterController.text.trim(),
                            );
                            if (ctx.mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  backgroundColor: AppTheme.success,
                                  content: Text('Lamaran berhasil dikirimkan ke Project Leader!'),
                                ),
                              );
                              ref.refresh(projectDetailFutureProvider(project.id));
                            }
                          } catch (e) {
                            setModalState(() => isSubmitting = false);
                            if (ctx.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  backgroundColor: AppTheme.danger,
                                  content: Text(e.toString().replaceFirst('Exception: ', '')),
                                ),
                              );
                            }
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Kirim Lamaran'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectAsync = ref.watch(projectDetailFutureProvider(projectId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail Proyek'),
      ),
      body: projectAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppTheme.danger),
                const SizedBox(height: 12),
                Text('Gagal memuat detail proyek: $err', textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.refresh(projectDetailFutureProvider(projectId)),
                  child: const Text('Muat Ulang'),
                ),
              ],
            ),
          ),
        ),
        data: (project) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header tags
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryLight.withAlpha(38),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        project.category.toUpperCase(),
                        style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700, fontSize: 12),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        project.status.toUpperCase(),
                        style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.w700, fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Title
                Text(
                  project.title,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 8),
                Text(
                  'Kampus: ${project.campusName ?? "Politeknik Negeri Indramayu"} • Maksimal ${project.maxMembers} Anggota',
                  style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 16),
                const Divider(height: 1, color: AppTheme.border),
                const SizedBox(height: 16),

                // Description
                const Text(
                  'Deskripsi Proyek',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 8),
                Text(
                  project.description,
                  style: const TextStyle(fontSize: 14, height: 1.6, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 20),

                // Skills Required
                if (project.skills.isNotEmpty) ...[
                  const Text(
                    'Keahlian yang Dibutuhkan',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: project.skills.map((s) {
                      return Chip(
                        label: Text(s, style: const TextStyle(fontSize: 12)),
                        backgroundColor: const Color(0xFFF1F5F9),
                        side: BorderSide.none,
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                ],

                // Open Recruitment Roles
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Posisi & Rekrutmen Terbuka',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                    ),
                    Text(
                      '${project.openRoles.length} Peran',
                      style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                if (project.openRoles.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: const Text(
                      'Saat ini belum ada peran rekrutmen terbuka untuk proyek ini.',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                  )
                else
                  ...project.openRoles.map((role) {
                    final remaining = role.slotsTotal - role.slotsFilled;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                role.roleName,
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: remaining > 0 ? Colors.blue.shade50 : Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  remaining > 0 ? 'Sisa $remaining slot' : 'Penuh',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: remaining > 0 ? AppTheme.primary : AppTheme.textMuted,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (role.description != null && role.description!.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              role.description!,
                              style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                            ),
                          ],
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: remaining > 0 ? () => _showApplyModal(context, ref, project, role) : null,
                              child: Text(remaining > 0 ? 'Lamar Peran Ini' : 'Slot Penuh'),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),

                const SizedBox(height: 24),
                // Leader Card
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        radius: 20,
                        backgroundColor: AppTheme.primary,
                        child: Icon(Icons.person, color: Colors.white),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Inisiator & Project Leader',
                              style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                            ),
                            Text(
                              project.leaderName ?? 'Mahasiswa Polindra',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
