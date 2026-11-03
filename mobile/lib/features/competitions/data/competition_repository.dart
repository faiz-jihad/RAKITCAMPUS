import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/dio_client.dart';
import '../models/competition_model.dart';

class CompetitionRepository {
  final Dio _dio;

  CompetitionRepository({Dio? dio}) : _dio = dio ?? DioClient.createDio();

  Future<List<CompetitionModel>> getCompetitions({String? level, String? search}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (level != null && level.isNotEmpty && level != 'All') {
        queryParams['level'] = level.toLowerCase();
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await _dio.get(
        ApiConstants.competitions,
        queryParameters: queryParams,
      );

      final List data = response.data['data'] as List? ?? [];
      return data.map((json) => CompetitionModel.fromJson(json as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Failed to load competitions');
    }
  }

  Future<CompetitionModel> getCompetition(dynamic id) async {
    try {
      final response = await _dio.get(ApiConstants.competitionDetail(id));
      final Map<String, dynamic> data = response.data['data'] as Map<String, dynamic>;
      return CompetitionModel.fromJson(data);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Failed to load competition details');
    }
  }
}
