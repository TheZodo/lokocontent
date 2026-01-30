import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcome() {
    return {
      name: 'Lokocontent API',
      version: '0.0.1',
      documentation: '/api/docs',
    };
  }
}
