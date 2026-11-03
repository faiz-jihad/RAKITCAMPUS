import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/dio_client.dart';
import '../models/match_model.dart';

class MatchingRepository {
  final Dio _dio;

  MatchingRepository({Dio? dio}) : _dio = dio ?? DioClient.createDio();

  Future<List<MatchRecommendationModel>> getRecommendations({
    int? projectId,
    int? roleId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (projectId != null) queryParams['project_id'] = projectId;
      if (roleId != null) queryParams['recruitment_role_id'] = roleId;

      final response = await _dio.get(
        ApiConstants.recommendations,
        queryParameters: queryParams,
      );

      final List data = response.data['data'] as List? ?? [];
      return data.map((json) => MatchRecommendationModel.fromJson(json as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Failed to load matching candidates');
    }
  }

  Future<bool> sendInvitation({
    required int projectId,
    required int candidateId,
    int? roleId,
    String? message,
  }) async {
    try {
      await _dio.post(
        '/recruitment/invitations',
        data: {
          'project_id': projectId,
          'user_id': candidateId,
          'recruitment_role_id': roleId,
          'message': message,
        },
      );
      return true;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Gagal mengirimkan undangan kolaborasi');
    }
  }
}
