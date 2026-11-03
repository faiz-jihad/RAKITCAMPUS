import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../projects/presentation/project_list_screen.dart';
import '../../competitions/presentation/competition_list_screen.dart';
import '../../matching/presentation/matching_screen.dart';
import '../../workspace/presentation/kanban_board_screen.dart';
import '../../profile/presentation/profile_screen.dart';

class MainNavScreen extends StatefulWidget {
  final int initialIndex;

  const MainNavScreen({super.key, this.initialIndex = 0});

  @override
  State<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends State<MainNavScreen> {
  late int _currentIndex;

  final List<Widget> _screens = const [
    ProjectListScreen(),
    CompetitionListScreen(),
    MatchingScreen(),
    KanbanBoardScreen(teamId: 1),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
        },
        backgroundColor: Colors.white,
        elevation: 2,
        indicatorColor: AppTheme.primaryLight.withAlpha(51),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            selectedIcon: Icon(Icons.folder, color: AppTheme.primary),
            label: 'Proyek',
          ),
          NavigationDestination(
            icon: Icon(Icons.emoji_events_outlined),
            selectedIcon: Icon(Icons.emoji_events, color: AppTheme.primary),
            label: 'Kompetisi',
          ),
          NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined),
            selectedIcon: Icon(Icons.auto_awesome, color: AppTheme.primary),
            label: 'Matching',
          ),
          NavigationDestination(
            icon: Icon(Icons.view_kanban_outlined),
            selectedIcon: Icon(Icons.view_kanban, color: AppTheme.primary),
            label: 'Workspace',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppTheme.primary),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
