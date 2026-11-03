import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/dio_client.dart';
import '../models/task_model.dart';

class WorkspaceRepository {
  final Dio _dio;

  WorkspaceRepository({Dio? dio}) : _dio = dio ?? DioClient.createDio();

  Future<List<TaskModel>> getTasks(int teamId) async {
    try {
      final response = await _dio.get(ApiConstants.teamWorkspace(teamId));
      final Map<String, dynamic> data = response.data['data'] as Map<String, dynamic>? ?? {};

      List<TaskModel> allTasks = [];

      // Check if tasks are directly under team workspace or milestones
      if (data['tasks'] is List) {
        allTasks.addAll(
          (data['tasks'] as List).map((t) => TaskModel.fromJson(t as Map<String, dynamic>)),
        );
      } else if (data['milestones'] is List) {
        for (var m in data['milestones']) {
          if (m['tasks'] is List) {
            allTasks.addAll(
              (m['tasks'] as List).map((t) => TaskModel.fromJson(t as Map<String, dynamic>)),
            );
          }
        }
      }

      return allTasks;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Failed to load workspace tasks');
    }
  }

  Future<bool> updateTaskStatus({
    required int teamId,
    required int taskId,
    required String newStatus,
  }) async {
    try {
      await _dio.patch(
        ApiConstants.updateTaskStatus(teamId, taskId),
        data: {'status': newStatus},
      );
      return true;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Gagal mengubah status tugas');
    }
  }
}
