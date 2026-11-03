import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/matching_repository.dart';
import '../models/match_model.dart';

final matchingRepositoryProvider = Provider<MatchingRepository>((ref) {
  return MatchingRepository();
});

final matchingCandidatesProvider = FutureProvider.autoDispose<List<MatchRecommendationModel>>((ref) async {
  final repo = ref.watch(matchingRepositoryProvider);
  return repo.getRecommendations();
});
