// src/guards/cron.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class CronGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const cronToken = '5fcd23e8-9b6a-4d2d-8a12-7c91b6d1b9ef';
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;
    if (!cronToken || !token || token !== cronToken) {
      throw new UnauthorizedException('Invalid or missing cron token');
    }
    return true;
  }
}
