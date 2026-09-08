class User {
  const User({
    required this.id,
    required this.phone,
    required this.fullName,
    this.email,
  });
  final String id;
  final String phone;
  final String fullName;
  final String? email;
}
