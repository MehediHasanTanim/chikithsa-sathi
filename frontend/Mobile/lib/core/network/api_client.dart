import 'package:dio/dio.dart';

abstract interface class ApiClient {
  Future<T> get<T>(String path, {Map<String, dynamic>? queryParameters});
  Future<T> post<T>(String path, {Object? data});
  Future<T> patch<T>(String path, {Object? data});
  Future<T> delete<T>(String path, {Object? data});
}

class DioApiClient implements ApiClient {
  DioApiClient(this._dio);
  final Dio _dio;
  T _data<T>(Response<dynamic> response) => response.data as T;
  @override
  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async =>
      _data(await _dio.get<dynamic>(path, queryParameters: queryParameters));
  @override
  Future<T> post<T>(String path, {Object? data}) async =>
      _data(await _dio.post<dynamic>(path, data: data));
  @override
  Future<T> patch<T>(String path, {Object? data}) async =>
      _data(await _dio.patch<dynamic>(path, data: data));
  @override
  Future<T> delete<T>(String path, {Object? data}) async =>
      _data(await _dio.delete<dynamic>(path, data: data));
}
