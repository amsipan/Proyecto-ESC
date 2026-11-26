import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import supertest from 'supertest';
import { EventsModule } from '../src/modules/events/events.module';

describe('Registro de eventos (e2e)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        EventsModule,
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    request = supertest(app.getHttpServer() as Parameters<typeof supertest>[0]);
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each(['CREATE', 'UPDATE', 'QUERY', 'DELETE'])(
    'guarda el evento %s antes de confirmar el registro',
    async (action) => {
      const event = {
        source: `crud-planetas-${action.toLowerCase()}`,
        entity: 'planet',
        action,
        title: `Registro de ${action}`,
        description: 'Evento enviado por el CRUD de planetas',
        payload: { id: 4, name: 'Marte' },
      };

      await request.post('/events').send(event).expect(201, { ok: true });
      await request
        .get(`/events/source/${event.source}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual([
            expect.objectContaining({
              source: event.source,
              entity: event.entity,
              action,
              title: event.title,
              payload: JSON.stringify(event.payload),
            }),
          ]);
        });
    },
  );
});
