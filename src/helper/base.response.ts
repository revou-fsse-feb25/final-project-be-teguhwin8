/* eslint-disable @typescript-eslint/no-unused-vars */
// base-response.dto.ts

import { HttpCode } from '@nestjs/common';

export class BaseResponse {
  constructor(
    public httpCode: number,
    public status: string,
    public message?: string,
    public metadata?: any,
  ) {}
}

export function OK(message?: string) {
  console.log(new BaseResponse(200, 'OK', message));
}

export function Created(message?: string) {
  console.log(new BaseResponse(201, 'Created', message));
}

export function Accepted(message?: string) {
  console.log(new BaseResponse(202, 'Accepted', message));
}

export function InternalServerError(message?: string) {
  console.log(new BaseResponse(500, 'Internal Server Error', message));
}

export function NotFound(message?: string) {
  console.log(new BaseResponse(404, 'Not Found', message));
}

export function BadRequest(message?: string) {
  console.log(new BaseResponse(400, 'Bad Request', message));
}
