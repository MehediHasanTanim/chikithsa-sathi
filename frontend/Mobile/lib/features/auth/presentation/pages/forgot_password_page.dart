import 'package:chamber_management/app/router/route_paths.dart';
import 'package:chamber_management/features/auth/presentation/pages/login_page.dart';
import 'package:chamber_management/features/auth/presentation/providers/auth_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  final _password = TextEditingController();
  String _channel = 'sms';
  bool _codeSent = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _phone.dispose();
    _otp.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  const SizedBox(height: 64),
                  const Icon(
                    Icons.lock_reset_outlined,
                    size: 72,
                    color: Color(0xFF009688),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    _codeSent ? 'নতুন পাসওয়ার্ড দিন' : 'পাসওয়ার্ড ভুলে গেছেন?',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _codeSent ? 'পাঠানো OTP এবং একটি নতুন পাসওয়ার্ড লিখুন।' : 'আপনার নিবন্ধিত নম্বরে বা ইমেইলে একটি OTP পাঠানো হবে।',
                  ),
                  const SizedBox(height: 24),
                  TextFormField(
                    controller: _phone,
                    enabled: !_codeSent && !auth.isSubmitting,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'মোবাইল নম্বর',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    validator: phoneValidator,
                  ),
                  if (!_codeSent) ...[
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
                  ] else ...[
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _otp,
                      maxLength: 6,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: const InputDecoration(
                        labelText: '৬ ডিজিটের OTP',
                        counterText: '',
                        prefixIcon: Icon(Icons.password_outlined),
                      ),
                      validator: (value) =>
                          RegExp(r'^\d{6}$').hasMatch(value ?? '')
                          ? null
                          : '৬ ডিজিটের OTP লিখুন',
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'নতুন পাসওয়ার্ড',
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
                      validator: (value) => (value ?? '').length >= 12
                          ? null
                          : 'পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে',
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: auth.isSubmitting ? null : _sendCode,
                        child: const Text('আবার OTP পাঠান'),
                      ),
                    ),
                  ],
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
                    onPressed: auth.isSubmitting
                        ? null
                        : (_codeSent ? _resetPassword : _sendCode),
                    child: auth.isSubmitting
                        ? const SizedBox.square(
                            dimension: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(
                            _codeSent ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'OTP পাঠান',
                          ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _sendCode() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final sent = await ref
        .read(authControllerProvider.notifier)
        .requestPasswordReset(phone: _phone.text.trim(), otpChannel: _channel);
    if (sent && mounted) setState(() => _codeSent = true);
  }

  Future<void> _resetPassword() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final reset = await ref
        .read(authControllerProvider.notifier)
        .confirmPasswordReset(
          phone: _phone.text.trim(),
          otp: _otp.text,
          password: _password.text,
        );
    if (reset && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('পাসওয়ার্ড পরিবর্তন হয়েছে। এখন সাইন ইন করুন।'),
        ),
      );
      context.go(RoutePaths.login);
    }
  }
}
