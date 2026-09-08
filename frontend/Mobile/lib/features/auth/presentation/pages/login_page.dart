import 'package:chamber_management/app/router/route_paths.dart';
import 'package:chamber_management/features/auth/presentation/providers/auth_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});
  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    ref.listen(authControllerProvider, (_, next) {
      if (next.status == AuthStatus.authenticated) {
        context.go(RoutePaths.dashboard);
      }
    });
    return Scaffold(
      appBar: AppBar(title: const Text('চেম্বার ম্যানেজমেন্ট')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    const Icon(
                      Icons.local_hospital_outlined,
                      size: 64,
                      color: Color(0xFF009688),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'স্বাগতম',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    const Text('আপনার অ্যাকাউন্টে সাইন ইন করুন'),
                    const SizedBox(height: 24),
                    TextFormField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'মোবাইল নম্বর',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                      validator: phoneValidator,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'পাসওয়ার্ড',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          tooltip: _obscurePassword
                              ? 'পাসওয়ার্ড দেখুন'
                              : 'পাসওয়ার্ড লুকান',
                          onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                      validator: (value) =>
                          (value ?? '').isEmpty ? 'পাসওয়ার্ড লিখুন' : null,
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: auth.isSubmitting
                            ? null
                            : () => context.push(RoutePaths.forgotPassword),
                        child: const Text('পাসওয়ার্ড ভুলে গেছেন?'),
                      ),
                    ),
                    if (auth.errorMessage != null)
                      _ErrorMessage(message: auth.errorMessage!),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: auth.isSubmitting ? null : _submit,
                        child: auth.isSubmitting
                            ? const SizedBox.square(
                                dimension: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('সাইন ইন'),
                      ),
                    ),
                    TextButton(
                      onPressed: auth.isSubmitting
                          ? null
                          : () => context.push(RoutePaths.register),
                      child: const Text('নতুন অ্যাকাউন্ট তৈরি করুন'),
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

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    await ref
        .read(authControllerProvider.notifier)
        .login(phone: _phone.text.trim(), password: _password.text);
  }
}

String? phoneValidator(String? value) {
  final phone = (value ?? '').trim();
  return RegExp(r'^(?:\+8801|8801|01)[3-9]\d{8}$').hasMatch(phone)
      ? null
      : 'সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন';
}

class _ErrorMessage extends StatelessWidget {
  const _ErrorMessage({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) => Semantics(
    liveRegion: true,
    child: Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Text(
        message,
        style: TextStyle(color: Theme.of(context).colorScheme.error),
      ),
    ),
  );
}
