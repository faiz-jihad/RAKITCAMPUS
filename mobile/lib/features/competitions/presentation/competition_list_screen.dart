import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../presentation/competition_controller.dart';
import '../models/competition_model.dart';

class CompetitionListScreen extends ConsumerStatefulWidget {
  const CompetitionListScreen({super.key});

  @override
  ConsumerState<CompetitionListScreen> createState() => _CompetitionListScreenState();
}

class _CompetitionListScreenState extends ConsumerState<CompetitionListScreen> {
  final _searchController = TextEditingController();
  String _selectedLevel = 'All';

  final List<String> _levels = ['All', 'National', 'Regional', 'Campus', 'International'];

  void _onFilterChanged() {
    ref.read(competitionListFilterProvider.notifier).setFilter(CompetitionFilter(
      level: _selectedLevel == 'All' ? null : _selectedLevel.toLowerCase(),
      search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
    ));
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final compAsync = ref.watch(competitionListFutureProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Kompetisi & Hackathon'),
      ),
      body: Column(
        children: [
          // Filter & Search Header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Cari kompetisi, lomba riset, atau hackathon...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _onFilterChanged();
                            },
                          )
                        : null,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  onSubmitted: (_) => _onFilterChanged(),
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _levels.map((lvl) {
                      final isSelected = _selectedLevel == lvl;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(lvl),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _selectedLevel = lvl);
                              _onFilterChanged();
                            }
                          },
                          selectedColor: AppTheme.primaryLight.withAlpha(51),
                          labelStyle: TextStyle(
                            color: isSelected ? AppTheme.primary : AppTheme.textMuted,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.normal,
                            fontSize: 13,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),

          // Competition List
          Expanded(
            child: compAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: AppTheme.danger),
                      const SizedBox(height: 12),
                      Text('Gagal memuat kompetisi: $err', textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref.refresh(competitionListFutureProvider),
                        child: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (competitions) {
                if (competitions.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.emoji_events_outlined, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 16),
                          const Text(
                            'Belum ada kompetisi yang sesuai',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Coba ganti filter atau kata kunci pencarian Anda.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(competitionListFutureProvider.future),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: competitions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final comp = competitions[index];
                      return _CompetitionCard(comp: comp);
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

class _CompetitionCard extends StatelessWidget {
  final CompetitionModel comp;

  const _CompetitionCard({required this.comp});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/competitions/${comp.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Text(
                          comp.level.toUpperCase(),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Colors.amber.shade900,
                          ),
                        ),
                      ),
                      if (comp.verificationStatus == 'verified') ...[
                        const SizedBox(width: 6),
                        const Icon(Icons.verified, size: 16, color: AppTheme.primary),
                      ],
                    ],
                  ),
                  if (comp.registrationDeadline != null)
                    Text(
                      'Deadline: ${comp.registrationDeadline!.split('T').first}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.danger),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                comp.title,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Penyelenggara: ${comp.organizer}',
                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              Text(
                comp.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, height: 1.4),
              ),
              const SizedBox(height: 12),
              const Divider(height: 1, color: AppTheme.border),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.group_outlined, size: 16, color: AppTheme.textMuted),
                      const SizedBox(width: 6),
                      Text(
                        'Tim: ${comp.minTeamMembers}-${comp.maxTeamMembers} Mahasiswa',
                        style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  const Text(
                    'Lihat Peluang →',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
