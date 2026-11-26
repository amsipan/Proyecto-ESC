import { existsSync, mkdtempSync, rmdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getDatabaseOptions } from '../config/database.config';
import { DatabaseModule } from './database.module';
import { CreateEventEntity } from './entities/create-event.entity';

describe('DatabaseModule: almacenamiento configurable por entorno', () => {
  let module: TestingModule | undefined;
  let temporaryDirectory: string | undefined;
  let databasePath: string | undefined;

  afterEach(async () => {
    await module?.close();
    module = undefined;
    jest.restoreAllMocks();
    if (databasePath && existsSync(databasePath)) {
      unlinkSync(databasePath);
    }
    if (temporaryDirectory) {
      rmdirSync(temporaryDirectory);
    }
    databasePath = undefined;
    temporaryDirectory = undefined;
  });

  it.each([undefined, '', '   '])(
    'mantiene la ruta predeterminada con DATABASE_PATH=%s',
    (value) => {
      jest.replaceProperty(process, 'env', {
        ...process.env,
        DATABASE_PATH: value,
      });

      expect(getDatabaseOptions().database).toBe('db/events.sqlite');
    },
  );

  it('persiste eventos en la ruta configurada y los recupera al reiniciar', async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'epn-event-manager test-'));
    databasePath = join(temporaryDirectory, 'events.sqlite');
    jest.replaceProperty(process, 'env', {
      ...process.env,
      DATABASE_PATH: databasePath,
    });

    module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();
    const dataSource = module.get(DataSource);

    expect(dataSource.options.database).toBe(databasePath);
    expect(existsSync(databasePath)).toBe(true);
    expect(
      dataSource.entityMetadatas.map((entity) => entity.tableName).sort(),
    ).toEqual([
      'create_events',
      'delete_events',
      'query_events',
      'update_events',
    ]);

    const repository = dataSource.getRepository(CreateEventEntity);
    const event = await repository.save(
      repository.create({
        source: 'crud-planetas',
        entity: 'planet',
        action: 'CREATE',
        title: 'Planeta creado',
        description: 'Evento en almacenamiento configurable',
        payload: JSON.stringify({ id: 4, name: 'Marte' }),
        recorded_at: '2026-11-26T01:30:00.000Z',
      }),
    );

    await module.close();
    module = undefined;
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    await expect(
      module
        .get(DataSource)
        .getRepository(CreateEventEntity)
        .findOneBy({ id: event.id }),
    ).resolves.toEqual(event);
  });
});
