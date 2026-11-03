import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../presentation/matching_controller.dart';
import '../models/match_model.dart';

class MatchingScreen extends ConsumerWidget {
  const MatchingScreen({super.key});

  void _showInviteModal(BuildContext context, WidgetRef ref, MatchRecommendationModel candidate) {
    final messageController = TextEditingController();
    bool isSending = false;

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
                      'Undang ${candidate.name}',
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
                  'Kirimkan pesan ajakan kolaborasi proyek kepada kandidat.',
                  style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: messageController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Halo! Kami melihat profil dan keahlian Anda sangat cocok untuk proyek kami...',
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: isSending
                      ? null
                      : () async {
                          setModalState(() => isSending = true);
                          try {
                            final repo = ref.read(matchingRepositoryProvider);
                            await repo.sendInvitation(
                              projectId: 1, // Default project
                              candidateId: candidate.candidateId,
                              message: messageController.text.trim(),
                            );
                            if (ctx.mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  backgroundColor: AppTheme.success,
                                  content: Text('Undangan kolaborasi berhasil dikirimkan!'),
                                ),
                              );
                            }
                          } catch (e) {
                            setModalState(() => isSending = false);
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
                  child: isSending
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Kirim Undangan Kolaborasi'),
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
    final matchingAsync = ref.watch(matchingCandidatesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Matching Kolaborator'),
      ),
      body: Column(
        children: [
          // Banner explanation
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.blue.shade50,
            child: const Row(
              children: [
                Icon(Icons.auto_awesome, color: AppTheme.primary, size: 28),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Explainable Matching Engine',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.primaryDark),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Skor dihitung transparan dari keahlian teknis (40%), kesesuaian peran (25%), ketersediaan waktu (20%), dan minat (15%).',
                        style: TextStyle(fontSize: 12, color: AppTheme.textMuted, height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),

          Expanded(
            child: matchingAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: AppTheme.danger),
                      const SizedBox(height: 12),
                      Text('Gagal memuat rekomendasi: $err', textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref.refresh(matchingCandidatesProvider),
                        child: const Text('Muat Ulang'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (candidates) {
                if (candidates.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.person_search_outlined, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 16),
                          const Text(
                            'Belum ada rekomendasi yang tersedia',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Lengkapi keahlian pada profil Anda untuk meningkatkan kecocokan kolaborasi.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(matchingCandidatesProvider.future),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: candidates.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final candidate = candidates[index];
                      return _CandidateCard(
                        candidate: candidate,
                        onInvite: () => _showInviteModal(context, ref, candidate),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CandidateCard extends StatelessWidget {
  final MatchRecommendationModel candidate;
  final VoidCallback onInvite;

  const _CandidateCard({required this.candidate, required this.onInvite});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Avatar + Name + Match Score Badge
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppTheme.primaryLight,
                  child: Text(
                    candidate.name.substring(0, 1).toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        candidate.name,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${candidate.nim ?? "NIM -"} • ${candidate.major ?? "Politeknik Negeri Indramayu"}',
                        style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: candidate.totalScore >= 75 ? Colors.green.shade50 : Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: candidate.totalScore >= 75 ? Colors.green.shade200 : Colors.blue.shade200,
                    ),
                  ),
                  child: Text(
                    '${candidate.totalScore.toStringAsFixed(0)}% Match',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: candidate.totalScore >= 75 ? const Color(0xFF047857) : AppTheme.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Score Breakdown Bar
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  _BreakdownRow(label: 'Skill Match (40%)', score: candidate.breakdown.skillScore),
                  const SizedBox(height: 6),
                  _BreakdownRow(label: 'Role Fit (25%)', score: candidate.breakdown.roleScore),
                  const SizedBox(height: 6),
                  _BreakdownRow(label: 'Availability (20%)', score: candidate.breakdown.availabilityScore),
                  const SizedBox(height: 6),
                  _BreakdownRow(label: 'Interest (15%)', score: candidate.breakdown.interestScore),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Matched skills
            if (candidate.matchedSkills.isNotEmpty) ...[
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: candidate.matchedSkills.map((skill) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.green.shade200),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.check, size: 12, color: Color(0xFF047857)),
                        const SizedBox(width: 4),
                        Text(
                          skill,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF047857)),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
            ],

            Text(
              candidate.explanation,
              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 14),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.send_outlined, size: 16),
                label: const Text('Undang ke Proyek'),
                onPressed: onInvite,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BreakdownRow extends StatelessWidget {
  final String label;
  final double score;

  const _BreakdownRow({required this.label, required this.score});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 125,
          child: Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w500)),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (score / 100).clamp(0.0, 1.0),
              backgroundColor: const Color(0xFFE2E8F0),
              color: score >= 70 ? AppTheme.primary : AppTheme.warning,
              minHeight: 6,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          '${score.toStringAsFixed(0)}%',
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
        ),
      ],
    );
  }
}
