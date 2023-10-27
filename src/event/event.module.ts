import { Module, Global } from '@nestjs/common';
import { EventEmitter } from 'events';

@Global()
@Module({
  providers: [EventEmitter],
  exports: [EventEmitter],
})
export class EventsModule {}