import 'auth_tokens_model.dart';
import 'user_model.dart';

class LoginResponseModel {
  const LoginResponseModel({required this.tokens, required this.user});
  final AuthTokensModel tokens;
  final UserModel user;
  factory LoginResponseModel.fromJson(Map<String, dynamic> json) =>
      LoginResponseModel(
        tokens: AuthTokensModel.fromJson(json),
        user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      );
}
