import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Pagination } from '../../models';

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(path: string, params?: QueryParams): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.base}/${path}`, { params: this.buildParams(params) });
  }

  getPaginated<T>(path: string, params?: QueryParams): Observable<PaginatedResponse<T>> {
    return this.http.get<PaginatedResponse<T>>(`${this.base}/${path}`, { params: this.buildParams(params) });
  }

  post<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.base}/${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.base}/${path}`, body);
  }

  patch<T>(path: string, body: unknown = {}): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.base}/${path}`, body);
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.base}/${path}`);
  }

  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return httpParams;
  }
}

export type { Pagination };
