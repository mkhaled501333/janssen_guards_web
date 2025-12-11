import { apiClient } from './client';
import {
  CreatePatrolRecordRequest,
  PatrolRecord,
  PaginatedResponse,
  FilterOptions,
} from '../types';

export async function createPatrolRecord(
  record: CreatePatrolRecordRequest
): Promise<void> {
  // Use 3-second timeout for quick failure as per specification
  return apiClient.post('/industerialsecurity', record, { timeout: 3000 });
}

export async function getPatrolRecords(
  params: {
    page?: number;
    limit?: number;
  } & FilterOptions
): Promise<PaginatedResponse<PatrolRecord>> {
  const queryParams: any = {
    page: params.page || 1,
    limit: params.limit || 20,
  };

  if (params.point) queryParams.point = params.point;
  if (params.guardName) queryParams.guardname = params.guardName;
  if (params.startDate) {
    // Convert to Unix timestamp (seconds)
    queryParams.start_date = Math.floor(params.startDate.getTime() / 1000);
    console.log('Start date filter:', {
      date: params.startDate,
      timestamp: queryParams.start_date,
      iso: params.startDate.toISOString(),
    });
  }
  if (params.endDate) {
    // Convert to Unix timestamp (seconds)
    queryParams.end_date = Math.floor(params.endDate.getTime() / 1000);
    console.log('End date filter:', {
      date: params.endDate,
      timestamp: queryParams.end_date,
      iso: params.endDate.toISOString(),
    });
  }
  if (params.hasNotes !== undefined) queryParams.has_notes = params.hasNotes;

  const response = await apiClient.get<PaginatedResponse<any>>('/industerialsecurity', { params: queryParams });
  
  // Normalize the response data - convert string timestamps to numbers
  const normalizedRecords: PatrolRecord[] = response.records.map((record: any) => ({
    ...record,
    time: typeof record.time === 'string' ? parseInt(record.time, 10) : (record.time || 0),
    servertime: typeof record.servertime === 'string' ? parseInt(record.servertime, 10) : (record.servertime || 0),
  }));

  return {
    ...response,
    records: normalizedRecords,
  };
}

export async function getPatrolImage(imageId: string): Promise<Uint8Array | null> {
  if (!imageId) return null;

  try {
    const response = await apiClient.get<ArrayBuffer>('/industerialsecurity', {
      params: { imageid: imageId },
      responseType: 'arraybuffer',
    });

    // Convert ArrayBuffer to Uint8Array
    const imageData = new Uint8Array(response);

    if (imageData.length < 100) {
      console.error('Invalid image data');
      return null;
    }

    return imageData;
  } catch (error) {
    console.error('Failed to load image:', error);
    return null;
  }
}

