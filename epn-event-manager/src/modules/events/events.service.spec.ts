import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateEventEntity } from '../../database/entities/create-event.entity';
import { UpdateEventEntity } from '../../database/entities/update-event.entity';
import { DeleteEventEntity } from '../../database/entities/delete-event.entity';
import { QueryEventEntity } from '../../database/entities/query-event.entity';
import { EventsService } from './events.service';

function repositoryMock() {
  return {
    create: jest.fn((event: object) => event),
    save: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockResolvedValue([]),
    findBy: jest.fn().mockResolvedValue([]),
  };
}

describe('EventsService: contrato de fechas UTC', () => {
  const utcDate = '2026-11-26T01:30:00.000Z';
  let service: EventsService;
  let repositories: ReturnType<typeof repositoryMock>[];

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-25T20:30:00-05:00'));
    repositories = Array.from({ length: 4 }, repositoryMock);
    const entities = [
      CreateEventEntity,
      UpdateEventEntity,
      DeleteEventEntity,
      QueryEventEntity,
    ];
    const module = await Test.createTestingModule({
      providers: [
        EventsService,
        ...entities.map((entity, index) => ({
          provide: getRepositoryToken(entity),
          useValue: repositories[index],
        })),
      ],
    }).compile();
    service = module.get(EventsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    ['CREATE', 0, 'recorded_at'],
    ['UPDATE', 1, 'timestamp'],
    ['QUERY', 3, 'event_date'],
  ] as const)('persiste %s con fecha ISO en UTC', async (action, index, field) => {
    const dto = {
      source: 'crud-planetas',
      entity: 'planet',
      action,
      title: 'Actividad del planeta',
      description: 'Evento de integracion',
      payload: { id: 4, name: 'Marte' },
    };
    const expected = {
      ...dto,
      payload: JSON.stringify(dto.payload),
      [field]: utcDate,
    };

    await expect(service.registerEvent(dto)).resolves.toEqual({ ok: true });
    expect(repositories[index].create).toHaveBeenCalledWith(expected);
    expect(repositories[index].save).toHaveBeenCalledWith(expected);
  });

  it('construye DELETE con el mismo formato UTC', async () => {
    await service.registerEvent({
      source: 'crud-planetas',
      entity: 'planet',
      action: 'DELETE',
      title: 'Planeta eliminado',
      description: 'Se elimino Marte',
      payload: { id: 4 },
    });

    expect(repositories[2].create).toHaveBeenCalledWith(
      expect.objectContaining({ createdAt: utcDate }),
    );
  });

  it.each(['historial', 'source', 'entity'] as const)(
    'conserva las fechas UTC y las historicas al consultar %s',
    async (query) => {
      const events = [
        { id: 1, source: 'crud-planetas', entity: 'planet', recorded_at: utcDate },
        {
          id: 2,
          source: 'crud-planetas',
          entity: 'planet',
          recorded_at: '11/25/2026, 8:00:00 PM',
        },
      ];
      repositories[0].find.mockResolvedValue(events);
      repositories[0].findBy.mockResolvedValue(events);

      const result =
        query === 'historial'
          ? await service.findAll()
          : query === 'source'
            ? await service.findBySource('crud-planetas')
            : await service.findByEntity('planet');

      expect(result).toEqual(
        expect.arrayContaining(events.map((event) => expect.objectContaining(event))),
      );
      if (query !== 'historial') {
        const filter =
          query === 'source' ? { source: 'crud-planetas' } : { entity: 'planet' };
        for (const repository of repositories) {
          expect(repository.findBy).toHaveBeenCalledWith(filter);
        }
      }
    },
  );
});
