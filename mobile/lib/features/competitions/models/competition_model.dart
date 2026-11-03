class CompetitionModel {
  final int id;
  final String title;
  final String? slug;
  final String organizer;
  final String level;
  final String? category;
  final String description;
  final String? registrationDeadline;
  final int minTeamMembers;
  final int maxTeamMembers;
  final String? sourceUrl;
  final String verificationStatus;
  final List<String> skills;

  CompetitionModel({
    required this.id,
    required this.title,
    this.slug,
    required this.organizer,
    required this.level,
    this.category,
    required this.description,
    this.registrationDeadline,
    required this.minTeamMembers,
    required this.maxTeamMembers,
    this.sourceUrl,
    required this.verificationStatus,
    this.skills = const [],
  });

  factory CompetitionModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedSkills = [];
    if (json['skills'] is List) {
      for (var s in json['skills']) {
        if (s is String) {
          parsedSkills.add(s);
        } else if (s is Map && s.containsKey('name')) {
          parsedSkills.add(s['name'] as String);
        }
      }
    }

    return CompetitionModel(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String?,
      organizer: json['organizer'] as String? ?? 'Penyelenggara Kompetisi',
      level: json['level'] as String? ?? 'national',
      category: json['category'] as String?,
      description: json['description'] as String? ?? '',
      registrationDeadline: json['registration_deadline'] as String?,
      minTeamMembers: (json['min_team_members'] as num?)?.toInt() ?? 1,
      maxTeamMembers: (json['max_team_members'] as num?)?.toInt() ?? 5,
      sourceUrl: json['source_url'] as String?,
      verificationStatus: json['verification_status'] as String? ?? 'verified',
      skills: parsedSkills,
    );
  }
}
