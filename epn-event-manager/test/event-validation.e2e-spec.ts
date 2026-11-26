import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import supertest from 'supertest';
import { EventsModule } from '../src/modules/events/events.module';

describe('Validación de eventos (e2e)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof supertest>;
  const event = {
    source: 'crud-planetas',
    entity: 'planet',
    action: 'create',
    title: 'Planeta registrado',
  };

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

  it.each([
    { action: 42 },
    { action: 'UPSERT' },
    { source: undefined },
    { source: 's'.repeat(101) },
    { entity: '   ' },
    { title: 't'.repeat(201) },
    { description: 'd'.repeat(1001) },
    { payload: ['Marte'] },
  ])('rechaza el evento cuando recibe %p', async (invalidFields) => {
    await request
      .post('/events')
      .send({ ...event, source: 'crud-invalido', ...invalidFields })
      .expect(400);
  });

  it('rechaza cuerpos JSON que superan el límite de Express', async () => {
    await request
      .post('/events')
      .send({ ...event, payload: { text: 'x'.repeat(100 * 1024) } })
      .expect(413);
  });

  it('acepta una acción en minúsculas y guarda los datos de un CRUD', async () => {
    const payload = { id: 4, name: 'Marte' };
    await request
      .post('/events')
      .send({ ...event, payload })
      .expect(201, { ok: true });
    await request
      .get(`/events/source/${event.source}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual([
          expect.objectContaining({
            ...event,
            payload: JSON.stringify(payload),
          }),
        ]);
      });
  });
});
