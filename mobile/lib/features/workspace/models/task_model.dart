class TaskModel {
  final int id;
  final String title;
  final String? description;
  final String status; // 'todo', 'in_progress', 'review', 'done'
  final String priority; // 'low', 'medium', 'high', 'urgent'
  final String? assigneeName;
  final String? dueDate;

  TaskModel({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    this.assigneeName,
    this.dueDate,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'] as int,
      title: json['title'] as String? ?? 'Untitled Task',
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'todo',
      priority: json['priority'] as String? ?? 'medium',
      assigneeName: json['assignee']?['name'] as String?,
      dueDate: json['due_date'] as String?,
    );
  }

  TaskModel copyWith({
    String? status,
  }) {
    return TaskModel(
      id: id,
      title: title,
      description: description,
      status: status ?? this.status,
      priority: priority,
      assigneeName: assigneeName,
      dueDate: dueDate,
    );
  }
}
