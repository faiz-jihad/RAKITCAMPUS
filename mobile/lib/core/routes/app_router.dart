import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/home/presentation/main_nav_screen.dart';
import '../../features/projects/presentation/project_detail_screen.dart';
import '../../features/competitions/presentation/competition_detail_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const MainNavScreen(),
      ),
      GoRoute(
        path: '/projects/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '1';
          return ProjectDetailScreen(projectId: id);
        },
      ),
      GoRoute(
        path: '/competitions/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '1';
          return CompetitionDetailScreen(competitionId: id);
        },
      ),
      GoRoute(
        path: '/matching',
        builder: (context, state) => const MainNavScreen(initialIndex: 2),
      ),
      GoRoute(
        path: '/workspace',
        builder: (context, state) => const MainNavScreen(initialIndex: 3),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const MainNavScreen(initialIndex: 4),
      ),
    ],
  );
});
