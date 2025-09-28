import { BaseEntity } from 'src/share/share-entity/base.entity';
import { Entity, Column, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm';
import { AddressEntity } from 'src/modules/addresses/entities/address.entity/address.entity';
import { TeacherProfileEntity } from 'src/modules/teacher-profiles/entities/teacher-profile.entity/teacher-profile.entity';
import { LeaderProfileEntity } from 'src/modules/leader-profiles/entities/leader-profile.entity/leader-profile.entity';
import { ShelteredEntity } from 'src/modules/sheltered/entities/sheltered.entity';

@Entity('shelters')
export class ShelterEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    name: 'time',
    type: 'time',
    nullable: true,
    transformer: {
      to: (v?: string | null) => (v ? (v.length === 5 ? `${v}:00` : v) : v),
      from: (v?: string | null) => (typeof v === 'string' ? v.slice(0, 5) : v),
    },
  })
  time?: string | null;

  @OneToOne(() => AddressEntity, { cascade: true, eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'address_id' })
  address: AddressEntity;

  @OneToMany(() => TeacherProfileEntity, (tp) => tp.shelter, { cascade: false })
  teachers: TeacherProfileEntity[];

  @OneToOne(() => LeaderProfileEntity, (lp) => lp.shelter, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'leader_profile_id' })
  leader: LeaderProfileEntity | null;

  @OneToMany(() => ShelteredEntity, (sheltered) => sheltered.shelter, { cascade: false })
  sheltered: ShelteredEntity[];
}
