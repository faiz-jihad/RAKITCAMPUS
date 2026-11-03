class RecruitmentRoleModel {
  final int id;
  final String roleName;
  final int slotsTotal;
  final int slotsFilled;
  final String? description;
  final List<String> skills;

  RecruitmentRoleModel({
    required this.id,
    required this.roleName,
    required this.slotsTotal,
    required this.slotsFilled,
    this.description,
    this.skills = const [],
  });

  factory RecruitmentRoleModel.fromJson(Map<String, dynamic> json) {
    var rawSkills = json['skills'];
    List<String> parsedSkills = [];
    if (rawSkills is List) {
      for (var s in rawSkills) {
        if (s is String) {
          parsedSkills.add(s);
        } else if (s is Map && s.containsKey('name')) {
          parsedSkills.add(s['name'] as String);
        }
      }
    }

    return RecruitmentRoleModel(
      id: json['id'] as int,
      roleName: json['role_name'] as String? ?? 'Anggota Tim',
      slotsTotal: (json['slots_total'] as num?)?.toInt() ?? 1,
      slotsFilled: (json['slots_filled'] as num?)?.toInt() ?? 0,
      description: json['description'] as String?,
      skills: parsedSkills,
    );
  }
}

class ProjectModel {
  final int id;
  final String title;
  final String? slug;
  final String description;
  final String category;
  final String status;
  final int maxMembers;
  final String? leaderName;
  final String? campusName;
  final List<String> skills;
  final List<RecruitmentRoleModel> openRoles;

  ProjectModel({
    required this.id,
    required this.title,
    this.slug,
    required this.description,
    required this.category,
    required this.status,
    required this.maxMembers,
    this.leaderName,
    this.campusName,
    this.skills = const [],
    this.openRoles = const [],
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    // Skills
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

    // Open Roles
    List<RecruitmentRoleModel> parsedRoles = [];
    if (json['recruitment'] != null && json['recruitment']['roles'] is List) {
      parsedRoles = (json['recruitment']['roles'] as List)
          .map((r) => RecruitmentRoleModel.fromJson(r as Map<String, dynamic>))
          .toList();
    } else if (json['roles'] is List) {
      parsedRoles = (json['roles'] as List)
          .map((r) => RecruitmentRoleModel.fromJson(r as Map<String, dynamic>))
          .toList();
    }

    return ProjectModel(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String?,
      description: json['description'] as String? ?? '',
      category: json['category'] as String? ?? 'general',
      status: json['status'] as String? ?? 'published',
      maxMembers: (json['max_members'] as num?)?.toInt() ?? 5,
      leaderName: json['leader']?['name'] as String?,
      campusName: json['campus']?['name'] as String?,
      skills: parsedSkills,
      openRoles: parsedRoles,
    );
  }
}
