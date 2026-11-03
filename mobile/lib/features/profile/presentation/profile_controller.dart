import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/profile_repository.dart';
import '../models/profile_model.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository();
});

final profileFutureProvider = FutureProvider.autoDispose<ProfileModel>((ref) async {
  final repo = ref.watch(profileRepositoryProvider);
  return repo.getProfile();
});
