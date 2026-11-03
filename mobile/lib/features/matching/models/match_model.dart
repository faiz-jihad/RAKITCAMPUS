class MatchScoreBreakdown {
  final double skillScore;
  final double roleScore;
  final double availabilityScore;
  final double interestScore;

  MatchScoreBreakdown({
    required this.skillScore,
    required this.roleScore,
    required this.availabilityScore,
    required this.interestScore,
  });

  factory MatchScoreBreakdown.fromJson(Map<String, dynamic> json) {
    return MatchScoreBreakdown(
      skillScore: (json['skill_score'] as num?)?.toDouble() ?? 0.0,
      roleScore: (json['role_score'] as num?)?.toDouble() ?? 0.0,
      availabilityScore: (json['availability_score'] as num?)?.toDouble() ?? 0.0,
      interestScore: (json['interest_score'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class MatchRecommendationModel {
  final int candidateId;
  final String name;
  final String? nim;
  final String? major;
  final String? avatarUrl;
  final String? headline;
  final double totalScore;
  final MatchScoreBreakdown breakdown;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final String explanation;

  MatchRecommendationModel({
    required this.candidateId,
    required this.name,
    this.nim,
    this.major,
    this.avatarUrl,
    this.headline,
    required this.totalScore,
    required this.breakdown,
    this.matchedSkills = const [],
    this.missingSkills = const [],
    required this.explanation,
  });

  factory MatchRecommendationModel.fromJson(Map<String, dynamic> json) {
    final candidate = json['candidate'] as Map<String, dynamic>? ?? {};
    final profile = candidate['student_profile'] as Map<String, dynamic>? ?? {};

    List<String> matched = [];
    if (json['matched_skills'] is List) {
      matched = (json['matched_skills'] as List).map((e) => e.toString()).toList();
    }

    List<String> missing = [];
    if (json['missing_skills'] is List) {
      missing = (json['missing_skills'] as List).map((e) => e.toString()).toList();
    }

    return MatchRecommendationModel(
      candidateId: (candidate['id'] as num?)?.toInt() ?? 0,
      name: candidate['name'] as String? ?? 'Mahasiswa Polindra',
      nim: profile['nim'] as String?,
      major: profile['major'] as String?,
      avatarUrl: profile['avatar_url'] as String?,
      headline: profile['headline'] as String?,
      totalScore: (json['total_score'] as num?)?.toDouble() ?? 0.0,
      breakdown: MatchScoreBreakdown.fromJson(json['breakdown'] as Map<String, dynamic>? ?? {}),
      matchedSkills: matched,
      missingSkills: missing,
      explanation: json['explanation'] as String? ?? 'Rekomendasi kolaborasi sepadan berdasarkan keahlian.',
    );
  }
}
