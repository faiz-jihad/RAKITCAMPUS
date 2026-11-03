import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/dio_client.dart';
import '../models/profile_model.dart';

class ProfileRepository {
  final Dio _dio;

  ProfileRepository({Dio? dio}) : _dio = dio ?? DioClient.createDio();

  Future<ProfileModel> getProfile() async {
    try {
      final response = await _dio.get(ApiConstants.profile);
      final Map<String, dynamic> data = response.data['user'] ?? response.data['data'] ?? response.data;
      return ProfileModel.fromJson(data);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Failed to load profile');
    }
  }

  Future<ProfileModel> updateProfile({
    String? headline,
    String? bio,
    String? portfolioUrl,
    String? githubUrl,
    String? linkedinUrl,
  }) async {
    try {
      final response = await _dio.put(
        ApiConstants.profile,
        data: {
          if (headline != null) 'headline': headline,
          if (bio != null) 'bio': bio,
          if (portfolioUrl != null) 'portfolio_url': portfolioUrl,
          if (githubUrl != null) 'github_url': githubUrl,
          if (linkedinUrl != null) 'linkedin_url': linkedinUrl,
        },
      );
      final Map<String, dynamic> data = response.data['user'] ?? response.data['data'] ?? response.data;
      return ProfileModel.fromJson(data);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Gagal memperbarui profil');
    }
  }
}
