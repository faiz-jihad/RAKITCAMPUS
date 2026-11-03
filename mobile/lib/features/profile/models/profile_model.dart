class ProfileSkillModel {
  final int id;
  final String name;
  final String? type; // technical / soft
  final String? proficiency; // beginner, intermediate, advanced, expert

  ProfileSkillModel({
    required this.id,
    required this.name,
    this.type,
    this.proficiency,
  });

  factory ProfileSkillModel.fromJson(Map<String, dynamic> json) {
    return ProfileSkillModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: json['name'] as String? ?? '',
      type: json['type'] as String?,
      proficiency: json['pivot']?['proficiency_level'] as String? ?? json['proficiency'] as String?,
    );
  }
}

class ProfileModel {
  final int id;
  final String name;
  final String email;
  final String? campusName;
  final String? nim;
  final String? major;
  final String? batch;
  final String? headline;
  final String? bio;
  final String? avatarUrl;
  final String? portfolioUrl;
  final String? githubUrl;
  final String? linkedinUrl;
  final List<ProfileSkillModel> skills;

  ProfileModel({
    required this.id,
    required this.name,
    required this.email,
    this.campusName,
    this.nim,
    this.major,
    this.batch,
    this.headline,
    this.bio,
    this.avatarUrl,
    this.portfolioUrl,
    this.githubUrl,
    this.linkedinUrl,
    this.skills = const [],
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    final profile = json['student_profile'] as Map<String, dynamic>? ?? {};

    List<ProfileSkillModel> skills = [];
    if (json['skills'] is List) {
      skills = (json['skills'] as List)
          .map((s) => ProfileSkillModel.fromJson(s as Map<String, dynamic>))
          .toList();
    } else if (profile['skills'] is List) {
      skills = (profile['skills'] as List)
          .map((s) => ProfileSkillModel.fromJson(s as Map<String, dynamic>))
          .toList();
    }

    return ProfileModel(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      campusName: json['campus']?['name'] as String?,
      nim: profile['nim'] as String?,
      major: profile['major'] as String?,
      batch: profile['batch'] as String?,
      headline: profile['headline'] as String?,
      bio: profile['bio'] as String?,
      avatarUrl: profile['avatar_url'] as String?,
      portfolioUrl: profile['portfolio_url'] as String?,
      githubUrl: profile['github_url'] as String?,
      linkedinUrl: profile['linkedin_url'] as String?,
      skills: skills,
    );
  }
}
