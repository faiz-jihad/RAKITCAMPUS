import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import 'auth_controller.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _nimController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String _selectedMajor = 'Teknik Informatika';
  final int _campusId = 1; // Polindra pilot

  final List<String> _majors = [
    'Teknik Informatika',
    'Rekayasa Perangkat Lunak',
    'Sistem Informasi Kota Cerdas',
    'Teknik Pendingin & Tata Udara',
    'Teknik Mesin',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _nimController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (_formKey.currentState?.validate() ?? false) {
      final success = await ref.read(authControllerProvider.notifier).register(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            password: _passwordController.text,
            passwordConfirmation: _confirmPasswordController.text,
            campusId: _campusId,
            nim: _nimController.text.trim(),
            major: _selectedMajor,
          );
      if (success && mounted) {
        context.go('/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Daftar Akun Mahasiswa'),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (authState.errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.danger),
                        ),
                        child: Text(
                          authState.errorMessage!,
                          style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Nama Lengkap',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Nama wajib diisi' : null,
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(
                        labelText: 'Email Kampus (.ac.id)',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                      keyboardType: TextInputType.emailAddress,
                      validator: (val) => val == null || val.isEmpty ? 'Email wajib diisi' : null,
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _nimController,
                      decoration: const InputDecoration(
                        labelText: 'Nomor Induk Mahasiswa (NIM)',
                        prefixIcon: Icon(Icons.badge_outlined),
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'NIM wajib diisi' : null,
                    ),
                    const SizedBox(height: 14),

                    DropdownButtonFormField<String>(
                      initialValue: _selectedMajor,
                      decoration: const InputDecoration(
                        labelText: 'Program Studi',
                        prefixIcon: Icon(Icons.school_outlined),
                      ),
                      items: _majors.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedMajor = val);
                      },
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _passwordController,
                      decoration: const InputDecoration(
                        labelText: 'Password (min. 8 karakter)',
                        prefixIcon: Icon(Icons.lock_outline),
                      ),
                      obscureText: true,
                      validator: (val) => val != null && val.length < 8 ? 'Password minimal 8 karakter' : null,
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _confirmPasswordController,
                      decoration: const InputDecoration(
                        labelText: 'Konfirmasi Password',
                        prefixIcon: Icon(Icons.lock_reset),
                      ),
                      obscureText: true,
                      validator: (val) => val != _passwordController.text ? 'Password tidak sama' : null,
                    ),
                    const SizedBox(height: 24),

                    ElevatedButton(
                      onPressed: authState.isLoading ? null : _submit,
                      child: authState.isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Buat Akun Sekarang'),
                    ),
                    const SizedBox(height: 16),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Sudah punya akun? ', style: TextStyle(color: AppTheme.textMuted)),
                        GestureDetector(
                          onTap: () => context.pop(),
                          child: const Text(
                            'Masuk',
                            style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
