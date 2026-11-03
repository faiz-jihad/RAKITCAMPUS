import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/project_repository.dart';
import '../models/project_model.dart';

final projectRepositoryProvider = Provider<ProjectRepository>((ref) {
  return ProjectRepository();
});

class ProjectFilter {
  final String? category;
  final String? search;

  const ProjectFilter({this.category, this.search});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProjectFilter &&
          runtimeType == other.runtimeType &&
          category == other.category &&
          search == other.search;

  @override
  int get hashCode => category.hashCode ^ search.hashCode;
}

class ProjectFilterNotifier extends Notifier<ProjectFilter> {
  @override
  ProjectFilter build() => const ProjectFilter();

  void setFilter(ProjectFilter filter) {
    state = filter;
  }
}

final projectListFilterProvider = NotifierProvider<ProjectFilterNotifier, ProjectFilter>(() {
  return ProjectFilterNotifier();
});

final projectListFutureProvider = FutureProvider.autoDispose<List<ProjectModel>>((ref) async {
  final repository = ref.watch(projectRepositoryProvider);
  final filter = ref.watch(projectListFilterProvider);
  return repository.getProjects(category: filter.category, search: filter.search);
});

final projectDetailFutureProvider = FutureProvider.autoDispose.family<ProjectModel, dynamic>((ref, id) async {
  final repository = ref.watch(projectRepositoryProvider);
  return repository.getProject(id);
});
