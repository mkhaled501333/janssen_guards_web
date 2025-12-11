import { apiClient } from './client';
import { LoginRequest, UserModel } from '../types';

export async function login(credentials: LoginRequest): Promise<UserModel> {
  const response = await apiClient.get<UserModel>('/users', {
    params: {
      username: credentials.username,
      password: credentials.password,
    },
  });
  return response;
}

export async function checkServerStatus(): Promise<boolean> {
  return apiClient.checkHealth();
}

