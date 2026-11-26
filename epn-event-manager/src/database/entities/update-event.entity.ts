import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('update_events')
export class UpdateEventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  entity: string;

  @Column({ nullable: true })
  action: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  payload: string;

  // Los nuevos registros usan ISO 8601 en UTC; pueden existir fechas locales antiguas.
  @Column({ nullable: true })
  timestamp: string;
}
