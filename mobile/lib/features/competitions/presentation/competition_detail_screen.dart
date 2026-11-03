import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../presentation/competition_controller.dart';

class CompetitionDetailScreen extends ConsumerWidget {
  final String competitionId;

  const CompetitionDetailScreen({super.key, required this.competitionId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final compAsync = ref.watch(competitionDetailFutureProvider(competitionId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail Kompetisi'),
      ),
      body: compAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppTheme.danger),
                const SizedBox(height: 12),
                Text('Gagal memuat detail kompetisi: $err', textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.refresh(competitionDetailFutureProvider(competitionId)),
                  child: const Text('Muat Ulang'),
                ),
              ],
            ),
          ),
        ),
        data: (comp) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Level & verification badge
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.amber.shade300),
                      ),
                      child: Text(
                        comp.level.toUpperCase(),
                        style: TextStyle(
                          color: Colors.amber.shade900,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    if (comp.verificationStatus == 'verified') ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.verified, size: 14, color: AppTheme.primary),
                            SizedBox(width: 4),
                            Text(
                              'Terverifikasi',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 12),

                // Title
                Text(
                  comp.title,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 6),
                Text(
                  'Penyelenggara: ${comp.organizer}',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 16),

                // Deadline banner
                if (comp.registrationDeadline != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.timer_outlined, color: AppTheme.danger, size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Batas Akhir Pendaftaran',
                                style: TextStyle(fontSize: 12, color: AppTheme.danger, fontWeight: FontWeight.w600),
                              ),
                              Text(
                                comp.registrationDeadline!.split('T').first,
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF991B1B)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 20),

                // Description
                const Text(
                  'Tentang Kompetisi',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 8),
                Text(
                  comp.description,
                  style: const TextStyle(fontSize: 14, height: 1.6, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 20),

                // Rules card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Ketentuan Tim & Partisipasi',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Icon(Icons.people_outline, size: 20, color: AppTheme.primary),
                          const SizedBox(width: 10),
                          Text('Ukuran Tim: ${comp.minTeamMembers} s/d ${comp.maxTeamMembers} Orang'),
                        ],
                      ),
                      if (comp.sourceUrl != null && comp.sourceUrl!.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(Icons.link, size: 20, color: AppTheme.primary),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                comp.sourceUrl!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppTheme.primary),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Action button: Cari Rekan Tim
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.group_add),
                    label: const Text('Cari Teman / Buat Tim Kompetisi'),
                    onPressed: () {
                      context.push('/matching');
                    },
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
