import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/dio_client.dart';
import '../models/project_model.dart';

class ProjectRepository {
  final Dio _dio;

  ProjectRepository({Dio? dio}) : _dio = dio ?? DioClient.createDio();

  Future<List<ProjectModel>> getProjects({String? category, String? search}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (category != null && category.isNotEmpty && category != 'All') {
        queryParams['category'] = category.toLowerCase();
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await _dio.get(
        ApiConstants.projects,
        queryParameters: queryParams,
      );

      final List data = response.data['data'] as List? ?? [];
      return data.map((json) => ProjectModel.fromJson(json as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Failed to load projects');
    }
  }

  Future<ProjectModel> getProject(dynamic id) async {
    try {
      final response = await _dio.get(ApiConstants.projectDetail(id));
      final Map<String, dynamic> data = response.data['data'] as Map<String, dynamic>;
      return ProjectModel.fromJson(data);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Failed to load project details');
    }
  }

  Future<bool> applyToProject({
    required dynamic projectId,
    required int roleId,
    required String coverLetter,
  }) async {
    try {
      await _dio.post(
        ApiConstants.projectApply(projectId),
        data: {
          'recruitment_role_id': roleId,
          'cover_letter': coverLetter,
        },
      );
      return true;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Gagal mengajukan lamaran');
    }
  }
}
