import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/auth_controller.dart';
import '../presentation/profile_controller.dart';
import '../models/profile_model.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _showEditProfileModal(BuildContext context, WidgetRef ref, ProfileModel profile) {
    final headlineController = TextEditingController(text: profile.headline ?? '');
    final bioController = TextEditingController(text: profile.bio ?? '');
    bool isSaving = false;

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
                    const Text('Edit Profil Mahasiswa', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: headlineController,
                  decoration: const InputDecoration(
                    labelText: 'Headline Profesional',
                    hintText: 'Contoh: Full Stack Developer | IoT Enthusiast',
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: bioController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Bio / Tentang Saya',
                    hintText: 'Tuliskan pengalaman, minat riset, dan tujuan kolaborasi...',
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: isSaving
                      ? null
                      : () async {
                          setModalState(() => isSaving = true);
                          try {
                            final repo = ref.read(profileRepositoryProvider);
                            await repo.updateProfile(
                              headline: headlineController.text.trim(),
                              bio: bioController.text.trim(),
                            );
                            if (ctx.mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  backgroundColor: AppTheme.success,
                                  content: Text('Profil berhasil diperbarui!'),
                                ),
                              );
                              ref.refresh(profileFutureProvider);
                            }
                          } catch (e) {
                            setModalState(() => isSaving = false);
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
                  child: isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Simpan Perubahan'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Konfirmasi Keluar'),
        content: const Text('Apakah Anda yakin ingin keluar dari akun RAKIT Campus?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileFutureProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Saya'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.danger),
            onPressed: () => _showLogoutDialog(context, ref),
          ),
        ],
      ),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppTheme.danger),
                const SizedBox(height: 12),
                Text('Gagal memuat profil: $err', textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.refresh(profileFutureProvider),
                  child: const Text('Muat Ulang'),
                ),
              ],
            ),
          ),
        ),
        data: (profile) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Profile Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 36,
                          backgroundColor: AppTheme.primary,
                          child: Text(
                            profile.name.isNotEmpty ? profile.name[0].toUpperCase() : 'M',
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          profile.name,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          profile.headline ?? 'Mahasiswa Politeknik Negeri Indramayu',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '${profile.nim ?? "NIM -"} • ${profile.major ?? "Teknik Informatika"}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primary),
                          ),
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.edit_outlined, size: 16),
                            label: const Text('Edit Profil'),
                            onPressed: () => _showEditProfileModal(context, ref, profile),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Bio Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Tentang Saya',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          profile.bio ?? 'Belum ada bio. Klik tombol edit profil untuk menambahkan cerita singkat Anda.',
                          style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary, height: 1.5),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Skills Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Keahlian & Kemampuan',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                            ),
                            Text(
                              '${profile.skills.length} Skill',
                              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (profile.skills.isEmpty)
                          const Text(
                            'Belum ada keahlian yang ditambahkan.',
                            style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                          )
                        else
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: profile.skills.map((skill) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppTheme.border),
                                ),
                                child: Text(
                                  '${skill.name}${skill.proficiency != null ? " (${skill.proficiency})" : ""}',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
                                ),
                              );
                            }).toList(),
                          ),
                      ],
                    ),
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
