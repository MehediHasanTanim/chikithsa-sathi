import 'package:chamber_management/app/router/route_paths.dart';
import 'package:chamber_management/features/auth/presentation/pages/login_page.dart';
import 'package:chamber_management/features/auth/presentation/providers/auth_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  String _channel = 'sms';
  bool _obscurePassword = true;

  @override
  void dispose() {
    _fullName.dispose();
    _phone.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('অ্যাকাউন্ট তৈরি করুন')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  Text(
                    'নতুন অ্যাকাউন্ট তৈরি করুন',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  const Text('নিবন্ধন শেষ করতে একটি OTP পাঠানো হবে।'),
                  const SizedBox(height: 20),
                  const LinearProgressIndicator(value: .5),
                  const SizedBox(height: 24),
                  TextFormField(
                    controller: _fullName,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(
                      labelText: 'পুরো নাম',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (value) => (value ?? '').trim().isEmpty
                        ? 'পুরো নাম লিখুন'
                        : (value!.trim().length > 200
                              ? 'নামটি ২০০ অক্ষরের মধ্যে রাখুন'
                              : null),
                  ),
                  const SizedBox(height: 16),
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
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'ইমেইল ঠিকানা (ঐচ্ছিক)',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                    validator: (value) {
                      final email = (value ?? '').trim();
                      if (_channel == 'email' && email.isEmpty) {
                        return 'ইমেইলে OTP পেতে ইমেইল ঠিকানা দিন';
                      }
                      return email.isEmpty ||
                              RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                                  .hasMatch(email)
                          ? null
                          : 'সঠিক ইমেইল ঠিকানা লিখুন';
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _password,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'শক্তিশালী পাসওয়ার্ড',
                      helperText: 'কমপক্ষে ১২ অক্ষর',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
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
                    validator: (value) {
                      final password = value ?? '';
                      return password.length >= 12 && password.length <= 128
                          ? null
                          : 'পাসওয়ার্ড ১২ থেকে ১২৮ অক্ষরের হতে হবে';
                    },
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'OTP কোথায় পাঠাবেন?',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(
                        value: 'sms',
                        label: Text('SMS'),
                        icon: Icon(Icons.sms_outlined),
                      ),
                      ButtonSegment(
                        value: 'email',
                        label: Text('ইমেইল'),
                        icon: Icon(Icons.email_outlined),
                      ),
                    ],
                    selected: {_channel},
                    onSelectionChanged: auth.isSubmitting
                        ? null
                        : (channels) =>
                              setState(() => _channel = channels.first),
                  ),
                  if (auth.errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        auth.errorMessage!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: auth.isSubmitting ? null : _submit,
                    child: auth.isSubmitting
                        ? const SizedBox.square(
                            dimension: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('OTP পাঠান'),
                  ),
                  TextButton(
                    onPressed: auth.isSubmitting ? null : () => context.pop(),
                    child: const Text('আগেই অ্যাকাউন্ট আছে? সাইন ইন করুন'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final locale = Localizations.localeOf(context).languageCode;
    final phone = _phone.text.trim();
    final registered = await ref
        .read(authControllerProvider.notifier)
        .register(
          phone: phone,
          password: _password.text,
          fullName: _fullName.text.trim(),
          email: _email.text.trim().isEmpty ? null : _email.text.trim(),
          preferredLanguage: locale == 'en' ? 'en' : 'bn',
          otpChannel: _channel,
        );
    if (registered && mounted) {
      context.push(
        '${RoutePaths.otp}?phone=${Uri.encodeComponent(phone)}&channel=$_channel',
      );
    }
  }
}
