import { HealthController } from './health.controller';

describe('HealthController: contrato de fechas UTC', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('devuelve el instante UTC con el mismo campo timestamp', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-25T20:30:00-05:00'));

    expect(new HealthController().check()).toEqual({
      status: 'ok',
      timestamp: '2026-11-26T01:30:00.000Z',
    });
  });
});
