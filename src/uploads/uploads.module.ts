import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controllers';

@Module({
  controllers: [UploadsController],
})
export class UploadsModule {}
