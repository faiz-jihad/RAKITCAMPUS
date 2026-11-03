class ApiConstants {
  // Use 10.0.2.2 for Android emulator, 127.0.0.1 for desktop/web/iOS sim
  static const String baseUrl = 'http://127.0.0.1:8000/api/v1';
  
  // Storage keys
  static const String tokenKey = 'rakit_auth_token';
  static const String userKey = 'rakit_auth_user';

  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';
  static const String logout = '/auth/logout';

  // Project endpoints
  static const String projects = '/projects';
  static String projectDetail(dynamic id) => '/projects/$id';
  static String projectApply(dynamic id) => '/projects/$id/apply';

  // Competition endpoints
  static const String competitions = '/competitions';
  static String competitionDetail(dynamic id) => '/competitions/$id';

  // Matching endpoints
  static const String recommendations = '/matching/recommendations';

  // Workspace endpoints
  static String teamWorkspace(dynamic teamId) => '/teams/$teamId/workspace';
  static String updateTaskStatus(dynamic teamId, dynamic taskId) => '/teams/$teamId/tasks/$taskId/status';

  // Profile endpoints
  static const String profile = '/profile';
}
