import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { EventsController } from '../modules/events/events.controller';
import { EventsService } from '../modules/events/events.service';
import { HealthController } from '../modules/health/health.controller';
import { getCorsOptions } from './cors.config';

describe('Integracion CORS para clientes web', () => {
  let app: INestApplication;
  let appWithoutOrigins: INestApplication;
  const eventsService = {
    registerEvent: jest.fn().mockResolvedValue({ ok: true }),
  };

  async function createApp(origins: string): Promise<INestApplication> {
    const module = await Test.createTestingModule({
      controllers: [HealthController, EventsController],
      providers: [{ provide: EventsService, useValue: eventsService }],
    }).compile();
    const application = module.createNestApplication();
    application.enableCors(getCorsOptions(origins));
    await application.init();
    return application;
  }

  function request(application = app) {
    return supertest(
      application.getHttpServer() as Parameters<typeof supertest>[0],
    );
  }

  beforeAll(async () => {
    app = await createApp(' http://localhost:4200, ,http://localhost:5173, ');
    appWithoutOrigins = await createApp(' , ');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app?.close();
    await appWithoutOrigins?.close();
  });

  it('lee los origenes desde la variable de entorno', () => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      CORS_ORIGINS: 'https://crud.example.com',
    });

    expect(getCorsOptions().origin).toEqual(['https://crud.example.com']);
  });

  it.each(['http://localhost:4200', 'http://localhost:5173'])(
    'permite consultar desde el origen configurado %s',
    async (origin) => {
      await request()
        .get('/health')
        .set('Origin', origin)
        .expect(200)
        .expect('Access-Control-Allow-Origin', origin);
    },
  );

  it('responde al preflight de POST JSON sin registrar un evento', async () => {
    eventsService.registerEvent.mockClear();

    await request()
      .options('/events')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(204)
      .expect('Access-Control-Allow-Origin', 'http://localhost:5173')
      .expect('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
      .expect('Access-Control-Allow-Headers', 'Content-Type');

    expect(eventsService.registerEvent).not.toHaveBeenCalled();
  });

  it('conserva el cuerpo y la respuesta del registro de eventos', async () => {
    const dto = {
      source: 'crud-planetas',
      entity: 'planet',
      action: 'CREATE',
      title: 'Planeta creado',
      description: 'Se creo Marte',
      payload: { id: 4, name: 'Marte' },
    };

    await request()
      .post('/events')
      .set('Origin', 'http://localhost:5173')
      .send(dto)
      .expect(201)
      .expect('Access-Control-Allow-Origin', 'http://localhost:5173')
      .expect({ ok: true });

    expect(eventsService.registerEvent).toHaveBeenCalledWith(dto);
  });

  it.each(['http://localhost:5174', 'https://crud.example.com'])(
    'no concede permiso CORS al origen no configurado %s',
    async (origin) => {
      const response = await request()
        .options('/events')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type')
        .expect(204);

      expect(response.headers).not.toHaveProperty(
        'access-control-allow-origin',
      );
    },
  );

  it('mantiene las consultas de clientes sin cabecera Origin', async () => {
    const response = await request().get('/health').expect(200);

    expect(response.headers).not.toHaveProperty('access-control-allow-origin');
  });

  it('no habilita origenes cuando la configuracion esta vacia', async () => {
    const response = await request(appWithoutOrigins)
      .get('/health')
      .set('Origin', 'http://localhost:5173')
      .expect(200);

    expect(response.headers).not.toHaveProperty('access-control-allow-origin');
  });
});
