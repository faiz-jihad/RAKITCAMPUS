class UserModel {
  final int id;
  final String name;
  final String email;
  final String? globalRole;
  final int? campusId;
  final String? nim;
  final String? major;
  final String? avatarUrl;
  final String? headline;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.globalRole,
    this.campusId,
    this.nim,
    this.major,
    this.avatarUrl,
    this.headline,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final profile = json['student_profile'] as Map<String, dynamic>?;
    return UserModel(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      globalRole: json['global_role'] as String?,
      campusId: json['campus_id'] as int?,
      nim: profile?['nim'] as String?,
      major: profile?['major'] as String?,
      avatarUrl: profile?['avatar_url'] as String?,
      headline: profile?['headline'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'global_role': globalRole,
      'campus_id': campusId,
      'nim': nim,
      'major': major,
      'avatar_url': avatarUrl,
      'headline': headline,
    };
  }
}
