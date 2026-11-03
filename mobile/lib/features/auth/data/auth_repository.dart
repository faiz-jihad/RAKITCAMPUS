import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/dio_client.dart';
import '../models/user_model.dart';

class AuthRepository {
  final Dio _dio;

  AuthRepository({Dio? dio}) : _dio = dio ?? DioClient.createDio();

  Future<UserModel> login(String email, String password) async {
    try {
      final response = await _dio.post(
        ApiConstants.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = response.data;
      final token = data['token'] as String;
      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(ApiConstants.tokenKey, token);
      await prefs.setString(ApiConstants.userKey, jsonEncode(user.toJson()));

      return user;
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ?? 'Login failed. Please check your credentials.';
      throw Exception(message);
    }
  }

  Future<UserModel> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirmation,
    required int campusId,
    required String nim,
    required String major,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.register,
        data: {
          'name': name,
          'email': email,
          'password': password,
          'password_confirmation': passwordConfirmation,
          'campus_id': campusId,
          'nim': nim,
          'major': major,
        },
      );

      final data = response.data;
      final token = data['token'] as String;
      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(ApiConstants.tokenKey, token);
      await prefs.setString(ApiConstants.userKey, jsonEncode(user.toJson()));

      return user;
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ?? 'Registration failed.';
      throw Exception(message);
    }
  }

  Future<UserModel?> getMe() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(ApiConstants.tokenKey);
      if (token == null) return null;

      final response = await _dio.get(ApiConstants.me);
      final user = UserModel.fromJson(response.data['user'] as Map<String, dynamic>);
      await prefs.setString(ApiConstants.userKey, jsonEncode(user.toJson()));
      return user;
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post(ApiConstants.logout);
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(ApiConstants.tokenKey);
      await prefs.remove(ApiConstants.userKey);
    }
  }

  Future<String?> getStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(ApiConstants.tokenKey);
  }
}
