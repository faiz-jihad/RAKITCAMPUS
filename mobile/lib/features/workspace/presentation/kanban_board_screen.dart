import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../presentation/workspace_controller.dart';
import '../models/task_model.dart';

class KanbanBoardScreen extends ConsumerStatefulWidget {
  final int teamId;

  const KanbanBoardScreen({super.key, this.teamId = 1});

  @override
  ConsumerState<KanbanBoardScreen> createState() => _KanbanBoardScreenState();
}

class _KanbanBoardScreenState extends ConsumerState<KanbanBoardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, String>> _columns = [
    {'key': 'todo', 'label': 'To Do'},
    {'key': 'in_progress', 'label': 'In Progress'},
    {'key': 'review', 'label': 'Review'},
    {'key': 'done', 'label': 'Completed'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _columns.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showStatusChangeDialog(TaskModel task) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Pindahkan: ${task.title}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: _columns.map((col) {
            final isCurrent = task.status == col['key'];
            return ListTile(
              title: Text(col['label']!),
              trailing: isCurrent ? const Icon(Icons.check, color: AppTheme.primary) : null,
              onTap: () {
                Navigator.pop(ctx);
                if (!isCurrent) {
                  ref.read(workspaceControllerProvider.notifier).moveTask(task.id, col['key']!, widget.teamId);
                }
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final workspaceState = ref.watch(workspaceControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Workspace & Kanban Tim'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textMuted,
          indicatorColor: AppTheme.primary,
          tabs: _columns.map((col) {
            final count = workspaceState.tasks.where((t) => t.status == col['key']).length;
            return Tab(
              child: Row(
                children: [
                  Text(col['label']!, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '$count',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
      body: workspaceState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : workspaceState.error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AppTheme.danger),
                        const SizedBox(height: 12),
                        Text('Gagal memuat tugas tim: ${workspaceState.error}', textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => ref.read(workspaceControllerProvider.notifier).loadTasks(widget.teamId),
                          child: const Text('Muat Ulang'),
                        ),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: _columns.map((col) {
                    final tasks = workspaceState.tasks.where((t) => t.status == col['key']).toList();
                    if (tasks.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.assignment_turned_in_outlined, size: 48, color: Colors.grey.shade300),
                            const SizedBox(height: 12),
                            Text(
                              'Tidak ada tugas di kolom ${col['label']}',
                              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                            ),
                          ],
                        ),
                      );
                    }

                    return RefreshIndicator(
                      onRefresh: () async => ref.read(workspaceControllerProvider.notifier).loadTasks(widget.teamId),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: tasks.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final task = tasks[index];
                          return Card(
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: task.priority == 'urgent' || task.priority == 'high'
                                              ? Colors.red.shade50
                                              : Colors.blue.shade50,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          task.priority.toUpperCase(),
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                            color: task.priority == 'urgent' || task.priority == 'high'
                                                ? AppTheme.danger
                                                : AppTheme.primary,
                                          ),
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.more_horiz),
                                        visualDensity: VisualDensity.compact,
                                        onPressed: () => _showStatusChangeDialog(task),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    task.title,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                  if (task.description != null && task.description!.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      task.description!,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                    ),
                                  ],
                                  const SizedBox(height: 12),
                                  const Divider(height: 1, color: AppTheme.border),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.person_outline, size: 14, color: AppTheme.textMuted),
                                          const SizedBox(width: 4),
                                          Text(
                                            task.assigneeName ?? 'Belum Ditugaskan',
                                            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                          ),
                                        ],
                                      ),
                                      if (task.dueDate != null)
                                        Text(
                                          task.dueDate!.split('T').first,
                                          style: const TextStyle(fontSize: 11, color: AppTheme.danger, fontWeight: FontWeight.w600),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  }).toList(),
                ),
    );
  }
}
