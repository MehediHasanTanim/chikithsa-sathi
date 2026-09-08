sealed class Failure implements Exception {
  const Failure(this.message, {this.code});
  final String message;
  final String? code;
}

class NetworkFailure extends Failure {
  const NetworkFailure(super.message, {super.code});
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure(super.message, {super.code});
}

class ForbiddenFailure extends Failure {
  const ForbiddenFailure(super.message, {super.code});
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message, {super.code});
}

class NotFoundFailure extends Failure {
  const NotFoundFailure(super.message, {super.code});
}

class ConflictFailure extends Failure {
  const ConflictFailure(super.message, {super.code});
}

class RateLimitFailure extends Failure {
  const RateLimitFailure(super.message, {super.code});
}

class ServerFailure extends Failure {
  const ServerFailure(super.message, {super.code});
}

class UnknownFailure extends Failure {
  const UnknownFailure(super.message, {super.code});
}
