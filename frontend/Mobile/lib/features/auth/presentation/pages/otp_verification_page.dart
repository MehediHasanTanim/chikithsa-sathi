import 'package:chamber_management/app/router/route_paths.dart';
import 'package:chamber_management/features/auth/presentation/providers/auth_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OtpVerificationPage extends ConsumerStatefulWidget {
  const OtpVerificationPage({super.key, this.phone, this.channel = 'sms'});
  final String? phone;
  final String channel;

  @override
  ConsumerState<OtpVerificationPage> createState() =>
      _OtpVerificationPageState();
}

class _OtpVerificationPageState extends ConsumerState<OtpVerificationPage> {
  final _formKey = GlobalKey<FormState>();
  final _otp = TextEditingController();

  @override
  void dispose() {
    _otp.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final phone = widget.phone ?? auth.pendingPhone;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Spacer(),
                    const Icon(
                      Icons.phonelink_lock_outlined,
                      size: 72,
                      color: Color(0xFF009688),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'OTP যাচাই করুন',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      phone == null
                          ? 'আপনার ৬ ডিজিটের কোডটি লিখুন'
                          : '$phone নম্বরে পাঠানো ৬ ডিজিটের কোডটি লিখুন',
                    ),
                    const SizedBox(height: 28),
                    TextFormField(
                      controller: _otp,
                      autofocus: true,
                      maxLength: 6,
                      textAlign: TextAlign.center,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: const InputDecoration(
                        labelText: '৬ ডিজিটের OTP',
                        counterText: '',
                      ),
                      validator: (value) =>
                          RegExp(r'^\d{6}$').hasMatch(value ?? '')
                          ? null
                          : '৬ ডিজিটের OTP লিখুন',
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
                    const SizedBox(height: 16),
                    Center(
                      child: TextButton(
                        onPressed: auth.isSubmitting || phone == null
                            ? null
                            : () => _resend(phone),
                        child: Text(
                          'কোডটি পাননি? আবার ${widget.channel == 'email' ? 'ইমেইল' : 'SMS'} করুন',
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: auth.isSubmitting || phone == null
                            ? null
                            : () => _verify(phone),
                        child: auth.isSubmitting
                            ? const SizedBox.square(
                                dimension: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('যাচাই করুন'),
                      ),
                    ),
                    const Spacer(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _verify(String phone) async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final verified = await ref
        .read(authControllerProvider.notifier)
        .verifyRegistrationOtp(phone: phone, otp: _otp.text);
    if (verified && mounted) context.go(RoutePaths.login);
  }

  Future<void> _resend(String phone) async {
    final sent = await ref
        .read(authControllerProvider.notifier)
        .resendRegistrationOtp(phone: phone, otpChannel: widget.channel);
    if (sent && mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('নতুন OTP পাঠানো হয়েছে')));
    }
  }
}
