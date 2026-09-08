class UserModel {
  const UserModel({
    required this.id,
    required this.phone,
    required this.fullName,
    this.email,
    required this.status,
    required this.preferredLanguage,
  });
  final String id;
  final String phone;
  final String? email;
  final String fullName;
  final String status;
  final String preferredLanguage;
  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id: json['id'] as String,
    phone: json['phone'] as String,
    email: json['email'] as String?,
    fullName: json['fullName'] as String,
    status: json['status'] as String,
    preferredLanguage: json['preferredLanguage'] as String? ?? 'bn',
  );
}
