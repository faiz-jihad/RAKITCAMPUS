import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/workspace_repository.dart';
import '../models/task_model.dart';

final workspaceRepositoryProvider = Provider<WorkspaceRepository>((ref) {
  return WorkspaceRepository();
});

class WorkspaceState {
  final bool isLoading;
  final List<TaskModel> tasks;
  final String? error;

  const WorkspaceState({
    this.isLoading = false,
    this.tasks = const [],
    this.error,
  });

  WorkspaceState copyWith({
    bool? isLoading,
    List<TaskModel>? tasks,
    String? error,
  }) {
    return WorkspaceState(
      isLoading: isLoading ?? this.isLoading,
      tasks: tasks ?? this.tasks,
      error: error,
    );
  }
}

class WorkspaceController extends Notifier<WorkspaceState> {
  late final WorkspaceRepository _repository;

  @override
  WorkspaceState build() {
    _repository = ref.read(workspaceRepositoryProvider);
    Future.microtask(() => loadTasks(1));
    return const WorkspaceState(isLoading: true);
  }

  Future<void> loadTasks([int teamId = 1]) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final tasks = await _repository.getTasks(teamId);
      state = WorkspaceState(tasks: tasks, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> moveTask(int taskId, String newStatus, [int teamId = 1]) async {
    final originalTasks = state.tasks;
    state = state.copyWith(
      tasks: state.tasks.map((t) => t.id == taskId ? t.copyWith(status: newStatus) : t).toList(),
    );

    try {
      await _repository.updateTaskStatus(teamId: teamId, taskId: taskId, newStatus: newStatus);
    } catch (_) {
      state = state.copyWith(tasks: originalTasks);
    }
  }
}

final workspaceControllerProvider = NotifierProvider<WorkspaceController, WorkspaceState>(() {
  return WorkspaceController();
});
