import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/competition_repository.dart';
import '../models/competition_model.dart';

final competitionRepositoryProvider = Provider<CompetitionRepository>((ref) {
  return CompetitionRepository();
});

class CompetitionFilter {
  final String? level;
  final String? search;

  const CompetitionFilter({this.level, this.search});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CompetitionFilter &&
          runtimeType == other.runtimeType &&
          level == other.level &&
          search == other.search;

  @override
  int get hashCode => level.hashCode ^ search.hashCode;
}

class CompetitionFilterNotifier extends Notifier<CompetitionFilter> {
  @override
  CompetitionFilter build() => const CompetitionFilter();

  void setFilter(CompetitionFilter filter) {
    state = filter;
  }
}

final competitionListFilterProvider = NotifierProvider<CompetitionFilterNotifier, CompetitionFilter>(() {
  return CompetitionFilterNotifier();
});

final competitionListFutureProvider = FutureProvider.autoDispose<List<CompetitionModel>>((ref) async {
  final repository = ref.watch(competitionRepositoryProvider);
  final filter = ref.watch(competitionListFilterProvider);
  return repository.getCompetitions(level: filter.level, search: filter.search);
});

final competitionDetailFutureProvider = FutureProvider.autoDispose.family<CompetitionModel, dynamic>((ref, id) async {
  final repository = ref.watch(competitionRepositoryProvider);
  return repository.getCompetition(id);
});
