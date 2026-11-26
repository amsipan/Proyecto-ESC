import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CreateEventEntity } from '../database/entities/create-event.entity';
import { UpdateEventEntity } from '../database/entities/update-event.entity';
import { DeleteEventEntity } from '../database/entities/delete-event.entity';
import { QueryEventEntity } from '../database/entities/query-event.entity';

export function getDatabaseOptions(
  databasePath = process.env.DATABASE_PATH ?? '',
): TypeOrmModuleOptions {
  return {
    type: 'better-sqlite3',
    database: databasePath.trim() || 'db/events.sqlite',
    entities: [
      CreateEventEntity,
      UpdateEventEntity,
      DeleteEventEntity,
      QueryEventEntity,
    ],
    synchronize: true,
  };
}
